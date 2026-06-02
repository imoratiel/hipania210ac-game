'use strict';

/**
 * gameCalendar.js
 * Maps real-world Spain time (Europe/Madrid) to in-game seasons and months.
 *
 * One real day = one in-game year (48 turns × 30 min each).
 * Campaign season (combat allowed):  12:00–23:59 Madrid → April–September
 * Winter season   (no combat):       00:00–11:59 Madrid → October–March
 *
 * DST is handled automatically by the Europe/Madrid timezone.
 */

// Index = Spain hour (0–23) → in-game month name
const HOUR_TO_MONTH = [
    'Octubre',    // 00:00–00:59
    'Octubre',    // 01:00–01:59
    'Noviembre',  // 02:00–02:59
    'Noviembre',  // 03:00–03:59
    'Diciembre',  // 04:00–04:59
    'Diciembre',  // 05:00–05:59
    'Enero',      // 06:00–06:59
    'Enero',      // 07:00–07:59
    'Febrero',    // 08:00–08:59
    'Febrero',    // 09:00–09:59
    'Marzo',      // 10:00–10:59
    'Marzo',      // 11:00–11:59
    'Abril',      // 12:00–12:59  ← campaign starts
    'Abril',      // 13:00–13:59
    'Mayo',       // 14:00–14:59
    'Mayo',       // 15:00–15:59
    'Junio',      // 16:00–16:59
    'Junio',      // 17:00–17:59
    'Julio',      // 18:00–18:59
    'Julio',      // 19:00–19:59
    'Agosto',     // 20:00–20:59
    'Agosto',     // 21:00–21:59
    'Septiembre', // 22:00–22:59
    'Septiembre', // 23:00–23:59
];

const CAMPAIGN_MONTHS = new Set([
    'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre'
]);

/**
 * Returns the current hour (0–23) in Spain (Europe/Madrid), DST-aware.
 */
function getSpainHour() {
    return parseInt(
        new Intl.DateTimeFormat('es-ES', {
            hour: 'numeric',
            hour12: false,
            timeZone: 'Europe/Madrid',
        }).format(new Date()),
        10
    );
}

/**
 * Returns the current in-game month name (e.g. "Julio", "Enero").
 */
function getCurrentGameMonth() {
    return HOUR_TO_MONTH[getSpainHour()];
}

/**
 * Returns true if it is currently campaign season (combat and rebellions allowed).
 * Campaign = 12:00–23:59 Spain time = April–September in-game.
 */
function isCampaignSeason() {
    return getSpainHour() >= 12;
}

/**
 * Returns a full snapshot of the current calendar state.
 * Useful for the /api/game/season endpoint.
 */
function getSeasonSnapshot() {
    const spainHour  = getSpainHour();
    const month      = HOUR_TO_MONTH[spainHour];
    const campaign   = spainHour >= 12;

    // Minutes until next season transition
    const now        = new Date();
    const spainNow   = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const minutesNow = spainNow.getHours() * 60 + spainNow.getMinutes();
    const transition = campaign
        ? (24 * 60 - minutesNow)         // minutes until midnight (winter starts)
        : (12 * 60 - minutesNow);        // minutes until noon     (campaign starts)

    return {
        month,
        isCampaign: campaign,
        spainHour,
        nextTransitionMinutes: transition,
        nextSeason: campaign ? 'Invierno' : 'Campaña',
    };
}

/**
 * Returns the expected turn number based on wall clock time and the game epoch.
 * @param {number} epochMs  - game_epoch_timestamp as Unix ms (from DB)
 * @param {number} intervalMs - turn_duration_seconds * 1000
 * @returns {number} Expected turn number (>= 1)
 */
function calculateExpectedTurn(epochMs, intervalMs) {
    return Math.max(1, Math.floor((Date.now() - epochMs) / intervalMs) + 1);
}

/**
 * Returns milliseconds until the next exact multiple of intervalMs from the Unix epoch.
 * Keeps every turn aligned to wall-clock boundaries (:00/:10/:20 etc.) regardless of processing time.
 * @param {number} intervalMs
 * @returns {number}
 */
function msUntilNextBoundary(intervalMs) {
    const elapsed = Date.now() % intervalMs;
    return elapsed === 0 ? intervalMs : intervalMs - elapsed;
}

module.exports = { isCampaignSeason, getCurrentGameMonth, getSpainHour, getSeasonSnapshot, calculateExpectedTurn, msUntilNextBoundary, CAMPAIGN_MONTHS };
