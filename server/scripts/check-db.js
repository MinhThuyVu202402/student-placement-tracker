const { pool } = require('../src/config/database');

async function checkDatabaseConnection() {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database, NOW() AS connected_at',
    );
    const connection = result.rows[0];

    console.log(
      `Connected to PostgreSQL database "${connection.database}" at ${connection.connected_at.toISOString()}.`,
    );
  } catch (error) {
    console.error('Could not connect to PostgreSQL:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabaseConnection();
