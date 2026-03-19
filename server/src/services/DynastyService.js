'use strict';

const { Logger }          = require('../utils/logger');
const CharacterModel      = require('../models/CharacterModel');
const NotificationService = require('./NotificationService');

class DynastyService {
    /**
     * Gestiona la sucesión cuando el personaje principal muere.
     * Prioridad: heredero designado (≥16) → adulto de mayor nivel → niño (crisis) → extinción.
     * Tras promover al nuevo líder, designa automáticamente al siguiente adulto como heredero.
     *
     * @param {import('pg').PoolClient} client
     * @param {number} playerId
     * @param {number} deceasedId - id del personaje muerto (excluido de la búsqueda)
     * @param {number} currentTurn
     */
    async handleSuccession(client, playerId, deceasedId, currentTurn = 0) {
        // 1. Heredero designado (debe ser adulto)
        const heirResult = await client.query(
            `SELECT * FROM characters
             WHERE player_id = $1 AND is_heir = TRUE AND id != $2
               AND health > 0 AND is_captive = FALSE
             LIMIT 1`,
            [playerId, deceasedId]
        );
        let successor = heirResult.rows[0] ?? null;

        // 2. Fallback: adulto de mayor nivel (excluyendo niños < 16)
        if (!successor) {
            const fallbackResult = await client.query(
                `SELECT * FROM characters
                 WHERE player_id = $1 AND id != $2
                   AND age >= 16 AND health > 0 AND is_captive = FALSE
                 ORDER BY level DESC LIMIT 1`,
                [playerId, deceasedId]
            );
            successor = fallbackResult.rows[0] ?? null;
        }

        // 3. Último recurso: cualquier personaje vivo (incluso niño — crisis dinástica)
        if (!successor) {
            const lastResult = await client.query(
                `SELECT * FROM characters
                 WHERE player_id = $1 AND id != $2 AND health > 0 AND is_captive = FALSE
                 ORDER BY age DESC LIMIT 1`,
                [playerId, deceasedId]
            );
            successor = lastResult.rows[0] ?? null;
        }

        if (successor) {
            await CharacterModel.promoteToMain(client, playerId, successor.id);

            Logger.action(
                `Sucesión dinástica: ${successor.name} (id=${successor.id}) asume liderazgo del jugador ${playerId}`,
                playerId
            );

            await NotificationService.createSystemNotification(
                playerId, 'Dinastía',
                `👑 **${successor.name}** asume el liderazgo de la facción.`,
                currentTurn
            );

            // Auto-asignar nuevo heredero entre adultos restantes
            const newHeir = await CharacterModel.assignBestAsHeir(client, playerId);
            if (newHeir) {
                await NotificationService.createSystemNotification(
                    playerId, 'Dinastía',
                    `🔱 **${newHeir.name}** es designado nuevo heredero.`,
                    currentTurn
                );
            } else {
                await NotificationService.createSystemNotification(
                    playerId, 'Dinastía',
                    `⚠️ No hay adultos disponibles para ser heredero. Considera adoptar.`,
                    currentTurn
                );
            }

            return { success: true, successor };
        }

        // Sin ningún personaje vivo
        Logger.action(`Jugador ${playerId}: línea dinástica extinguida.`, playerId);
        await NotificationService.createSystemNotification(
            playerId, 'Dinastía',
            `☠️ **Línea dinástica extinguida**. Todos tus personajes han muerto. Considera adoptar.`,
            currentTurn
        );
        return { success: false, successor: null };
    }

    /**
     * Gestiona la muerte del heredero (is_heir = true) fuera de combate.
     * Auto-asigna al siguiente adulto de mayor nivel como heredero.
     */
    async handleHeirDeath(client, playerId, deceasedId, currentTurn = 0) {
        const newHeir = await CharacterModel.assignBestAsHeir(client, playerId);
        if (newHeir) {
            await NotificationService.createSystemNotification(
                playerId, 'Dinastía',
                `🔱 **${newHeir.name}** pasa a ser el nuevo heredero.`,
                currentTurn
            );
        } else {
            await NotificationService.createSystemNotification(
                playerId, 'Dinastía',
                `⚠️ El heredero ha muerto y no hay adultos para sustituirle.`,
                currentTurn
            );
        }
        return newHeir;
    }
}

module.exports = new DynastyService();
