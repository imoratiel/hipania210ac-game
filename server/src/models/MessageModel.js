const pool = require('../../db.js');

class MessageModel {
    
    async GetMessagesByUserId(player_id) {
        const result = await pool.query('SELECT m.*, s.username as sender_username FROM messages m LEFT JOIN players s ON m.sender_id = s.player_id WHERE m.receiver_id = $1 OR m.sender_id = $1 ORDER BY m.sent_at DESC', [player_id]);
        return result;
    }
}

module.exports = new MessageModel();