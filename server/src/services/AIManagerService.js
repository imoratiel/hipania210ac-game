/**
 * AI Manager Service
 * Manages AI agents (NPC kingdoms) with personality-driven decision cycles.
 * Each AI profile has a unique set of priorities and behaviors.
 *
 * Current profiles:
 *   - farmer: Peaceful expansion, food production focus, defensive military.
 */

const pool = require('../../db.js');
const h3 = require('h3-js');
const { Logger } = require('../utils/logger');
const { generateAIName } = require('../utils/npcGenerator');
const KingdomModel = require('../models/KingdomModel');
const { generateInitialEconomy } = require('../logic/conquest');

// ── Farmer profile constants ─────────────────────────────────────────────────
const FARMER = {
    STARTING_GOLD: 50000,
    CLAIM_COST: 100,
    GOLD_TO_BUILD: 5000,        // Must have at least this much gold to start a building
    GOLD_TO_EXPAND: 10000,      // Must have at least this to colonize a new hex
    GOLD_RESERVE: 2000,         // Never spend gold below this threshold
    THREAT_SCAN_RADIUS: 2,      // H3 ring radius to scan for enemy armies
    MIN_TROOPS_DEFEND: 50,      // If below this, recruit when threatened
    RECRUIT_QUANTITY: 50,       // Troops to recruit in threat response
    // Building priorities (building_id order): highest food_bonus first
    // Market(id=3, food=10) → Church(id=2, food=5) → Barracks(id=1, food=0)
    BUILDING_PRIORITY_ORDER: 'food_bonus DESC, gold_cost ASC',
    COLORS: ['#8B7355', '#6B8E23', '#A0522D', '#556B2F', '#8FBC8F', '#BC8F5F', '#9ACD32', '#DEB887'],
};

