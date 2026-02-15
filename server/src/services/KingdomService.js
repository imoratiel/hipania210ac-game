const { Logger, logGameEvent } = require('../utils/logger');
const KingdomModel = require('../models/KingdomModel.js');
const { CONFIG } = require('../config.js');
const infrastructure = require('../logic/infrastructure.js');
const pool = require('../../db.js');

class KingdomService {
    async StartExploration(req, res) {
        const client = await pool.connect();
        try {
            const { h3_index } = req.body;
            const player_id = req.user.player_id;

            await client.query('BEGIN');

            const territory = await KingdomModel.CheckTerritoryOwnership(client, h3_index);
            if (territory?.player_id !== player_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ success: false, message: 'No posees este territorio' });
            }

            const exploration = await KingdomModel.GetExplorationStatus(client, h3_index);
            if (exploration.discovered_resource !== null || exploration.exploration_end_turn !== null) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Exploración ya realizada o en curso' });
            }

            const player = await KingdomModel.GetPlayerGold(client, player_id);
            const cost = CONFIG.exploration.gold_cost;
            if (player.gold < cost) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Oro insuficiente' });
            }

            const world = await KingdomModel.GetCurrentTurn(client);
            const end_turn = world.current_turn + CONFIG.exploration.turns_required;

            await KingdomModel.StartExploration(client, h3_index, player_id, cost, end_turn);
            await client.query('COMMIT');

            logGameEvent(`[EXPLORACIÓN] Jugador ${player_id} inició exploración en ${h3_index}`);

            const updated = await KingdomModel.GetPlayerGold(client, player_id);
            res.json({
                success: true,
                message: `Exploración iniciada, finaliza en turno ${end_turn}`,
                exploration_end_turn: end_turn,
                new_gold_balance: updated.gold,
                gold_spent: cost
            });
        } catch (error) {
            await client.query('ROLLBACK');
            Logger.error(error, { endpoint: '/territory/explore', method: 'POST', userId: req.user?.player_id, payload: req.body });
            res.status(500).json({ success: false, error: error.message });
        } finally {
            client.release();
        }
    }
    async UpgradeBuilding(req, res) {
        const client = await pool.connect();
        try {
            const { h3_index, building_type } = req.body;
            const player_id = req.user.player_id;

            const territory_owner = await KingdomModel.CheckTerritoryOwnership(client, h3_index);
            if (territory_owner?.player_id !== player_id) {
                return res.status(403).json({ success: false, message: 'No posees este territorio' });
            }

            const territory = await KingdomModel.GetTerritoryForUpgrade(client, h3_index);
            const validation_error = infrastructure.validateUpgrade(building_type, territory);
            if (validation_error) {
                return res.status(400).json({ success: false, message: validation_error });
            }

            const current_level = territory[`${building_type}_level`] || 0;
            const cost = infrastructure.calculateUpgradeCost(building_type, current_level, CONFIG);

            const player = await KingdomModel.GetPlayerGold(client, player_id);
            if (player.gold < cost) {
                return res.status(400).json({ success: false, message: 'Oro insuficiente' });
            }

            await client.query('BEGIN');
            await KingdomModel.ApplyUpgrade(client, h3_index, player_id, building_type, current_level + 1, cost);
            await client.query('COMMIT');

            logGameEvent(`[INFRAESTRUCTURA] Jugador ${player_id} mejoró ${building_type} en ${h3_index}`);
            res.json({ success: true, message: `${building_type} mejorada al nivel ${current_level + 1}` });
        } catch (error) {
            await client.query('ROLLBACK');
            Logger.error(error, { endpoint: '/territory/upgrade', method: 'POST', userId: req.user?.player_id, payload: req.body });
            res.status(500).json({ success: false, error: error.message });
        } finally {
            client.release();
        }
    }
    async GetMyFiefs(req, res) {
        try {
            const result = await KingdomModel.GetMyFiefs(req.user.player_id);

            const fiefs = result.rows.map(row => ({
                ...row,
                is_capital: (row.h3_index === row.capital_h3)
            }));

            res.json({ success: true, fiefs });
        } catch (error) {
            Logger.error(error, { endpoint: '/game/my-fiefs', method: 'GET', userId: req.user?.player_id });
            res.status(500).json({ success: false, message: 'Error al obtener feudos' });
        }
    }
}

module.exports = new KingdomService();
