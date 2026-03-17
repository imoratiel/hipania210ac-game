const { Logger } = require('../utils/logger');
const GAME_CONFIG = require('../config/constants');

/**
 * Degrada la conservación de todos los edificios en un % mensual (día 5).
 * Los edificios que llegan a 0 se destruyen automáticamente.
 *
 * @param {Object} client   - Cliente PostgreSQL (dentro de transacción)
 * @param {number} turn     - Turno actual
 * @param {Date}   gameDate - Fecha del calendario de juego
 */
async function processBuildingDecay(client, turn, gameDate) {
    const gd = new Date(gameDate);
    if (gd.getDate() !== 5) return;

    const decay = GAME_CONFIG.BUILDINGS.CONSERVATION_DECAY_PERCENT;

    // Decrementar conservación en todos los edificios completados
    await client.query(`
        UPDATE fief_buildings
        SET conservation = GREATEST(0, conservation - $1)
        WHERE is_under_construction = FALSE
    `, [decay]);

    // Destruir los que llegaron a 0
    const destroyed = await client.query(`
        DELETE FROM fief_buildings
        WHERE conservation = 0 AND is_under_construction = FALSE
        RETURNING h3_index
    `);

    if (destroyed.rowCount > 0) {
        const hexes = destroyed.rows.map(r => r.h3_index).join(', ');
        Logger.engine(`[TURN ${turn}] Building decay: ${destroyed.rowCount} building(s) collapsed (${hexes})`);
    } else {
        Logger.engine(`[TURN ${turn}] Building decay applied (-${decay}% conservation)`);
    }
}

module.exports = { processBuildingDecay };