class AIManagerService {
    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC: Spawn a new Farmer AI agent
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Spawns a Farmer AI agent at a given hex, or finds a suitable random one.
     * Creates the player record, claims the capital hex and ring-1 neighbors.
     * @param {string|null} targetH3 - Optional target hex; auto-selected if null
     * @returns {Promise<{success, player_id?, name?, h3_index?, hexes_claimed?}>}
     */
    async spawnFarmerAgent(targetH3 = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const spawnHex = targetH3 || await this._findSuitableSpawnHex(client);
            if (!spawnHex) {
                await client.query('ROLLBACK');
                return { success: false, message: 'No se encontró un hex disponible para el agente IA' };
            }

            // Verify hex is still unclaimed
            const hexCheck = await client.query(
                `SELECT h3_index FROM h3_map
                 JOIN terrain_types tt ON h3_map.terrain_type_id = tt.terrain_type_id
                 WHERE h3_map.h3_index = $1
                   AND h3_map.player_id IS NULL
                   AND COALESCE(tt.is_colonizable, TRUE) = TRUE`,
                [spawnHex]
            );
            if (hexCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return { success: false, message: `El hex ${spawnHex} no está disponible para colonización` };
            }

            const aiName = generateAIName('farmer');
            const aiColor = FARMER.COLORS[Math.floor(Math.random() * FARMER.COLORS.length)];
            const aiUsername = `ai_farmer_${Date.now()}`;

            // Create AI player record
            const playerResult = await client.query(
                `INSERT INTO players (username, password_hash, display_name, color, gold, is_ai, ai_profile, role)
                 VALUES ($1, 'NO_LOGIN', $2, $3, $4, TRUE, 'farmer', 'player')
                 RETURNING player_id`,
                [aiUsername, aiName, aiColor, FARMER.STARTING_GOLD]
            );
            const aiPlayerId = playerResult.rows[0].player_id;

            // Claim capital hex
            const capitalEco = generateInitialEconomy();
            await KingdomModel.ClaimHex(client, spawnHex, aiPlayerId);
            await KingdomModel.InsertTerritoryDetails(client, spawnHex, capitalEco);
            await KingdomModel.SetCapital(client, spawnHex, aiPlayerId);

            // Claim colonizable ring-1 neighbors
            const ring1 = h3.gridDisk(spawnHex, 1).filter(n => n !== spawnHex);
            const neighbors = await KingdomModel.GetColonizableNeighbors(client, ring1);
            for (const neighbor of neighbors) {
                const eco = generateInitialEconomy();
                await KingdomModel.ClaimHex(client, neighbor.h3_index, aiPlayerId);
                await KingdomModel.InsertTerritoryDetails(client, neighbor.h3_index, eco);
            }

            await client.query('COMMIT');

            Logger.action(
                `[AI] Agente Agricultor "${aiName}" (player_id=${aiPlayerId}) fundado en ${spawnHex} (${neighbors.length + 1} hexes)`,
                { player_id: aiPlayerId, h3_index: spawnHex }
            );
            return {
                success: true,
                player_id: aiPlayerId,
                name: aiName,
                h3_index: spawnHex,
                hexes_claimed: neighbors.length + 1,
            };
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(error, { context: 'AIManagerService.spawnFarmerAgent', targetH3 });
            return { success: false, message: error.message };
        } finally {
            client.release();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC: Process one AI turn for all active agents
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Called by the turn engine every N turns.
     * Iterates all AI agents and runs their profile-specific decision cycle.
     * @param {number} turn - Current game turn number
     */
    async processAITurn(turn) {
        let agents = [];
        const queryClient = await pool.connect();
        try {
            const result = await queryClient.query(
                `SELECT player_id, display_name, ai_profile FROM players WHERE is_ai = TRUE`
            );
            agents = result.rows;
        } finally {
            queryClient.release();
        }

        if (agents.length === 0) return;

        Logger.engine(`[TURN ${turn}] AI: procesando ${agents.length} agente(s)...`);

        for (const agent of agents) {
            try {
                if (agent.ai_profile === 'farmer') {
                    await this._processFarmerTurn(agent.player_id, turn);
                }
            } catch (agentError) {
                Logger.error(agentError, {
                    context: 'AIManagerService.processAITurn',
                    turn,
                    playerId: agent.player_id,
                });
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE: Farmer decision cycle
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Full decision cycle for the Farmer AI profile.
     * Phases: Analysis → Construction → Expansion → Threat Response
     */
    async _processFarmerTurn(playerId, turn) {
        // Phases 1-3 share a single transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Phase 1: Analysis
            const state = await this._farmerAnalysis(client, playerId);
            if (!state || state.territories.length === 0) {
                await client.query('ROLLBACK');
                return; // No territories — dormant AI
            }

            // Phase 2: Construction (build economy buildings)
            await this._farmerConstruction(client, playerId, state, turn);

            // Phase 3: Expansion (colonize adjacent hex if wealthy enough)
            await this._farmerExpansion(client, playerId, state, turn);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(error, { context: 'AIManagerService._processFarmerTurn.phases1-3', playerId, turn });
        } finally {
            client.release();
        }

        // Phase 4: Threat response (own transaction — involves army creation)
        await this._farmerThreatResponse(playerId, turn);
    }

    /**
     * Phase 1 — Analysis: Read territory state for this AI player.
     */
    async _farmerAnalysis(client, playerId) {
        const result = await client.query(`
            SELECT
                td.h3_index,
                td.population,
                td.food_stored,
                tt.food_output,
                tt.name AS terrain_name,
                fb.building_id AS existing_building_id,
                fb.is_under_construction,
                p.gold
            FROM territory_details td
            JOIN h3_map m ON td.h3_index = m.h3_index
            JOIN terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
            JOIN players p ON p.player_id = m.player_id
            LEFT JOIN fief_buildings fb ON fb.h3_index = td.h3_index
            WHERE m.player_id = $1
        `, [playerId]);

        if (result.rows.length === 0) return null;

        const gold = parseInt(result.rows[0].gold) || 0;
        const territories = result.rows;
        const territoriesWithoutBuilding = territories.filter(t => !t.existing_building_id);

        return { gold, territories, territoriesWithoutBuilding };
    }

    /**
     * Phase 2 — Construction: Build the highest food-bonus affordable building
     * on the territory with the most food stored (most productive site).
     */
    async _farmerConstruction(client, playerId, state, turn) {
        if (state.gold < FARMER.GOLD_TO_BUILD) return;
        if (state.territoriesWithoutBuilding.length === 0) return;

        // Get buildings ordered by food_bonus DESC (prefer Market > Church > Barracks)
        const buildingsResult = await client.query(
            `SELECT id, name, gold_cost, construction_time_turns, food_bonus
             FROM buildings
             WHERE required_building_id IS NULL
             ORDER BY ${FARMER.BUILDING_PRIORITY_ORDER}`
        );
        if (buildingsResult.rows.length === 0) return;

        // Pick the best building we can afford while keeping the gold reserve
        const building = buildingsResult.rows.find(
            b => state.gold - parseInt(b.gold_cost) >= FARMER.GOLD_RESERVE
        );
        if (!building) return;

        // Target: territory without a building, highest food_stored (most active site)
        const target = state.territoriesWithoutBuilding.reduce((best, t) =>
            parseInt(t.food_stored) > parseInt(best.food_stored) ? t : best
        );

        await client.query(
            'UPDATE players SET gold = gold - $1 WHERE player_id = $2',
            [building.gold_cost, playerId]
        );
        await client.query(
            `INSERT INTO fief_buildings (h3_index, building_id, remaining_construction_turns, is_under_construction)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (h3_index) DO NOTHING`,
            [target.h3_index, building.id, building.construction_time_turns]
        );

        Logger.engine(
            `[TURN ${turn}] AI Agricultor (${playerId}) inició construcción de "${building.name}" en ${target.h3_index}`
        );
    }

    /**
     * Phase 3 — Expansion: Colonize the adjacent unclaimed hex with the best
     * food terrain if gold threshold is met.
     */
    async _farmerExpansion(client, playerId, state, turn) {
        if (state.gold < FARMER.GOLD_TO_EXPAND) return;

        const ownedSet = new Set(state.territories.map(t => t.h3_index));

        // Collect all ring-1 neighbors of all owned hexes
        const candidateSet = new Set();
        for (const hex of ownedSet) {
            h3.gridDisk(hex, 1).filter(n => n !== hex && !ownedSet.has(n)).forEach(n => candidateSet.add(n));
        }
        if (candidateSet.size === 0) return;

        const candidates = [...candidateSet];
        const result = await client.query(
            `SELECT m.h3_index, tt.food_output, tt.name AS terrain_name
             FROM h3_map m
             JOIN terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
             WHERE m.h3_index = ANY($1)
               AND m.player_id IS NULL
               AND COALESCE(tt.is_colonizable, TRUE) = TRUE
             ORDER BY tt.food_output DESC
             LIMIT 1
             FOR UPDATE OF m`,
            [candidates]
        );
        if (result.rows.length === 0) return;

        const target = result.rows[0];
        const eco = generateInitialEconomy();

        await client.query(
            'UPDATE players SET gold = gold - $1 WHERE player_id = $2',
            [FARMER.CLAIM_COST, playerId]
        );
        await KingdomModel.ClaimHex(client, target.h3_index, playerId);
        await KingdomModel.InsertTerritoryDetails(client, target.h3_index, eco);

        Logger.engine(
            `[TURN ${turn}] AI Agricultor (${playerId}) expandió a ${target.h3_index} (${target.terrain_name}, food_output=${target.food_output})`
        );
    }

    /**
     * Phase 4 — Threat Response: Scan radius-2 for enemy armies.
     * If threatened and below minimum troops, recruit basic infantry.
     */
    async _farmerThreatResponse(playerId, turn) {
        const client = await pool.connect();
        try {
            // Get capital hex
            const capitalResult = await client.query(
                'SELECT capital_h3 FROM players WHERE player_id = $1',
                [playerId]
            );
            const capitalHex = capitalResult.rows[0]?.capital_h3;
            if (!capitalHex) return;

            // Scan for enemy armies within radius
            const scanHexes = h3.gridDisk(capitalHex, FARMER.THREAT_SCAN_RADIUS);
            const threatResult = await client.query(
                `SELECT COUNT(*)::int AS enemy_count
                 FROM armies
                 WHERE h3_index = ANY($1) AND player_id != $2`,
                [scanHexes, playerId]
            );
            if (parseInt(threatResult.rows[0].enemy_count) === 0) return;

            // Count our current troops
            const troopResult = await client.query(
                `SELECT COALESCE(SUM(tr.quantity), 0)::int AS total
                 FROM armies a
                 JOIN troops tr ON tr.army_id = a.army_id
                 WHERE a.player_id = $1`,
                [playerId]
            );
            const currentTroops = parseInt(troopResult.rows[0].total) || 0;
            if (currentTroops >= FARMER.MIN_TROOPS_DEFEND) return;

            // Get cheapest unit type
            const unitResult = await client.query(
                `SELECT ut.unit_type_id, r.amount AS gold_cost
                 FROM unit_types ut
                 LEFT JOIN unit_type_requirements r ON r.unit_type_id = ut.unit_type_id AND r.resource_type = 'gold'
                 ORDER BY COALESCE(r.amount, 0) ASC
                 LIMIT 1`
            );
            if (unitResult.rows.length === 0) return;
            const unitType = unitResult.rows[0];
            const recruitCost = (parseInt(unitType.gold_cost) || 0) * FARMER.RECRUIT_QUANTITY;

            // Check current gold
            const goldResult = await client.query(
                'SELECT gold FROM players WHERE player_id = $1',
                [playerId]
            );
            const currentGold = parseInt(goldResult.rows[0]?.gold) || 0;
            if (currentGold < recruitCost + FARMER.GOLD_RESERVE) return;

            await client.query('BEGIN');

            // Find or create army at capital
            const existingArmy = await client.query(
                'SELECT army_id FROM armies WHERE player_id = $1 AND h3_index = $2 LIMIT 1',
                [playerId, capitalHex]
            );
            let armyId;
            if (existingArmy.rows.length > 0) {
                armyId = existingArmy.rows[0].army_id;
            } else {
                const newArmy = await client.query(
                    `INSERT INTO armies (name, player_id, h3_index)
                     VALUES ('Milicia Campesina', $1, $2)
                     RETURNING army_id`,
                    [playerId, capitalHex]
                );
                armyId = newArmy.rows[0].army_id;
            }

            // Add troops (UPSERT by army + unit_type)
            await client.query(
                `INSERT INTO troops (army_id, unit_type_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (army_id, unit_type_id)
                 DO UPDATE SET quantity = troops.quantity + EXCLUDED.quantity`,
                [armyId, unitType.unit_type_id, FARMER.RECRUIT_QUANTITY]
            );

            if (recruitCost > 0) {
                await client.query(
                    'UPDATE players SET gold = gold - $1 WHERE player_id = $2',
                    [recruitCost, playerId]
                );
            }

            await client.query('COMMIT');

            Logger.engine(
                `[TURN ${turn}] AI Agricultor (${playerId}) reclutó ${FARMER.RECRUIT_QUANTITY} tropas en ${capitalHex} (amenaza detectada)`
            );
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            Logger.error(error, { context: 'AIManagerService._farmerThreatResponse', playerId, turn });
        } finally {
            client.release();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE: Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Find a colonizable unclaimed hex with food output > 0.
     * Returns a random result from up to 20 candidates.
     */
    async _findSuitableSpawnHex(client) {
        const result = await client.query(
            `SELECT m.h3_index
             FROM h3_map m
             JOIN terrain_types tt ON m.terrain_type_id = tt.terrain_type_id
             WHERE m.player_id IS NULL
               AND COALESCE(tt.is_colonizable, TRUE) = TRUE
               AND tt.food_output > 0
             ORDER BY RANDOM()
             LIMIT 20`
        );
        return result.rows[0]?.h3_index || null;
    }
}

module.exports = new AIManagerService();
