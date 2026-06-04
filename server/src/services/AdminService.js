const { Logger } = require('../utils/logger');
const AdminModel = require('../models/AdminModel.js');
const { CONFIG } = require('../config.js');
const { resetGame } = require('../logic/resetGame.js');
const pool = require('../../db.js');
const h3   = require('h3-js');
const DivisionModel = require('../models/DivisionModel.js');
const KingdomModel  = require('../models/KingdomModel.js');
const MapService    = require('../services/MapService.js');
const { bfsExpandTerritory } = require('../logic/playerInit.js');
const { getUniqueDivisionName } = require('../logic/NamingService.js');
const { generateDivisionName }  = require('../logic/CulturalNameGenerator.js');

class AdminService {
    async ResetWorld(req, res) {
        try {
            Logger.action('Acceso administrativo a /admin/reset - Reseteando mundo', req.user.player_id);
            await AdminModel.ResetWorld();
            Logger.action('Mundo reseteado exitosamente', req.user.player_id);
            res.json({ success: true, message: 'Mundo reseteado' });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/reset', method: 'POST', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al resetear mundo' });
        }
    }
    async ResetGame(req, res) {
        try {
            Logger.action('⚠️ RESET DE PARTIDA iniciado por administrador', req.user.player_id);
            await resetGame();
            Logger.action('✅ RESET DE PARTIDA completado: bots eliminados, territorios liberados, jugadores reiniciados', req.user.player_id);
            res.json({ success: true, message: 'Partida reseteada. Los jugadores pueden iniciar una nueva partida.' });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/reset-game', method: 'POST', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al resetear la partida: ' + error.message });
        }
    }
    async GetStats(req, res) {
        try {
            Logger.action('Acceso administrativo a /admin/stats', req.user.player_id);
            const { world, turnConfig, players, territories, messages } = await AdminModel.GetStats();
            res.json({
                success: true,
                stats: {
                    current_turn: world.current_turn,
                    game_date: world.game_date,
                    players: parseInt(players),
                    territories: parseInt(territories),
                    messages: parseInt(messages),
                    turn_interval_seconds: turnConfig.value
                }
            });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/stats', method: 'GET', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
        }
    }
    async ResetExplorations(req, res) {
        try {
            Logger.action('Acceso administrativo a /admin/reset-explorations - Reseteando exploraciones', req.user.player_id);
            await AdminModel.ResetExplorations();
            Logger.action('Exploraciones reseteadas exitosamente', req.user.player_id);
            res.json({ success: true, message: 'Todas las exploraciones han sido reseteadas' });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/reset-explorations', method: 'POST', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al resetear exploraciones' });
        }
    }
    async UpdateConfig(req, res) {
        try {
            const { turn_interval_minutes } = req.body;
            if (!turn_interval_minutes) return res.status(400).json({ success: false, message: 'turn_interval_minutes requerido' });

            const minutes = parseFloat(turn_interval_minutes);
            if (isNaN(minutes) || minutes < 1 || minutes > 60) {
                return res.status(400).json({ success: false, message: 'El intervalo debe estar entre 1 y 60 minutos' });
            }

            const seconds  = Math.round(minutes * 60);
            const intervalMs = seconds * 1000;

            // Next boundary for the new interval — engine will fire there first
            const { msUntilNextBoundary } = require('../utils/gameCalendar');
            const nextBoundaryMs = Date.now() + msUntilNextBoundary(intervalMs);
            const nextBoundaryTs = new Date(nextBoundaryMs).toISOString();

            Logger.action(`Actualizando intervalo de turnos a ${minutes}min (${seconds}s), nuevo epoch: ${nextBoundaryTs}`, req.user.player_id);

            await AdminModel.UpsertConfig('gameplay', 'turn_duration_seconds', seconds);
            await pool.query(
                `UPDATE world_state SET game_epoch_timestamp = $1, current_turn = 0 WHERE id = 1`,
                [nextBoundaryTs]
            );

            Logger.action(`Configuración actualizada: ${minutes}min/turno, epoch=${nextBoundaryTs}`, req.user.player_id);
            res.json({
                success: true,
                message: `Intervalo actualizado a ${minutes} min. El primer turno será a las ${new Date(nextBoundaryMs).toUTCString()}.`
            });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/config', method: 'POST', userId: req.user?.player_id, payload: req.body });
            res.status(500).json({ success: false, message: 'Error al actualizar configuración', error: error.message });
        }
    }
    async GetGameConfig(req, res) {
        try {
            Logger.action('Acceso administrativo a /admin/game-config - Consultando configuración', req.user.player_id);
            res.json({ success: true, config: CONFIG });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/game-config', method: 'GET', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener configuración' });
        }
    }
    /**
     * POST /admin/create-pagus
     * Crea un Pagus completo (centurias + fortaleza + capital) adyacente al territorio del jugador.
     * Pensado para testing — se puede ejecutar múltiples veces.
     */
    async CreateAdminPagus(req, res) {
        const adminId   = req.user.player_id;
        const player_id = parseInt(req.body?.player_id ?? adminId);

        const client = await pool.connect();
        let divisionId = null;
        try {
            await client.query('BEGIN');

            // 1. Verificar jugador y obtener cultura
            const playerRes = await client.query(
                'SELECT culture_id FROM players WHERE player_id = $1',
                [player_id]
            );
            if (!playerRes.rows[0]) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Jugador no encontrado' });
            }
            const cultureId = playerRes.rows[0].culture_id;

            // 2. Obtener todos los hexes del jugador
            const playerHexesRes = await client.query(
                'SELECT h3_index FROM h3_map WHERE player_id = $1',
                [player_id]
            );
            if (playerHexesRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'El jugador no tiene territorio' });
            }
            const playerHexSet = new Set(playerHexesRes.rows.map(r => r.h3_index));

            // 3. Recopilar vecinos ring-1 no pertenecientes al jugador
            const neighborSet = new Set();
            for (const hex of playerHexSet) {
                for (const n of h3.gridDisk(hex, 1)) {
                    if (!playerHexSet.has(n)) neighborSet.add(n);
                }
            }

            // 4. Encontrar un hex libre y colonizable como capital del nuevo pagus
            const freeRes = await client.query(`
                SELECT m.h3_index FROM h3_map m
                JOIN terrain_types t ON m.terrain_type_id = t.terrain_type_id
                WHERE m.h3_index = ANY($1::text[])
                  AND m.player_id IS NULL
                  AND t.is_colonizable = TRUE
                ORDER BY RANDOM()
                LIMIT 1
            `, [[...neighborSet]]);

            const startHex = freeRes.rows[0]?.h3_index;
            if (!startHex) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'No hay hexágonos libres adyacentes a tu territorio' });
            }

            // 5. Número objetivo de centurias (min_fiefs_required del rango Señorío)
            const senorioRank = await DivisionModel.GetSenorioRank(client, cultureId);
            const targetCount = senorioRank?.min_fiefs_required ?? 30;

            // 6. BFS desde startHex para recopilar centurias contiguas
            const { bonusHexes } = await bfsExpandTerritory(client, startHex, targetCount);
            const allHexes = [startHex, ...bonusHexes];

            // 7. Reclamar hexes e inicializar territory_details
            for (const hex of allHexes) {
                await client.query(
                    'UPDATE h3_map SET player_id = $1, last_update = CURRENT_TIMESTAMP WHERE h3_index = $2',
                    [player_id, hex]
                );
                await client.query(
                    `INSERT INTO territory_details (h3_index) VALUES ($1) ON CONFLICT (h3_index) DO NOTHING`,
                    [hex]
                );
            }

            // 8. Colocar fortaleza completada en la capital del pagus
            const lvl2Military = await KingdomModel.GetMilitaryLvl2Building(client, cultureId);
            if (lvl2Military) {
                await KingdomModel.PlaceBuildingCompleted(client, startHex, lvl2Military.id);
            }

            // 9. Crear la división política
            const terrainRow = await client.query(`
                SELECT t.name AS terrain_name, COUNT(*) AS cnt
                FROM h3_map m
                JOIN terrain_types t ON m.terrain_type_id = t.terrain_type_id
                WHERE m.h3_index = ANY($1::text[])
                GROUP BY t.name ORDER BY cnt DESC LIMIT 1
            `, [allHexes]);
            const dominantTerrain = terrainRow.rows[0]?.terrain_name ?? null;
            const baseName        = generateDivisionName(cultureId, startHex, dominantTerrain);
            const divisionName    = await getUniqueDivisionName(client, baseName, player_id);

            const division = await DivisionModel.CreateDivision(client, {
                player_id,
                name:          divisionName,
                noble_rank_id: senorioRank.id,
                capital_h3:    startHex,
            });
            if (!division) throw new Error('No se pudo crear la división política');
            divisionId = division.id;

            // 10. Asignar todas las centurias al pagus
            await DivisionModel.AssignFiefsToDivision(client, divisionId, allHexes);

            await client.query('COMMIT');

            // 11. Generar boundary GeoJSON (fuera de la transacción)
            await MapService.generateDivisionBoundary(divisionId);

            Logger.action(`Admin creó pagus "${divisionName}" (${allHexes.length} centurias, capital ${startHex}) para player ${player_id}`, adminId);
            res.json({
                success:       true,
                division_id:   divisionId,
                division_name: divisionName,
                capital_h3:    startHex,
                hex_count:     allHexes.length,
            });

        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(error, { endpoint: '/admin/create-pagus', userId: adminId, player_id });
            res.status(500).json({ success: false, message: error.message || 'Error al crear comarca' });
        } finally {
            client.release();
        }
    }

    async UpdateGameConfig(req, res) {
        try {
            const { group, key, value } = req.body;
            if (!group || !key || value === undefined) return res.status(400).json({ success: false, message: 'Faltan parámetros' });

            Logger.action(`Acceso administrativo a /admin/game-config - Actualizando ${group}.${key} = ${value}`, req.user.player_id);
            await AdminModel.UpsertConfig(group, key, value);

            // Update in-memory config so changes take effect without restart
            if (!CONFIG[group]) CONFIG[group] = {};
            CONFIG[group][key] = !isNaN(value) ? Number(value) : value;

            Logger.action(`Configuración actualizada: ${group}.${key} = ${value}`, req.user.player_id);
            res.json({ success: true, message: 'Configuración de juego actualizada' });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/game-config', method: 'PUT', userId: req.user?.player_id, payload: req.body });
            res.status(500).json({ success: false, message: 'Error al actualizar configuración de juego' });
        }
    }

    // ── Player Audit ──────────────────────────────────────────────────────────

    async GetPlayerAuditStatus(req, res) {
        const { getAuditStatus } = require('../middleware/auditLogger');
        res.json({ success: true, ...getAuditStatus() });
    }

    async EnablePlayerAudit(req, res) {
        const { setAuditEnabled } = require('../middleware/auditLogger');
        await setAuditEnabled(true);
        Logger.action('Auditoría de jugadores ACTIVADA', req.user.player_id);
        res.json({ success: true, message: 'Auditoría activada' });
    }

    async DisablePlayerAudit(req, res) {
        const { setAuditEnabled } = require('../middleware/auditLogger');
        await setAuditEnabled(false);
        Logger.action('Auditoría de jugadores DESACTIVADA', req.user.player_id);
        res.json({ success: true, message: 'Auditoría desactivada' });
    }

    async GetSuspiciousAlerts(req, res) {
        try {
            const reviewed = req.query.reviewed === 'true';
            const limit    = Math.min(100, parseInt(req.query.limit) || 50);
            const clause   = reviewed ? '' : 'AND reviewed_at IS NULL';
            const result   = await pool.query(
                `SELECT se.id, se.player_id, se.username, se.rule, se.severity,
                        se.details, se.created_at, se.reviewed_at,
                        p.display_name AS display_name
                 FROM suspicious_events se
                 LEFT JOIN players p ON p.player_id = se.player_id
                 WHERE true ${clause}
                 ORDER BY se.created_at DESC
                 LIMIT $1`,
                [limit]
            );
            res.json({ success: true, alerts: result.rows });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/player-audit/alerts', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener alertas' });
        }
    }

    async ReviewAlert(req, res) {
        const alertId = parseInt(req.params.id);
        if (!alertId) return res.status(400).json({ success: false, message: 'ID inválido' });
        try {
            await pool.query(
                `UPDATE suspicious_events SET reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`,
                [req.user.player_id, alertId]
            );
            res.json({ success: true, message: 'Alerta marcada como revisada' });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/player-audit/alerts/:id/review', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al actualizar alerta' });
        }
    }

    async GetAuditStats(req, res) {
        const fs = require('fs');
        const { AUDIT_LOG_FILE } = require('../utils/logger');
        try {
            const minutes  = Math.min(60, parseInt(req.query.minutes) || 10);
            const pid      = req.query.pid ? parseInt(req.query.pid) : null;
            const cutoff   = Date.now() - minutes * 60_000;
            const entries  = [];

            if (fs.existsSync(AUDIT_LOG_FILE)) {
                const lines = fs.readFileSync(AUDIT_LOG_FILE, 'utf8').split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const e = JSON.parse(line);
                        if (new Date(e.ts).getTime() < cutoff) continue;
                        if (pid && e.pid !== pid) continue;
                        entries.push(e);
                    } catch { /* skip */ }
                }
            }

            // Aggregate: actions per player per minute
            const byPlayer = {};
            for (const e of entries) {
                const key = e.pid || 'anon';
                if (!byPlayer[key]) byPlayer[key] = { pid: e.pid, un: e.un, total: 0, by_action: {} };
                byPlayer[key].total++;
                byPlayer[key].by_action[e.action] = (byPlayer[key].by_action[e.action] || 0) + 1;
            }

            const top = Object.values(byPlayer)
                .sort((a, b) => b.total - a.total)
                .slice(0, 20);

            res.json({ success: true, window_minutes: minutes, total_entries: entries.length, top_players: top });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/player-audit/stats', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al generar estadísticas' });
        }
    }

    async ListPlayers(req, res) {
        const { search = '', page = 1, per_page = 30 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(per_page);
        try {
            const searchClause = search
                ? `AND (p.display_name ILIKE $4 OR p.username ILIKE $4)`
                : '';
            const params = [parseInt(per_page), offset, false];
            if (search) params.push(`%${search}%`);

            const { rows } = await pool.query(`
                SELECT
                    p.player_id, p.username, p.display_name, p.role,
                    p.is_blocked, p.blocked_reason, p.deleted,
                    p.is_initialized, p.gold, p.color, p.capital_h3, p.created_at,
                    c.name AS culture_name,
                    COUNT(DISTINCT m.h3_index)::int AS territory_count
                FROM players p
                LEFT JOIN cultures c  ON c.id = p.culture_id
                LEFT JOIN h3_map m    ON m.player_id = p.player_id
                WHERE p.is_ai = $3 AND p.deleted = $3 ${searchClause}
                GROUP BY p.player_id, c.name
                ORDER BY p.created_at DESC
                LIMIT $1 OFFSET $2
            `, params);

            const countParams = [false];
            if (search) countParams.push(`%${search}%`);
            const { rows: cnt } = await pool.query(
                `SELECT COUNT(*)::int AS total FROM players WHERE is_ai = $1 AND deleted = $1${search ? ' AND (display_name ILIKE $2 OR username ILIKE $2)' : ''}`,
                countParams
            );

            return res.json({ success: true, players: rows, total: cnt[0].total });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/players', userId: req.user?.player_id });
            return res.status(500).json({ success: false, message: 'Error al obtener jugadores.' });
        }
    }

    async BlockPlayer(req, res) {
        const { id } = req.params;
        const { block, reason = '' } = req.body;
        if (parseInt(id) === req.user.player_id) {
            return res.status(400).json({ success: false, message: 'No puedes bloquearte a ti mismo.' });
        }
        try {
            const { rowCount } = await pool.query(
                `UPDATE players SET is_blocked = $1, blocked_reason = $2 WHERE player_id = $3 AND is_ai = FALSE`,
                [!!block, reason, id]
            );
            if (rowCount === 0) return res.status(404).json({ success: false, message: 'Jugador no encontrado.' });
            Logger.action(`Jugador ${id} ${block ? 'bloqueado' : 'desbloqueado'} por admin. Motivo: ${reason}`, req.user.player_id);
            return res.json({ success: true });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/players/:id/block', userId: req.user?.player_id });
            return res.status(500).json({ success: false, message: 'Error al actualizar estado.' });
        }
    }

    async ChangePlayerRole(req, res) {
        const { id } = req.params;
        const { role } = req.body;
        if (!['player', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Rol inválido. Usa "player" o "admin".' });
        }
        if (parseInt(id) === req.user.player_id) {
            return res.status(400).json({ success: false, message: 'No puedes cambiar tu propio rol.' });
        }
        try {
            const { rowCount } = await pool.query(
                `UPDATE players SET role = $1 WHERE player_id = $2 AND is_ai = FALSE`,
                [role, id]
            );
            if (rowCount === 0) return res.status(404).json({ success: false, message: 'Jugador no encontrado.' });
            Logger.action(`Rol de jugador ${id} cambiado a "${role}" por admin`, req.user.player_id);
            return res.json({ success: true });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/players/:id/role', userId: req.user?.player_id });
            return res.status(500).json({ success: false, message: 'Error al cambiar rol.' });
        }
    }

    async DeletePlayer(req, res) {
        const { id } = req.params;
        if (parseInt(id) === req.user.player_id) {
            return res.status(400).json({ success: false, message: 'No puedes eliminarte a ti mismo.' });
        }
        try {
            const { rowCount } = await pool.query(
                `UPDATE players SET deleted = TRUE WHERE player_id = $1 AND is_ai = FALSE`,
                [id]
            );
            if (rowCount === 0) return res.status(404).json({ success: false, message: 'Jugador no encontrado.' });
            Logger.action(`Jugador ${id} marcado como eliminado por admin`, req.user.player_id);
            return res.json({ success: true });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/players/:id', userId: req.user?.player_id });
            return res.status(500).json({ success: false, message: 'Error al eliminar jugador.' });
        }
    }

    async SendPlayerMessage(req, res) {
        const { id } = req.params;
        const { subject, body } = req.body;
        if (!subject?.trim() || !body?.trim()) {
            return res.status(400).json({ success: false, message: 'Asunto y mensaje son obligatorios.' });
        }
        try {
            const result = await pool.query(
                `INSERT INTO messages (sender_id, receiver_id, subject, body) VALUES ($1, $2, $3, $4) RETURNING id`,
                [req.user.player_id, id, subject.trim(), body.trim()]
            );
            const newId = result.rows[0].id;
            await pool.query('UPDATE messages SET thread_id = $1 WHERE id = $1', [newId]);
            Logger.action(`Admin envió mensaje a jugador ${id}: "${subject}"`, req.user.player_id);
            return res.json({ success: true });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/players/:id/message', userId: req.user?.player_id });
            return res.status(500).json({ success: false, message: 'Error al enviar mensaje.' });
        }
    }

    async GetDashboard(req, res) {
        try {
            const { isEngineActive, getEngineInfo } = require('../logic/turn_engine');
            const { CONFIG } = require('../config.js');

            const spainHour = parseInt(
                new Intl.DateTimeFormat('es-ES', {
                    hour: 'numeric', hour12: false, timeZone: 'Europe/Madrid',
                }).format(new Date()), 10
            );

            const turnDurationSeconds = CONFIG.gameplay?.turn_duration_seconds || 600;
            const turnDurationMs = turnDurationSeconds * 1000;
            const elapsed = Date.now() % turnDurationMs;
            const nextTurnMs = elapsed === 0 ? turnDurationMs : turnDurationMs - elapsed;

            const [worldRow, playersRow, territoriesRow] = await Promise.all([
                pool.query('SELECT current_turn, game_date, is_paused, last_updated FROM world_state WHERE id = 1'),
                pool.query('SELECT COUNT(*)::int AS total FROM players'),
                pool.query('SELECT COUNT(*)::int AS total FROM h3_map WHERE player_id IS NOT NULL'),
            ]);

            let bugMap = {};
            try {
                const bugsRow = await pool.query(
                    `SELECT status, COUNT(*)::int AS cnt FROM bug_reports GROUP BY status`
                );
                for (const r of bugsRow.rows) bugMap[r.status] = r.cnt;
            } catch (_) {}

            const world = worldRow.rows[0];
            const engineInfo = getEngineInfo();

            return res.json({
                success: true,
                world: {
                    current_turn: world.current_turn,
                    game_date: world.game_date,
                    is_paused: world.is_paused,
                    last_updated: world.last_updated,
                },
                engine: {
                    running: isEngineActive(),
                    uptime_ms: engineInfo.uptimeMs,
                },
                players:     { total: playersRow.rows[0].total },
                territories: { total: territoriesRow.rows[0].total },
                bugs: {
                    nuevo:     bugMap['Nuevo'] || 0,
                    pendiente: bugMap['Pendiente de arreglo'] || 0,
                    corregido: bugMap['Corregido'] || 0,
                },
                turn: {
                    duration_seconds: turnDurationSeconds,
                    next_turn_ms:     nextTurnMs,
                },
                season: {
                    is_campaign: spainHour >= 12,
                    spain_hour:  spainHour,
                    label:       spainHour >= 12 ? 'Campaña' : 'Invierno',
                },
            });
        } catch (error) {
            Logger.error(error, { endpoint: '/admin/dashboard', method: 'GET', userId: req.user?.player_id });
            return res.status(500).json({ success: false, message: 'Error al obtener dashboard.' });
        }
    }
}

module.exports = new AdminService();
