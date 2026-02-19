const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
