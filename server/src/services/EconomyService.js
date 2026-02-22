const { Logger } = require('../utils/logger');
const AdminModel = require('../models/AdminModel.js');
const { CONFIG } = require('../config.js');
const pool = require('../../db.js');

class EconomyService {
    /**
     * GET /economy/summary
     * Returns aggregated resource totals across all fiefs for the requesting player,
     * plus current tax_rate and tithe_active settings.
     */
    async GetEconomySummary(req, res) {
        const player_id = req.user.player_id;
        try {
            const result = await pool.query(`
                SELECT
                    COUNT(td.h3_index)::int            AS fief_count,
                    COALESCE(SUM(td.food_stored),  0)  AS total_food,
                    COALESCE(SUM(td.wood_stored),  0)  AS total_wood,
                    COALESCE(SUM(td.stone_stored), 0)  AS total_stone,
                    COALESCE(SUM(td.iron_stored),  0)  AS total_iron,
                    COALESCE(SUM(td.gold_stored),  0)  AS total_gold,
                    COALESCE(SUM(td.population),   0)  AS total_population
                FROM territory_details td
                JOIN h3_map m ON td.h3_index = m.h3_index
                WHERE m.player_id = $1
            `, [player_id]);

            const totals = result.rows[0];

            // Current economy settings from in-memory CONFIG (loaded from game_config table)
            const taxRate     = CONFIG.gameplay?.tax_rate      ?? 5;
            const titheActive = CONFIG.gameplay?.tithe_active  ?? false;

            // Estimate next tax yield: taxRate% of total_gold across all fiefs
            const estimatedTaxYield = Math.floor(Number(totals.total_gold) * taxRate / 100);

            res.json({
                success: true,
                summary: {
                    fief_count:       totals.fief_count,
                    total_food:       Number(totals.total_food),
                    total_wood:       Number(totals.total_wood),
                    total_stone:      Number(totals.total_stone),
                    total_iron:       Number(totals.total_iron),
                    total_gold:       Number(totals.total_gold),
                    total_population: Number(totals.total_population),
                },
                settings: {
                    tax_rate:           taxRate,
                    tithe_active:       titheActive === true || titheActive === 'true' || titheActive === 1,
                    estimated_tax_yield: estimatedTaxYield,
                }
            });
        } catch (error) {
            Logger.error(error, { context: 'EconomyService.GetEconomySummary', userId: player_id });
            res.status(500).json({ success: false, message: 'Error al obtener resumen económico' });
        }
    }

    /**
     * PATCH /economy/settings
     * Allows any authenticated player to adjust their tax rate and tithe toggle.
     * These are global settings stored in game_config (shared, admin-level in a real game,
     * but exposed here as player-facing controls per design).
     */
    async UpdateEconomySettings(req, res) {
        const player_id = req.user.player_id;
        try {
            const { tax_rate, tithe_active } = req.body;

            const updates = [];

            if (tax_rate !== undefined) {
                const rate = Math.min(10, Math.max(1, parseInt(tax_rate, 10)));
                if (isNaN(rate)) {
                    return res.status(400).json({ success: false, message: 'tax_rate debe ser un número entre 1 y 10' });
                }
                await AdminModel.UpsertConfig('gameplay', 'tax_rate', rate);
                // Sync in-memory config immediately
                if (!CONFIG.gameplay) CONFIG.gameplay = {};
                CONFIG.gameplay.tax_rate = rate;
                updates.push(`Tasa de impuestos: ${rate}%`);
            }

            if (tithe_active !== undefined) {
                const active = tithe_active === true || tithe_active === 'true' || tithe_active === 1;
                await AdminModel.UpsertConfig('gameplay', 'tithe_active', active ? 'true' : 'false');
                // Sync in-memory config immediately
                if (!CONFIG.gameplay) CONFIG.gameplay = {};
                CONFIG.gameplay.tithe_active = active;
                updates.push(`Diezmo: ${active ? 'activado' : 'desactivado'}`);
            }

            if (updates.length === 0) {
                return res.status(400).json({ success: false, message: 'No se proporcionaron parámetros válidos' });
            }

            Logger.action(`Configuración económica actualizada por jugador ${player_id}: ${updates.join(', ')}`, player_id);
            res.json({ success: true, message: `Configuración guardada: ${updates.join(', ')}` });

        } catch (error) {
            Logger.error(error, { context: 'EconomyService.UpdateEconomySettings', userId: player_id, payload: req.body });
            res.status(500).json({ success: false, message: 'Error al actualizar configuración económica' });
        }
    }
}

module.exports = new EconomyService();
