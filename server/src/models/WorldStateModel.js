const db = require('../../db.js'); // Tu conexión a DB

class WorldStateModel {
    async GetCurrentTurn() {
        const worldState = await pool.query('SELECT current_turn, is_paused, last_updated FROM world_state WHERE id = 1');
        
        const turn = worldState.rows[0];
        
        return turn;
    }
    async SetGamePaused() {
        await pool.query('UPDATE world_state SET is_paused = true WHERE id = 1');        
        return;
    }
    async SetGameResumed() {
        await pool.query('UPDATE world_state SET is_paused = false WHERE id = 1');        
        return;
    }
}

module.exports = new WorldStateModel();