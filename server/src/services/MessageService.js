const { Logger } = require('../utils/logger');
const MessageModel = require('../models/MessageModel.js');
const PlayerModel = require('../models/PlayerModel.js');

class MessageService {
    async GetMessagesByUserId(req,res) {
        try {
            const player_id = req.user.player_id;  

            const result = await MessageModel.GetMessagesByUserId(player_id);

            res.json({ success: true, messages: result.rows });            
        } catch (error) {
            Logger.error(error, {
                endpoint: '/messages',
                method: 'GET',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
        }        
    }
    async SendMessage(req,res){
        try {
            const { recipient_username, subject, body } = req.body;

            const receiver = await PlayerModel.GetPlayerByUsername(recipient_username);

            if (receiver.rows.length === 0) return res.status(404).json({ success: false, message: 'Destinatario no encontrado' });

            await MessageModel.SendMessage(req.user.player_id, receiver.rows[0].player_id, subject, body);
            
            res.json({ success: true, message: 'Mensaje enviado' });
        } catch (error) {
            Logger.error(error, {
                endpoint: '/messages',
                method: 'POST',
                userId: req.user?.player_id
            });
            res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
        }    
    }
}

module.exports = new MessageService();