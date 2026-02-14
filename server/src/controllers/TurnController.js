const TurnService = require('../services/TurnService.js');
const { isEngineActive } = require('../logic/turn_engine.js');

class TurnController {

    async GetEngineStatus(req, res) {
        try {
            const status = await TurnService.GetGlobalStatus();

            res.json({
                success: true,
                engine: {
                    isRunning: isEngineActive(),
                    isPaused: status.is_paused,
                    currentTurn: status.current_turn,
                    lastUpdate: status.last_updated
                }
            });
        } catch (error) {
            Logger.error(error, {
                endpoint: '/admin/engine/status',
                method: 'GET',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al obtener estado del motor' });
        }
    }
    
    async SetGamePaused(req, res) {
        try {

            const status = await TurnService.SetGamePaused();
            
            res.json({ success: true, message: 'Juego pausado. El motor no procesará más turnos.' });

        } catch (error) {
            Logger.error(error, {
                endpoint: '/admin/engine/pause',
                method: 'POST',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al pausar el juego' });
        }
    }
    
    async SetGameResumed(req, res) {
        try {

            const status = await TurnService.SetGameResumed();
            
            res.json({ success: true, message: 'Juego reanudado. El motor procesará el siguiente turno según el intervalo configurado.' });

        } catch (error) {
            Logger.error(error, {
                endpoint: '/admin/engine/resume',
                method: 'POST',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al reanudar el juego' });
        }
    }
    
    async ForceGameTurn() {
        try {
            // Force process a turn manually
            const result = await TurnService.ForceGameTurn(pool, config);

            if (result.paused) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede forzar turno: el juego está pausado. Usa /admin/engine/resume primero.'
                });
            }

            if (result.success) {
                res.json({
                    success: true,
                    message: `Turno ${result.turn} procesado exitosamente`,
                    turn: result.turn,
                    date: result.date
                });
            } else {
                res.status(500).json({ success: false, message: 'Error al procesar turno' });
            }
        } catch (error) {
            Logger.error(error, {
                endpoint: '/admin/engine/force-turn',
                method: 'POST',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al forzar procesamiento de turno' });
        }
    }

    async ForceGameHarvest(){
        try {
            TurnService.ForceGameHarvest();
            res.json({
                success: true,
                message: `Cosecha procesada exitosamente en turno ${currentTurn}`,
                turn: currentTurn
            });
        } catch (error) {
            Logger.error(error, {
                endpoint: '/admin/engine/force-harvest',
                method: 'POST',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al forzar procesamiento de cosecha' });
        }
    }
    
    async ForceGameExploration(){
        try {
            TurnService.ForceGameExploration();
            res.json({
                success: true,
                message: `Exploraciones procesadas exitosamente en turno ${currentTurn}`,
                turn: currentTurn
            });
        } catch (error) {
            Logger.error(error, {
                endpoint: '/admin/engine/force-exploration',
                method: 'POST',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al forzar procesamiento de exploraciones' });
        }
    }
}

module.exports = new TurnController();