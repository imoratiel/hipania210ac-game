const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Timeout is set directly in the test file using jest.setTimeout
let container;
let pool;

async function setupTestDb() {
  // Use postgres 15 array like the actual DB
  container = await new PostgreSqlContainer("postgres:15-alpine")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .start();
  
  pool = new Pool({
    connectionString: container.getConnectionUri(),
  });

  const sqlDir = path.join(__dirname, '../../../sql');
  
  // 1. Load the core schema dump (contains migrations 001 to 040)
  const schemaFile = path.join(sqlDir, 'esquema_final_001_040.sql');
  const schemaSql = fs.readFileSync(schemaFile, 'utf8');
  await pool.query(schemaSql);
  
  // 2. Load the rest of the migrations (041 and up)
  const files = fs.readdirSync(sqlDir)
    .filter(f => f.match(/^0(4[1-9]|5[0-9]|6[0-9])/)) // Matches 041-069
    .sort();
    
  for (const file of files) {
    const migrationSql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
    try {
      await pool.query(migrationSql);
    } catch (e) {
      console.error(`Error in migration script ${file}:`, e);
      throw e;
    }
  }

  return { container, pool };
}

async function teardownTestDb() {
  if (pool) await pool.end();
  if (container) await container.stop();
}

// Retorna el pool inicializado para pasarlo a los mocks de jest
const getPool = () => pool;

module.exports = { setupTestDb, teardownTestDb, getPool };
