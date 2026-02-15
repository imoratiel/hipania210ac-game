const { Logger } = require('../utils/logger');
const ArmyModel = require('../models/ArmyModel.js');
const ArmySimulationService = require('./ArmySimulationService.js');
const h3 = require('h3-js');

class ArmyService {
    async GetArmyDetails(req, res) {
        try {
            const { h3_index } = req.params;

            const armiesResult = await ArmyModel.GetArmyDetailsByHex(h3_index);
            const armies = armiesResult.rows;

            for (const army of armies) {
                const unitsResult = await ArmyModel.GetArmyUnits(army.army_id);
                army.units = unitsResult.rows;
                army.total_count = army.units.reduce((sum, u) => sum + u.quantity, 0);

                const fatigueStatus = await ArmySimulationService.getArmyFatigueStatus(army.army_id);
                if (fatigueStatus.success) {
                    army.min_stamina = fatigueStatus.minStamina;
                    army.has_force_rest = fatigueStatus.hasForceRest;
                    army.exhausted_units = fatigueStatus.exhaustedUnits;
                } else {
                    army.min_stamina = 100;
                    army.has_force_rest = false;
                    army.exhausted_units = 0;
                }
            }

            res.json({ success: true, armies, current_player_id: req.user.player_id });
        } catch (error) {
            Logger.error(error, { endpoint: '/map/army-details', method: 'GET', userId: req.user?.player_id, payload: req.params });
            res.status(500).json({ success: false, message: 'Error al obtener detalles del ejército' });
        }
    }
    async GetArmiesInRegion(req, res) {
        try {
            const { minLat, maxLat, minLng, maxLng } = req.query;

            if (!minLat || !maxLat || !minLng || !maxLng) {
                return res.status(400).json({ success: false, message: 'Missing bounding box parameters' });
            }

            const bounds = {
                minLat: parseFloat(minLat),
                maxLat: parseFloat(maxLat),
                minLng: parseFloat(minLng),
                maxLng: parseFloat(maxLng)
            };

            if (Object.values(bounds).some(isNaN)) {
                return res.status(400).json({ success: false, message: 'Invalid bounding box parameters' });
            }

            const H3_RESOLUTION = 8;
            const polygon = [
                [bounds.minLat, bounds.minLng],
                [bounds.minLat, bounds.maxLng],
                [bounds.maxLat, bounds.maxLng],
                [bounds.maxLat, bounds.minLng]
            ];
            const h3CellsArray = Array.from(h3.polygonToCells(polygon, H3_RESOLUTION)).slice(0, 50000);

            if (h3CellsArray.length === 0) {
                return res.json({ success: true, armies: [], current_player_id: req.user.player_id });
            }

            const result = await ArmyModel.GetArmiesInBounds(h3CellsArray);

            res.json({
                success: true,
                armies: result.rows,
                current_player_id: req.user.player_id
            });
        } catch (error) {
            Logger.error(error, { endpoint: '/map/armies', method: 'GET', userId: req.user?.player_id, payload: req.query });
            res.status(500).json({ success: false, message: 'Error al obtener ejércitos' });
        }
    }
}

module.exports = new ArmyService();
 