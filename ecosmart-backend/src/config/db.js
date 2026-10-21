const { Pool, types } = require('pg');
require('dotenv').config();

// Los TIMESTAMP (sin zona) se guardan y se leen SIEMPRE en UTC. Sin esto, node-postgres los
// interpretaría en la zona horaria del equipo donde corre el servidor y "hace X horas" saldría corrido.
types.setTypeParser(1114, (v) => (v === null ? null : new Date(v.replace(' ', 'T') + 'Z')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase exige SSL (por defecto activo, igual que antes). Para una BD local sin SSL: DATABASE_SSL=false
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log(' Conectado exitosamente a la Base de Datos Supabase (PostgreSQL + PostGIS)');
});

pool.on('error', (err) => {
  console.error(' Error en la conexión a la Base de Datos:', err);
});

module.exports = pool;
