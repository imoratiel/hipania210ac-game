const pool = require('../../db.js');
const NavalModel = require('../models/NavalModel.js');
const ArmyModel = require('../models/ArmyModel.js');
const ArmySimulationService = require('./ArmySimulationService.js');
const { getFleetLimit } = require('../config/gameFunctions.js');
const { Logger } = require('../utils/logger.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function _getPlayerCulture(player_id) {
    const r = await pool.query('SELECT culture_id FROM players WHERE player_id = $1', [player_id]);
    return r.rows[0]?.culture_id ?? 1;
}

async function _checkPortAtHex(client, h3_index, player_id) {
    const r = await client.query(`
        SELECT 1
        FROM fief_buildings fb
        JOIN buildings      b  ON fb.building_id = b.id
        JOIN building_types bt ON b.type_id = bt.building_type_id
        JOIN h3_map         m  ON fb.h3_index = m.h3_index
        WHERE fb.h3_index = $1
          AND bt.name = 'maritime'
          AND m.player_id = $2
          AND fb.is_under_construction = FALSE
    `, [h3_index, player_id]);
    return r.rows.length > 0;
}

// ── Service ───────────────────────────────────────────────────────────────────

class NavalService {

    // ── GET /naval/ship-types ─────────────────────────────────────────────────

