const { pool } = require('./src/config/database');

console.log('Student Placement Tracker backend is configured.');

async function shutdown(signal) {
  console.log(`${signal} received; closing the database pool.`);
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
