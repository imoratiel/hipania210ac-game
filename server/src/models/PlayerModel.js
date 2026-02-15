const pool = require('../../db.js');

class PlayerModel {    
    async GetPlayerById(player_id) {
        const result = await pool.query('SELECT player_id FROM players WHERE player_id = $1', [player_id]);

        return result;
    }    
    async GetPlayerByUsername(playerName) {
        //console.log(`[DEBUG] Buscando jugador: "${playerName}"`);
        //console.log(`[DEBUG] Conectado a: ${pool.options.database} en ${pool.options.host}`);       
        const result = await pool.query("SELECT player_id FROM players WHERE LOWER(username) = LOWER($1)", [playerName]);
        return result;
    }
}

module.exports = new PlayerModel();