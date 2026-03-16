const pool   = require('../../db.js');
const { Logger } = require('../utils/logger');
const PlayerModel = require('../models/PlayerModel.js');

// ─────────────────────────────────────────────────────────────────────────────
// In-memory cache: Map<h3_index, Array<{ culture_id: number, weight: number }>>
// Loaded once at server start via loadGeoCultureCache().
// ─────────────────────────────────────────────────────────────────────────────
let _geoCultureCache = null;

/**
 * Loads geo_culture_weights into memory.
 * Call once during server startup (app.js / index.js).
 */
async function loadGeoCultureCache() {
    try {
        const result = await pool.query(
            'SELECT h3_index, culture_id, weight FROM geo_culture_weights'
        );
        _geoCultureCache = new Map();
        for (const row of result.rows) {
            if (!_geoCultureCache.has(row.h3_index)) {
                _geoCultureCache.set(row.h3_index, []);
            }
            _geoCultureCache.get(row.h3_index).push({
                culture_id: row.culture_id,
                weight:     parseInt(row.weight, 10),
            });
        }
        Logger.engine(`[CultureCache] ${result.rows.length} pesos cargados para ${_geoCultureCache.size} hexágonos`);
    } catch (error) {
        Logger.error(error, { context: 'PlayerService.loadGeoCultureCache' });
        _geoCultureCache = new Map(); // Empty cache — non-fatal
    }
}

/**
 * Forces a cache reload (useful after admin edits to geo_culture_weights).
 */
async function reloadGeoCultureCache() {
    _geoCultureCache = null;
    await loadGeoCultureCache();
}

// ─────────────────────────────────────────────────────────────────────────────
// CULTURA POR LOCALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a culture_id for the given h3Index using weighted random selection.
 *
 * - If the cache has no entry for this hex, returns null (caller decides default).
 * - If there is only one entry, returns it immediately (no RNG needed).
 * - If multiple entries, picks one proportionally to their weight.
 *
 * @param {string} h3Index
 * @returns {number|null} culture_id or null
 */
function assignCultureByLocation(h3Index) {
    if (!_geoCultureCache) {
        Logger.error(new Error('CultureCache not loaded'), { context: 'assignCultureByLocation', h3Index });
        return null;
    }

    const entries = _geoCultureCache.get(h3Index);
    if (!entries || entries.length === 0) return null;
    if (entries.length === 1) return entries[0].culture_id;

    // Weighted random — O(n) walk
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
    let rng = Math.random() * totalWeight;
    for (const entry of entries) {
        rng -= entry.weight;
        if (rng <= 0) return entry.culture_id;
    }
    // Floating-point safety fallback
    return entries[entries.length - 1].culture_id;
}

// ─────────────────────────────────────────────────────────────────────────────
// TROPAS DE INICIO POR CULTURA
// ─────────────────────────────────────────────────────────────────────────────

// Starting quantity per unit class
const STARTING_QUANTITIES = {
    INFANTRY_1: 100,
    ARCHER_1:   50,
};

/**
 * Returns the starting troop list for a culture.
 * Each entry: { unit_type_id, name, unit_class, quantity }
 *
 * Falls back to generic units (Milicia + Arqueros) if culture has none.
 *
 * @param {number|null} cultureId
 * @returns {Promise<Array<{ unit_type_id, name, unit_class, quantity }>>}
 */
async function getStartingTroopsByCulture(cultureId) {
    if (cultureId !== null && cultureId !== undefined) {
        const result = await pool.query(
            `SELECT unit_type_id, name, unit_class
             FROM   unit_types
             WHERE  culture_id = $1
               AND  unit_class IN ('INFANTRY_1', 'ARCHER_1')
             ORDER BY unit_class`,
            [cultureId]
        );

        if (result.rows.length > 0) {
            return result.rows.map(r => ({
                unit_type_id: r.unit_type_id,
                name:         r.name,
                unit_class:   r.unit_class,
                quantity:     STARTING_QUANTITIES[r.unit_class] ?? 50,
            }));
        }
    }

    // Fallback: generic units (no culture assigned or culture has no basic units)
    const fallback = await pool.query(
        `SELECT unit_type_id, name
         FROM   unit_types
         WHERE  name IN ('Milicia', 'Arqueros')
           AND  culture_id IS NULL`
    );

    return fallback.rows.map(r => ({
        unit_type_id: r.unit_type_id,
        name:         r.name,
        unit_class:   r.name === 'Milicia' ? 'INFANTRY_1' : 'ARCHER_1',
        quantity:     r.name === 'Milicia' ? STARTING_QUANTITIES.INFANTRY_1 : STARTING_QUANTITIES.ARCHER_1,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

class PlayerService {
    async GetById(req, res) {
        try {
            const player = await PlayerModel.GetById(req.params.id);
            if (!player) return res.status(404).json({ error: 'Player not found' });
            res.json(player);
        } catch (error) {
            Logger.error(error, { endpoint: '/players/:id', method: 'GET', userId: req.params?.id });
            res.status(500).json({ error: 'Error al obtener jugador' });
        }
    }

    /**
     * GET /api/players/culture-cache/reload  (admin only)
     * Forces a cache reload without restarting the server.
     */
    async ReloadCultureCache(req, res) {
        try {
            await reloadGeoCultureCache();
            res.json({ success: true, message: 'Caché de culturas recargada' });
        } catch (error) {
            Logger.error(error, { endpoint: 'culture-cache/reload' });
            res.status(500).json({ error: 'Error al recargar caché' });
        }
    }
}

module.exports = new PlayerService();
module.exports.loadGeoCultureCache    = loadGeoCultureCache;
module.exports.reloadGeoCultureCache  = reloadGeoCultureCache;
module.exports.assignCultureByLocation = assignCultureByLocation;
module.exports.getStartingTroopsByCulture = getStartingTroopsByCulture;