    async GetShipTypes(req, res) {
        try {
            const culture_id = await _getPlayerCulture(req.user.player_id);
            const types = await NavalModel.GetShipTypesByCulture(culture_id);
            res.json({ success: true, ship_types: types });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/ship-types', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener tipos de barcos.' });
        }
    }

    // ── GET /naval/fleets ─────────────────────────────────────────────────────

    async GetFleets(req, res) {
        const client = await pool.connect();
        try {
            const fleets = await NavalModel.GetPlayerFleets(client, req.user.player_id);
            res.json({ success: true, fleets });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/fleets', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener flotas.' });
        } finally { client.release(); }
    }

    // ── GET /naval/fleets/:id ─────────────────────────────────────────────────

    async GetFleetDetail(req, res) {
        const client = await pool.connect();
        try {
            const fleet_id  = parseInt(req.params.id, 10);
            const player_id = req.user.player_id;

            const fleet = await NavalModel.GetFleetByIdAndOwner(client, fleet_id, player_id);
            if (!fleet) return res.status(404).json({ success: false, message: 'Flota no encontrada.' });

            const detail = await NavalModel.GetFleetById(client, fleet_id);
            const cargo  = await NavalModel.GetFleetCargo(client, fleet_id);
            res.json({ success: true, fleet: { ...detail, cargo } });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/fleets/:id', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener detalles de flota.' });
        } finally { client.release(); }
    }

    // ── GET /naval/capacity ───────────────────────────────────────────────────

    async GetCapacity(req, res) {
        const client = await pool.connect();
        try {
            const cap = await NavalModel.GetPlayerFleetCapacity(client, req.user.player_id);
            const fleet_limit = getFleetLimit(cap.fief_count);
            res.json({ success: true, fleet_count: cap.fleet_count, fief_count: cap.fief_count, fleet_limit });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/capacity', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener capacidad naval.' });
        } finally { client.release(); }
    }

    // ── GET /naval/embarkable/:fleet_id ──────────────────────────────────────

    async GetEmbarkable(req, res) {
        const client = await pool.connect();
        try {
            const fleet_id  = parseInt(req.params.fleet_id, 10);
            const player_id = req.user.player_id;

            const fleet = await NavalModel.GetFleetByIdAndOwner(client, fleet_id, player_id);
            if (!fleet) return res.status(404).json({ success: false, message: 'Flota no encontrada.' });

            const [armies, cargo] = await Promise.all([
                NavalModel.GetEmbarkableArmies(client, player_id, fleet.h3_index),
                NavalModel.GetFleetCargo(client, fleet_id),
            ]);
            res.json({ success: true, armies, cargo });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/embarkable', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener ejércitos embarcables.' });
        } finally { client.release(); }
    }

    // ── POST /naval/create-fleet ──────────────────────────────────────────────
    // Body: { h3_index, name, ships: [{ ship_type_id, quantity }] }
    // ships is optional but must have at least one entry to create a non-empty fleet.

    async CreateFleet(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const player_id = req.user.player_id;
            const { h3_index, name, ships = [] } = req.body;

            if (!h3_index) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'h3_index es obligatorio.' });
            }

            // Fleet limit check (same cap as armies, separate count)
            const cap = await NavalModel.GetPlayerFleetCapacity(client, player_id);
            const fleet_limit = getFleetLimit(cap.fief_count);
            if (cap.fleet_count >= fleet_limit) {
                await client.query('ROLLBACK');
                return res.status(403).json({
                    success: false,
                    message: `Has alcanzado el límite de flotas (${cap.fleet_count}/${fleet_limit}). Necesitas más feudos para comandar más flotas.`,
                });
            }

            // Port check: must be player-owned, completed maritime building
            if (!(await _checkPortAtHex(client, h3_index, player_id))) {
                await client.query('ROLLBACK');
                return res.status(403).json({ success: false, message: 'Solo puedes crear una flota en un Puerto propio ya construido.' });
            }

            // Validate and cost initial ships
            const culture_id = await _getPlayerCulture(player_id);
            let totalCost = 0;
            const resolvedShips = [];

            for (const entry of ships) {
                const { ship_type_id, quantity = 1 } = entry;
                if (!ship_type_id || quantity < 1) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ success: false, message: 'Cada barco debe tener ship_type_id y quantity ≥ 1.' });
                }
                const stRes = await client.query(
                    'SELECT id, name, gold_cost, culture_id FROM ship_types WHERE id = $1',
                    [ship_type_id]
                );
                if (stRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ success: false, message: `Tipo de barco ${ship_type_id} no encontrado.` });
                }
                const st = stRes.rows[0];
                if (st.culture_id !== culture_id) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, message: `El barco "${st.name}" no pertenece a tu cultura.` });
                }
                totalCost += st.gold_cost * quantity;
                resolvedShips.push({ ship_type_id: st.id, name: st.name, quantity });
            }

            // Gold check
            if (totalCost > 0) {
                const goldRes = await client.query('SELECT gold FROM players WHERE player_id = $1 FOR UPDATE', [player_id]);
                const gold = parseInt(goldRes.rows[0].gold, 10);
                if (gold < totalCost) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: `Oro insuficiente. Necesitas ${totalCost.toLocaleString()} y tienes ${gold.toLocaleString()}.`,
                    });
                }
                await client.query('UPDATE players SET gold = gold - $1 WHERE player_id = $2', [totalCost, player_id]);
            }

            // Create fleet
            const fleetName = (name || '').trim() || `Flota de ${player_id}`;
            const fleet = await NavalModel.CreateFleet(client, player_id, h3_index, fleetName);

            // Add initial ships
            for (const s of resolvedShips) {
                await NavalModel.AddShipsToFleet(client, fleet.army_id, s.ship_type_id, s.quantity);
            }

            await client.query('COMMIT');

            const shipSummary = resolvedShips.map(s => `${s.quantity}x ${s.name}`).join(', ');
            Logger.action(`Flota ${fleet.army_id} creada (${fleetName}) en ${h3_index} por player ${player_id}. Barcos: [${shipSummary || 'ninguno'}]. Coste: ${totalCost}`);
            res.json({ success: true, fleet_id: fleet.army_id, name: fleetName, gold_spent: totalCost });
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(err, { endpoint: '/naval/create-fleet', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al crear la flota.' });
        } finally { client.release(); }
    }

    // ── POST /naval/recruit-ships ─────────────────────────────────────────────

    async RecruitShips(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const player_id = req.user.player_id;
            const { fleet_id, ship_type_id, quantity = 1 } = req.body;

            if (!fleet_id || !ship_type_id || quantity < 1) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'fleet_id, ship_type_id y quantity (≥1) son obligatorios.' });
            }

            // Fleet ownership
            const fleet = await NavalModel.GetFleetByIdAndOwner(client, fleet_id, player_id);
            if (!fleet) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Flota no encontrada.' });
            }

            // Port must be at fleet's current hex
            if (!(await _checkPortAtHex(client, fleet.h3_index, player_id))) {
                await client.query('ROLLBACK');
                return res.status(403).json({ success: false, message: 'La flota debe estar en un Puerto propio para reclutar barcos.' });
            }

            // Ship type: must exist and match player's culture
            const culture_id  = await _getPlayerCulture(player_id);
            const stRes = await client.query(
                'SELECT id, name, gold_cost, culture_id FROM ship_types WHERE id = $1',
                [ship_type_id]
            );
            if (stRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Tipo de barco no encontrado.' });
            }
            const shipType = stRes.rows[0];
            if (shipType.culture_id !== culture_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ success: false, message: 'Este tipo de barco no pertenece a tu cultura.' });
            }

            // Gold check
            const totalCost = shipType.gold_cost * quantity;
            const goldRes = await client.query('SELECT gold FROM players WHERE player_id = $1 FOR UPDATE', [player_id]);
            if (parseInt(goldRes.rows[0].gold, 10) < totalCost) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Oro insuficiente. Necesitas ${totalCost.toLocaleString()} y tienes ${parseInt(goldRes.rows[0].gold, 10).toLocaleString()}.`,
                });
            }

            await client.query('UPDATE players SET gold = gold - $1 WHERE player_id = $2', [totalCost, player_id]);
            const updated = await NavalModel.AddShipsToFleet(client, fleet_id, ship_type_id, quantity);
            await client.query('COMMIT');

            Logger.action(`${quantity}x ${shipType.name} reclutados en flota ${fleet_id} por player ${player_id}. Coste: ${totalCost}`);
            res.json({ success: true, fleet_ships: updated, gold_spent: totalCost });
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(err, { endpoint: '/naval/recruit-ships', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al reclutar barcos.' });
        } finally { client.release(); }
    }

    // ── POST /naval/embark ────────────────────────────────────────────────────

    async EmbarkArmy(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const player_id = req.user.player_id;
            const { fleet_id, army_id } = req.body;

            const fleet = await NavalModel.GetFleetByIdAndOwner(client, fleet_id, player_id);
            if (!fleet) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Flota no encontrada.' });
            }

            const armyRes = await client.query(
                `SELECT army_id, h3_index, transported_by FROM armies
                 WHERE army_id = $1 AND player_id = $2 AND is_naval = FALSE AND is_garrison = FALSE`,
                [army_id, player_id]
            );
            if (armyRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Ejército no encontrado.' });
            }
            const army = armyRes.rows[0];

            if (army.transported_by !== null) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Este ejército ya está embarcado.' });
            }
            if (army.h3_index !== fleet.h3_index) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'El ejército y la flota deben estar en el mismo hex para embarcar.' });
            }

            // Capacity check
            const cargo = await NavalModel.GetFleetCargo(client, fleet_id);
            const troopRes = await client.query(
                'SELECT COALESCE(SUM(quantity), 0)::int AS cnt FROM troops WHERE army_id = $1',
                [army_id]
            );
            const troopCount = troopRes.rows[0].cnt;
            const available  = cargo.max_capacity - cargo.used_capacity;
            if (troopCount > available) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Capacidad insuficiente. La flota puede transportar ${available} tropas más, pero el ejército tiene ${troopCount}.`,
                });
            }

            await NavalModel.EmbarkArmy(client, army_id, fleet_id);
            await client.query('COMMIT');

            Logger.action(`Ejército ${army_id} embarcado en flota ${fleet_id} por player ${player_id}`);
            res.json({ success: true });
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(err, { endpoint: '/naval/embark', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al embarcar el ejército.' });
        } finally { client.release(); }
    }

    // ── POST /naval/disembark ─────────────────────────────────────────────────

    async DisembarkArmy(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const player_id = req.user.player_id;
            const { army_id } = req.body;

            // Fetch army + fleet hex in one join
            const armyRes = await client.query(
                `SELECT a.army_id, f.h3_index AS fleet_hex
                 FROM armies a
                 JOIN armies f ON a.transported_by = f.army_id
                 WHERE a.army_id = $1 AND a.player_id = $2`,
                [army_id, player_id]
            );
            if (armyRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Ejército no encontrado o no está embarcado.' });
            }
            const { fleet_hex } = armyRes.rows[0];

            // Fleet must be at a coastal hex (is_naval_passable=true but not open sea)
            const coastRes = await client.query(`
                SELECT 1 FROM h3_map m
                JOIN terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
                WHERE m.h3_index = $1
                  AND tt.is_naval_passable = TRUE
                  AND tt.name != 'Mar'
            `, [fleet_hex]);
            if (coastRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Solo puedes desembarcar en hexes costeros o con puerto.' });
            }

            await NavalModel.DisembarkArmy(client, army_id);
            await client.query('UPDATE armies SET h3_index = $1 WHERE army_id = $2', [fleet_hex, army_id]);
            await client.query('COMMIT');

            Logger.action(`Ejército ${army_id} desembarcado en ${fleet_hex}`);
            res.json({ success: true, landed_at: fleet_hex });
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(err, { endpoint: '/naval/disembark', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al desembarcar el ejército.' });
        } finally { client.release(); }
    }

    // ── POST /naval/move-fleet ────────────────────────────────────────────────

    async MoveFleet(req, res) {
        try {
            const player_id = req.user.player_id;
            const { fleet_id, target_h3 } = req.body;

            if (!fleet_id || !target_h3) {
                return res.status(400).json({ success: false, message: 'fleet_id y target_h3 son requeridos.' });
            }

            const fleet = await NavalModel.GetFleetByIdAndOwner(null, fleet_id, player_id);
            if (!fleet) {
                return res.status(404).json({ success: false, message: 'Flota no encontrada.' });
            }

            const routeResult = await ArmySimulationService.calculateAndSaveRoute(fleet_id, target_h3);
            if (!routeResult.success) {
                return res.status(400).json({ success: false, message: routeResult.message || 'No se pudo calcular la ruta.' });
            }

            Logger.action(`Flota ${fleet_id} (${fleet.name}) en marcha hacia ${target_h3}`, player_id);
            res.json({
                success: true,
                message: `${fleet.name} en marcha hacia ${target_h3} (${routeResult.steps} pasos)`,
                data: { from: fleet.h3_index, to: target_h3, steps: routeResult.steps, path: routeResult.path },
            });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/move-fleet', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al mover la flota.' });
        }
    }

    // ── POST /naval/stop-fleet ────────────────────────────────────────────────

    async StopFleet(req, res) {
        try {
            const player_id = req.user.player_id;
            const { fleet_id } = req.body;

            if (!fleet_id) {
                return res.status(400).json({ success: false, message: 'fleet_id es requerido.' });
            }

            const fleet = await ArmyModel.stopArmy(fleet_id, player_id);
            if (!fleet) {
                return res.status(404).json({ success: false, message: 'Flota no encontrada o no te pertenece.' });
            }

            Logger.action(`Flota ${fleet_id} (${fleet.name}) detenida`, player_id);
            res.json({ success: true, message: `Flota "${fleet.name}" detenida correctamente.` });
        } catch (err) {
            Logger.error(err, { endpoint: '/naval/stop-fleet', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al detener la flota.' });
        }
    }
}

module.exports = new NavalService();
