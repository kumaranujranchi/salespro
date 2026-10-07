import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running PostgreSQL migration...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✔ Schema tables and indexes created successfully.');

    const seedSql = fs.readFileSync(path.join(__dirname, '../../seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✔ Seed data populated successfully.');
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
