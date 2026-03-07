/**
 * NamingService.js
 * Genera nombres unicos para divisiones politicas.
 * Estrategia: sufijos geograficos -> prefijos historicos -> numerales romanos.
 */

const SUFFIXES = ['de la Vega', 'de Arriba', 'de Abajo', 'Superior', 'Inferior'];
const PREFIXES = ['Nuevo', 'Viejo'];
const ROMANS   = ['I', 'II', 'III', 'IV', 'V'];

/**
 * Comprueba si el nombre esta disponible para el jugador dado.
 * La restriccion de unicidad es por (player_id, name), case-insensitive.
 *
 * @param {object} db   - pool o client de pg (ambos exponen .query())
 * @param {string} name
 * @param {number} playerId
 * @returns {Promise<boolean>}
 */
async function isNameFree(db, name, playerId) {
    const r = await db.query(
        'SELECT 1 FROM political_divisions WHERE player_id = $1 AND LOWER(name) = LOWER($2)',
        [playerId, name]
    );
    return r.rows.length === 0;
}

/**
 * Devuelve el primer nombre disponible derivado de baseName para el jugador.
 * Orden de resolucion:
 *   1. baseName tal cual
 *   2. baseName + sufijo  ('de la Vega', 'de Arriba', ...)
 *   3. prefijo + baseName ('Nuevo ...', 'Viejo ...')
 *   4. baseName + numeral romano ('I', 'II', ...)
 *
 * @param {object} db       - pool o client de pg
 * @param {string} baseName - nombre base generado por suggestDivisionName o escrito por el usuario
 * @param {number} playerId
 * @returns {Promise<string>} nombre unico garantizado
 */
async function getUniqueDivisionName(db, baseName, playerId) {
    if (await isNameFree(db, baseName, playerId)) return baseName;

    for (const suffix of SUFFIXES) {
        const candidate = `${baseName} ${suffix}`;
        if (await isNameFree(db, candidate, playerId)) return candidate;
    }

    for (const prefix of PREFIXES) {
        const candidate = `${prefix} ${baseName}`;
        if (await isNameFree(db, candidate, playerId)) return candidate;
    }

    for (const roman of ROMANS) {
        const candidate = `${baseName} ${roman}`;
        if (await isNameFree(db, candidate, playerId)) return candidate;
    }

    // Fallback extremo (solo si el jugador tiene >12 divisiones con el mismo nombre base)
    return `${baseName} ${Date.now()}`;
}

module.exports = { getUniqueDivisionName };
