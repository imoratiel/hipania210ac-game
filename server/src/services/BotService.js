'use strict';

/**
 * BotService.js
 *
 * Utilidades de bajo nivel para la gestión de agentes IA.
 * Toda la lógica es determinista y NO realiza llamadas a APIs externas.
 */

const h3   = require('h3-js');
const pool = require('../../db.js');

// Resolución H3 del mapa del juego
const H3_RESOLUTION = 8;

// Distancia aproximada centro-a-centro entre hexes adyacentes (km) en resolución 8
const KM_PER_HEX = 0.799;

// Radio del anillo de spawn respecto a la capital del jugador objetivo (en hexes de distancia)
const MIN_HEX_DISTANCE = 50;
const MAX_HEX_DISTANCE = 100;

// Intentos máximos de ángulo por jugador y de jugador distinto antes de caer en fallback
const MAX_ANGLE_RETRIES  = 3;
const MAX_PLAYER_RETRIES = 3;

/**
 * Calcula coordenadas de spawn para un nuevo bot.
 *
 * Algoritmo:
 *  A. Consulta jugadores humanos activos con capital definida.
 *  B. Si no hay jugadores → hex libre aleatorio del mapa.
 *  C. Elige un jugador al azar y proyecta un punto en el anillo
 *     [MIN_HEX_DISTANCE, MAX_HEX_DISTANCE] usando un ángulo aleatorio.
 *  D. Valida que el hex esté en el mapa, sea colonizable y no tenga dueño.
 *     Reintenta hasta MAX_ANGLE_RETRIES veces con distinto ángulo/distancia
 *     y hasta MAX_PLAYER_RETRIES con distintos jugadores antes del fallback.
 *
 * @returns {Promise<{ h3_index: string, player_target: object|null }>}
 */
async function getSpawnCoordinates() {
    // ── Paso A: jugadores humanos activos con capital ──────────────────────────
    const { rows: players } = await pool.query(`
        SELECT player_id, display_name, capital_h3
        FROM   players
        WHERE  is_ai      = FALSE
          AND  deleted    = FALSE
          AND  capital_h3 IS NOT NULL
    `);

    // ── Paso B: sin jugadores → hex aleatorio ──────────────────────────────────
    if (players.length === 0) {
        const hex = await _randomFreeHex();
        return { h3_index: hex, player_target: null };
    }

    // ── Paso C: anillo alrededor de un jugador ────────────────────────────────
    for (let pi = 0; pi < MAX_PLAYER_RETRIES; pi++) {
        const target = players[Math.floor(Math.random() * players.length)];
        const [capLat, capLng] = h3.cellToLatLng(target.capital_h3);

        for (let ai = 0; ai < MAX_ANGLE_RETRIES; ai++) {
            const bearingDeg = Math.random() * 360;
            const gridDist   = MIN_HEX_DISTANCE + Math.random() * (MAX_HEX_DISTANCE - MIN_HEX_DISTANCE);
            const distKm     = gridDist * KM_PER_HEX;

            const [tLat, tLng] = _applyBearing(capLat, capLng, bearingDeg, distKm);
            const candidate    = h3.latLngToCell(tLat, tLng, H3_RESOLUTION);

            if (await _isValidSpawnHex(candidate)) {
                return { h3_index: candidate, player_target: target };
            }
        }
    }

    // ── Paso D: fallback → hex libre aleatorio ────────────────────────────────
    const hex = await _randomFreeHex();
    return { h3_index: hex, player_target: null };
}

// ── Helpers privados ──────────────────────────────────────────────────────────

/**
 * Desplaza un punto geográfico aplicando un rumbo y distancia.
 * Aproximación plana suficiente para distancias < 100 km.
 *
 * @param {number} lat0       Latitud origen (grados)
 * @param {number} lng0       Longitud origen (grados)
 * @param {number} bearingDeg Rumbo en grados (0 = Norte, sentido horario)
 * @param {number} distKm     Distancia en kilómetros
 * @returns {[number, number]} [lat, lng]
 */
function _applyBearing(lat0, lng0, bearingDeg, distKm) {
    const DEG_PER_KM = 1 / 111.32;
    const bearingRad = (bearingDeg * Math.PI) / 180;
    const lat0Rad    = (lat0 * Math.PI) / 180;

    const deltaLat = distKm * DEG_PER_KM * Math.cos(bearingRad);
    const deltaLng = distKm * DEG_PER_KM * Math.sin(bearingRad) / Math.cos(lat0Rad);

    return [lat0 + deltaLat, lng0 + deltaLng];
}

/**
 * Verifica que un hex exista en el mapa, esté libre y sea colonizable con producción de comida.
 *
 * @param {string} h3Index
 * @returns {Promise<boolean>}
 */
async function _isValidSpawnHex(h3Index) {
    const { rows } = await pool.query(`
        SELECT 1
        FROM   h3_map m
        JOIN   terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
        WHERE  m.h3_index = $1
          AND  m.player_id IS NULL
          AND  COALESCE(tt.is_colonizable, TRUE) = TRUE
          AND  tt.food_output > 0
    `, [h3Index]);
    return rows.length > 0;
}

/**
 * Devuelve un hex libre y colonizable al azar del mapa (fallback).
 *
 * @returns {Promise<string|null>}
 */
async function _randomFreeHex() {
    const { rows } = await pool.query(`
        SELECT m.h3_index
        FROM   h3_map m
        JOIN   terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
        WHERE  m.player_id IS NULL
          AND  COALESCE(tt.is_colonizable, TRUE) = TRUE
          AND  tt.food_output > 0
        ORDER  BY RANDOM()
        LIMIT  1
    `);
    return rows[0]?.h3_index || null;
}

/**
 * Devuelve un hex libre y colonizable dentro de maxDist casillas de callerCapitalH3.
 * Usado por el perfil DUMMY para spawnear cerca del jugador que lo invoca.
 *
 * @param {string} callerCapitalH3  Capital del jugador invocador
 * @param {number} maxDist          Distancia máxima en hexes (exclusiva)
 * @returns {Promise<string|null>}
 */
async function getNearbySpawnHex(callerCapitalH3, maxDist = 9) {
    const candidates = h3.gridDisk(callerCapitalH3, maxDist)
        .filter(hex => hex !== callerCapitalH3);

    const { rows } = await pool.query(`
        SELECT m.h3_index FROM h3_map m
        JOIN terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
        WHERE m.h3_index = ANY($1::text[])
          AND m.player_id IS NULL
          AND COALESCE(tt.is_colonizable, TRUE) = TRUE
          AND tt.food_output > 0
        ORDER BY RANDOM()
        LIMIT 1
    `, [candidates]);

    return rows[0]?.h3_index || null;
}

module.exports = { getSpawnCoordinates, getNearbySpawnHex };
