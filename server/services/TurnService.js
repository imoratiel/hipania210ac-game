const ArmyModel = require('../models/WorldStateModel.js');
const { processGameTurn, processHarvestManually } = require('../src/logic/turn_engine');

class TurnService {
    async GetGlobalStatus() {
        Logger.action(`Acceso administrativo a /admin/engine/status - Consultando estado del motor`, req.user.player_id);

        // Aquí haces la lógica de "negocio"
        const status = await WorldStateModel.GetCurrentTurn();

        return {
            status
        };
    }
    async SetGamePaused() {
        Logger.action(`Acceso administrativo a /admin/engine/pause - Pausando juego`, req.user.player_id);

        await WorldStateModel.SetGamePaused();
        
        Logger.action(`Juego pausado exitosamente`, req.user.player_id);

        return;
    }
    async SetGameResumed() {
        Logger.action(`Acceso administrativo a /admin/engine/resume - Reanudando juego`, req.user.player_id);

        await WorldStateModel.SetGameResumed();
        
        Logger.action(`Juego reanudado exitosamente`, req.user.player_id);

        return;
    }

    async ForceGameTurn() {
        Logger.action(`Acceso administrativo a /admin/engine/force-turn - Forzando procesamiento de turno`, req.user.player_id);

        // Force process a turn manually
        const result = await processGameTurn(pool, config);

        if (result.paused) {
            Logger.action(`Intento de forzar turno bloqueado: juego está pausado`, req.user.player_id);
        }

        if (result.success) {
            Logger.action(`Turno forzado exitosamente: turno ${result.turn}`, req.user.player_id);
        } else {
            Logger.action(`Error al forzar turno`, req.user.player_id);
        }
    }

    async ForceGameHarvest(){
        Logger.action(`Acceso administrativo a /admin/engine/force-harvest - Forzando procesamiento de cosecha`, req.user.player_id);

        const worldState = TurnService.GetGlobalStatus();
        const currentTurn = worldState.rows[0].current_turn;

        await processHarvestManually(client, currentTurn, config);

        Logger.action(`Cosecha forzada exitosamente en turno ${currentTurn}`, req.user.player_id);
    }
    
    async ForceGameExploration(){
        Logger.action(`Acceso administrativo a /admin/engine/force-exploration - Forzando procesamiento de exploraciones`, req.user.player_id);

        const worldState = TurnService.GetGlobalStatus();
        const currentTurn = worldState.rows[0].current_turn;

        await processExplorationsManually(client, currentTurn, config);

        Logger.action(`Exploraciones forzadas exitosamente en turno ${currentTurn}`, req.user.player_id);        
    }
}

module.exports = new TurnService();