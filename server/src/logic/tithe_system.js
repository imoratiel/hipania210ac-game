const { Logger } = require('../utils/logger');
const NotificationService = require('../services/NotificationService');

// Fixed tithe rate: 10 % of each resource per non-capital fief
const TITHE_RATE = 0.10;

/**
 * Transfiere el diezmo (10% de cada recurso) de los feudos secundarios a la capital.
 *
 * Solo se ejecuta cuando config.gameplay.tithe_active === true.
 * Si un jugador no tiene capital definida (players.capital_h3), se omite.
 *
 * Debe llamarse DENTRO de una transacción activa (el client ya tiene BEGIN).
 *
 * @param {Object} client - Cliente PostgreSQL (dentro de transacción)
 * @param {number} turn   - Turno actual (para logs y notificaciones)
 * @param {Object} config - Configuración del juego (cargada desde game_config)
 */
async function processTithe(client, turn, config) {
    // Guard: tithe only runs when explicitly enabled
    if (!config.gameplay?.tithe_active) {
        Logger.engine(`[TURN ${turn}] Tithe system: disabled (tithe_active = false)`);
        return;
    }

    Logger.engine(`[TURN ${turn}] Tithe collection started (rate: ${TITHE_RATE * 100}%)`);

    try {
        // Only players who own territories AND have a capital defined
        const playersResult = await client.query(`
            SELECT DISTINCT p.player_id, p.username, p.capital_h3
            FROM players p
            JOIN h3_map m ON p.player_id = m.player_id
            WHERE m.player_id IS NOT NULL
              AND p.capital_h3 IS NOT NULL
        `);

        let totalPlayers = 0;

        for (const player of playersResult.rows) {
            try {
                const capitalH3 = player.capital_h3;

                // Verify the capital territory_details row actually exists
                const capitalCheck = await client.query(
                    'SELECT h3_index FROM territory_details WHERE h3_index = $1',
                    [capitalH3]
                );
                if (capitalCheck.rows.length === 0) continue;

                // Fetch all NON-capital territories for this player
                const nonCapitalResult = await client.query(`
                    SELECT td.h3_index,
                           td.food_stored, td.wood_stored, td.stone_stored,
                           td.iron_stored, td.gold_stored
                    FROM territory_details td
                    JOIN h3_map m ON td.h3_index = m.h3_index
                    WHERE m.player_id = $1
                      AND td.h3_index != $2
                `, [player.player_id, capitalH3]);

                if (nonCapitalResult.rows.length === 0) continue;

                // Accumulate totals transferred to capital
                let titheFood = 0, titheWood = 0, titheStone = 0;
                let titheIron = 0, titheGold = 0;

                for (const fief of nonCapitalResult.rows) {
                    // FLOOR on all amounts to avoid decimal issues in INT columns
                    const food  = Math.floor((parseFloat(fief.food_stored)  || 0) * TITHE_RATE);
                    const wood  = Math.floor((parseFloat(fief.wood_stored)  || 0) * TITHE_RATE);
                    const stone = Math.floor((parseFloat(fief.stone_stored) || 0) * TITHE_RATE);
                    const iron  = Math.floor((parseFloat(fief.iron_stored)  || 0) * TITHE_RATE);
                    const gold  = Math.floor((parseFloat(fief.gold_stored)  || 0) * TITHE_RATE);

                    // Skip fiefs that yield nothing (all stocks at 0)
                    if (food + wood + stone + iron + gold === 0) continue;

                    // Deduct from source fief
                    await client.query(`
                        UPDATE territory_details
                        SET food_stored  = food_stored  - $1,
                            wood_stored  = wood_stored  - $2,
                            stone_stored = stone_stored - $3,
                            iron_stored  = iron_stored  - $4,
                            gold_stored  = gold_stored  - $5
                        WHERE h3_index = $6
                    `, [food, wood, stone, iron, gold, fief.h3_index]);

                    titheFood  += food;
                    titheWood  += wood;
                    titheStone += stone;
                    titheIron  += iron;
                    titheGold  += gold;
                }

                const totalTransferred = titheFood + titheWood + titheStone + titheIron + titheGold;
                if (totalTransferred === 0) continue;

                // Add all collected resources to the capital's storehouse
                await client.query(`
                    UPDATE territory_details
                    SET food_stored  = food_stored  + $1,
                        wood_stored  = wood_stored  + $2,
                        stone_stored = stone_stored + $3,
                        iron_stored  = iron_stored  + $4,
                        gold_stored  = gold_stored  + $5
                    WHERE h3_index = $6
                `, [titheFood, titheWood, titheStone, titheIron, titheGold, capitalH3]);

                // Notification for this player
                const lines = [
                    `⛪ **Diezmo Recaudado — Turno ${turn}**`,
                    ``,
                    `Feudos tributarios: ${nonCapitalResult.rows.length}`,
                    `Destino: Capital (${capitalH3})`,
                    ``,
                    `**Recursos transferidos:**`,
                ];
                if (titheFood  > 0) lines.push(`• 🌾 Comida:  +${titheFood}`);
                if (titheWood  > 0) lines.push(`• 🌲 Madera:  +${titheWood}`);
                if (titheStone > 0) lines.push(`• ⛰️ Piedra:   +${titheStone}`);
                if (titheIron  > 0) lines.push(`• ⛏️ Hierro:   +${titheIron}`);
                if (titheGold  > 0) lines.push(`• 💰 Oro:      +${titheGold}`);

                await NotificationService.createSystemNotification(
                    player.player_id,
                    'TITHE',
                    lines.join('\n'),
                    turn
                );

                Logger.engine(`[TURN ${turn}] Tithe collected for player ${player.player_id} (${player.username}): Food ${titheFood}, Wood ${titheWood}, Stone ${titheStone}, Iron ${titheIron}, Gold ${titheGold} → capital ${capitalH3}`);
                totalPlayers++;

            } catch (playerError) {
                // Resilient: log and continue with next player
                Logger.error(playerError, {
                    context: 'tithe_system.processTithe',
                    phase: 'player_tithe',
                    turn,
                    playerId: player.player_id
                });
            }
        }

        Logger.engine(`[TURN ${turn}] Tithe collection completed: ${totalPlayers} players processed`);

    } catch (error) {
        Logger.error(error, {
            context: 'tithe_system.processTithe',
            phase: 'global',
            turn
        });
        throw error;
    }
}

module.exports = { processTithe };
