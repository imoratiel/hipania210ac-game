const pool = require('../../db.js');

class KingdomModel {
    async CheckTerritoryOwnership(client, h3_index) {
        const result = await client.query('SELECT player_id FROM h3_map WHERE h3_index = $1', [h3_index]);
        return result.rows[0];
    }
    async GetExplorationStatus(client, h3_index) {
        const result = await client.query('SELECT exploration_end_turn, discovered_resource FROM territory_details WHERE h3_index = $1', [h3_index]);
        return result.rows[0];
    }
    async GetPlayerGold(client, player_id) {
        const result = await client.query('SELECT gold FROM players WHERE player_id = $1', [player_id]);
        return result.rows[0];
    }
    async GetCurrentTurn(client) {
        const result = await client.query('SELECT current_turn FROM world_state WHERE id = 1');
        return result.rows[0];
    }
    async StartExploration(client, h3_index, player_id, exploration_cost, end_turn) {
        await client.query('UPDATE players SET gold = gold - $1 WHERE player_id = $2', [exploration_cost, player_id]);
        await client.query('UPDATE territory_details SET exploration_end_turn = $1 WHERE h3_index = $2', [end_turn, h3_index]);
    }
    async GetTerritoryForUpgrade(client, h3_index) {
        const query = `
            SELECT td.*, t.name AS terrain_type, t.food_output, t.wood_output, m.is_coast
            FROM territory_details td
            JOIN h3_map m ON td.h3_index = m.h3_index
            JOIN terrain_types t ON m.terrain_type_id = t.terrain_type_id
            WHERE td.h3_index = $1
        `;
        const result = await client.query(query, [h3_index]);
        return result.rows[0];
    }
    async ApplyUpgrade(client, h3_index, player_id, building_type, new_level, cost) {
        await client.query('UPDATE players SET gold = gold - $1 WHERE player_id = $2', [cost, player_id]);
        await client.query(`UPDATE territory_details SET ${building_type}_level = $1 WHERE h3_index = $2`, [new_level, h3_index]);
    }
    async GetMyFiefs(player_id) {
        const query = `
            SELECT
                m.h3_index,
                m.coord_x,
                m.coord_y,
                COALESCE(td.custom_name, s.name, m.h3_index) AS location_name,
                td.*,
                t.name AS terrain_name,
                t.food_output,
                COALESCE(garrison.total_troops, 0) AS total_troops,
                p.capital_h3
            FROM h3_map m
            JOIN territory_details td ON m.h3_index = td.h3_index
            JOIN terrain_types t ON m.terrain_type_id = t.terrain_type_id
            JOIN players p ON m.player_id = p.player_id
            LEFT JOIN settlements s ON m.h3_index = s.h3_index
            LEFT JOIN (
                SELECT a.h3_index, SUM(tr.quantity) AS total_troops
                FROM armies a
                JOIN troops tr ON a.army_id = tr.army_id
                WHERE a.player_id = $1
                GROUP BY a.h3_index
            ) garrison ON m.h3_index = garrison.h3_index
            WHERE m.player_id = $1
            ORDER BY td.population DESC
        `;
        const result = await pool.query(query, [player_id]);
        return result;
    }
}

module.exports = new KingdomModel();
