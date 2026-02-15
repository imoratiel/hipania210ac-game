const db = require('../../db.js'); // Tu conexión a DB

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
    async GetUnitTypes() {
        const query = `
            SELECT
                ut.unit_type_id,
                ut.name,
                ut.attack,
                ut.health_points,
                ut.speed,
                ut.gold_upkeep,
                ut.food_consumption,
                ut.is_siege,
                ut.descrip,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'resource_type', ur.resource_type,
                            'amount', ur.amount
                        )
                    ) FILTER (WHERE ur.unit_type_id IS NOT NULL),
                    '[]'
                ) AS requirements
            FROM unit_types ut
            LEFT JOIN unit_requirements ur ON ut.unit_type_id = ur.unit_type_id
            GROUP BY ut.unit_type_id, ut.name, ut.attack, ut.health_points, ut.speed,
                     ut.gold_upkeep, ut.food_consumption, ut.is_siege, ut.descrip
            ORDER BY ut.unit_type_id
        `;
        const result = await db.query(query);
        return result;
    }
    async GetPlayerGold(client, player_id) {
        const result = await client.query('SELECT gold FROM players WHERE player_id = $1', [player_id]);
        return result;
    }
    async GetUnitRequirements(client, unit_type_id) {
        const result = await client.query(
            'SELECT resource_type, amount FROM unit_requirements WHERE unit_type_id = $1',
            [unit_type_id]
        );
        return result;
    }
    async GetTerritoryForRecruitment(client, h3_index) {
        const result = await client.query(
            `SELECT td.h3_index, td.wood_stored, td.stone_stored, td.iron_stored, m.player_id
             FROM territory_details td
             JOIN h3_map m ON td.h3_index = m.h3_index
             WHERE td.h3_index = $1`,
            [h3_index]
        );
        return result;
    }
    async FindArmy(client, h3_index, army_name, player_id) {
        const result = await client.query(
            'SELECT army_id FROM armies WHERE h3_index = $1 AND name = $2 AND player_id = $3',
            [h3_index, army_name, player_id]
        );
        return result;
    }
    async CreateArmy(client, army_name, player_id, h3_index) {
        const result = await client.query(
            `INSERT INTO armies (name, player_id, h3_index)
             VALUES ($1, $2, $3)
             RETURNING army_id`,
            [army_name, player_id, h3_index]
        );
        return result;
    }
    async AddTroops(client, army_id, unit_type_id, quantity) {
        await client.query(
            `INSERT INTO troops (army_id, unit_type_id, quantity, experience, morale, stamina, force_rest)
             VALUES ($1, $2, $3, 10.00, 50.00, 100.00, false)`,
            [army_id, unit_type_id, quantity]
        );
    }
    async DeductPlayerGold(client, player_id, amount) {
        await client.query(
            'UPDATE players SET gold = gold - $1 WHERE player_id = $2',
            [amount, player_id]
        );
    }
    async DeductTerritoryResource(client, h3_index, resource_column, amount) {
        await client.query(
            `UPDATE territory_details SET ${resource_column} = ${resource_column} - $1 WHERE h3_index = $2`,
            [amount, h3_index]
        );
    }
    async GetTroops(player_id) {
        const query = `
            SELECT
                t.troop_id,
                t.quantity,
                t.experience,
                t.morale,
                ut.unit_type_id,
                ut.name AS unit_name,
                ut.attack,
                ut.health_points,
                ut.speed,
                a.army_id,
                a.name AS army_name,
                a.h3_index
            FROM troops t
            INNER JOIN unit_types ut ON t.unit_type_id = ut.unit_type_id
            INNER JOIN armies a ON t.army_id = a.army_id
            WHERE a.player_id = $1
            ORDER BY a.name, ut.name
        `;
        const result = await db.query(query, [player_id]);
        return result;
    }
    async GetArmyWithPlayer(army_id) {
        const result = await db.query(
            'SELECT army_id, name, h3_index, player_id FROM armies WHERE army_id = $1',
            [army_id]
        );
        return result;
    }
    async GetMyRoutes(player_id) {
        const result = await db.query(
            `SELECT a.army_id, a.name, a.h3_index, a.destination, ar.path
             FROM armies a
             JOIN army_routes ar ON ar.army_id = a.army_id
             WHERE a.player_id = $1`,
            [player_id]
        );
        return result;
    }
}

module.exports = new ArmyModel();