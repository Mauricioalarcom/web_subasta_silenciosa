const { Pool } = require('pg');

// Cargar configuración según el entorno
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: '.env.local' });
}

const config = require('../config');

// Crear pool usando DATABASE_URL si existe, sino usar configuración individual
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
  getClient: () => pool.connect(),
  pool,
};
