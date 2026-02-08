const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mediev_h3',
    password: 'postgres',
    port: 5432
});

async function checkTables() {
    try {
        console.log('=== Checking game_config table ===');
        const gameConfigInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'game_config'
            ORDER BY ordinal_position
        `);
        console.log('game_config columns:', gameConfigInfo.rows);

        const gameConfigConstraints = await pool.query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'game_config'
        `);
        console.log('game_config constraints:', gameConfigConstraints.rows);

        console.log('\n=== Checking world_state table ===');
        const worldStateInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'world_state'
            ORDER BY ordinal_position
        `);
        console.log('world_state columns:', worldStateInfo.rows);

        console.log('\n=== Testing insert query ===');
        try {
            await pool.query('INSERT INTO game_config ("group", "key", "value") VALUES ($1, $2, $3) ON CONFLICT ("group", "key") DO UPDATE SET value = EXCLUDED.value', ['gameplay', 'turn_duration_seconds', '30']);
            console.log('✓ Insert query works!');
        } catch (err) {
            console.error('✗ Insert query failed:', err.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkTables();
