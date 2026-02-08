/**
 * Script to fix game_config table structure
 * Adds UNIQUE constraint required for ON CONFLICT clause
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fixGameConfigTable() {
    try {
        console.log('🔧 Fixing game_config table...\n');

        const sql = fs.readFileSync(path.join(__dirname, 'fix_game_config_table.sql'), 'utf8');

        await pool.query(sql);

        console.log('✓ game_config table fixed successfully!');
        console.log('✓ UNIQUE constraint on (group, key) added');
        console.log('✓ Default values inserted\n');

        // Verify the fix
        console.log('Testing ON CONFLICT clause...');
        await pool.query(
            'INSERT INTO game_config ("group", "key", "value") VALUES ($1, $2, $3) ON CONFLICT ("group", "key") DO UPDATE SET value = EXCLUDED.value',
            ['test', 'test_key', 'test_value']
        );
        console.log('✓ ON CONFLICT clause works correctly!\n');

        // Show current config
        const result = await pool.query('SELECT * FROM game_config ORDER BY "group", "key"');
        console.log('Current game_config:');
        console.table(result.rows);

    } catch (error) {
        console.error('❌ Error fixing game_config table:');
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixGameConfigTable();
