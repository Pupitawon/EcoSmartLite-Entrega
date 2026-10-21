const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log(' Conectado exitosamente a la Base de Datos Supabase (PostgreSQL + PostGIS)');
});

pool.on('error', (err) => {
  console.error(' Error en la conexión a la Base de Datos:', err);
});

module.exports = pool;