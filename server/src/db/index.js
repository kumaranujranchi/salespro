import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from multiple potential working directories
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isLocalDb = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isLocalDb
          ? false
          : (process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require')
              ? { rejectUnauthorized: false }
              : false),
        max: 20, // Max concurrent connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'salesprouser',
        password: process.env.PGPASSWORD || 'SalesProPass@2026',
        database: process.env.PGDATABASE || 'salespro',
        max: 20,
        idleTimeoutMillis: 30000,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export const query = (text, params) => pool.query(text, params);
