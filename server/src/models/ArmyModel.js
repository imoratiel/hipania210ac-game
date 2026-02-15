const db = require('../db.js'); // Tu conexión a DB

class ArmyModel {
    async findById(armyId) {
        const query = 'SELECT * FROM armies WHERE id = $1';
        const { rows } = await db.query(query, [armyId]);
        return rows[0];
    }

    async getArmyUnits(armyId) {
        const query = 'SELECT * FROM army_units WHERE army_id = $1';
        const { rows } = await db.query(query, [armyId]);
        return rows;
    }

    async updatePositionAndStamina(armyId, h3Index, staminaUpdates) {
        // staminaUpdates sería un array de {unitId, stamina}
        // Aquí usarías una transacción para actualizar posición y fatiga
    }

    async saveRoute(armyId, pathJson) {
        const query = `
            INSERT INTO army_routes (army_id, path)
            VALUES ($1, $2)
            ON CONFLICT (army_id) DO UPDATE SET path = $2`;
        await db.query(query, [armyId, JSON.stringify(pathJson)]);
    }
    async GetArmyDetailsByHex(h3_index) {
        const query = `
            SELECT
                a.army_id, a.name, a.player_id,
                a.gold_provisions, a.food_provisions, a.wood_provisions,
                p.username AS player_name,
                p.color AS player_color,
                a.destination,
                a.recovering
            FROM armies a
            JOIN players p ON a.player_id = p.player_id
            WHERE a.h3_index = $1
        `;
        const result = await db.query(query, [h3_index]);
        return result;
    }
    async GetArmyUnits(army_id) {
        const query = `
            SELECT
                t.quantity, t.experience, t.morale,
                ut.name AS unit_name, ut.attack, ut.health_points,
                t.stamina, t.force_rest 
            FROM troops t
            JOIN unit_types ut ON t.unit_type_id = ut.unit_type_id
            WHERE t.army_id = $1
        `;
        const result = await db.query(query, [army_id]);
        return result;
    }
    async GetArmiesInBounds(h3CellsArray) {
        const query = `
            SELECT
                a.h3_index,
                a.player_id,
                COUNT(DISTINCT a.army_id) AS army_count,
                SUM(t.quantity) AS total_troops
            FROM armies a
            LEFT JOIN troops t ON a.army_id = t.army_id
            WHERE a.h3_index = ANY($1::text[])
            GROUP BY a.h3_index, a.player_id
            ORDER BY a.h3_index
        `;
        const result = await db.query(query, [h3CellsArray]);
        return result;
    }
}

module.exports = new ArmyModel();