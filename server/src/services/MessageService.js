const { Logger } = require('../utils/logger');
const MessageModel = require('../models/MessageModel.js');

class MessageService {
    async GetMessagesByUserId(req,res) {
        try {
            const player_id = req.user.player_id;  
            Logger.action(`Mensajes req.user.player_id ${req.user.player_id}`); 
            Logger.action(`Mensajes player_id ${player_id}`); 

            const result = await MessageModel.GetMessagesByUserId(player_id);
            Logger.action(`Mensajes ${result.rows}`);   

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
}

module.exports = new MessageService();