const { Pool, types } = require('pg');

const POSTGRES_DATE_OID = 1082;
types.setTypeParser(POSTGRES_DATE_OID, (value) => value);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is required. Copy .env.example to .env and add your PostgreSQL connection string.',
  );
}

const useSsl = process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
