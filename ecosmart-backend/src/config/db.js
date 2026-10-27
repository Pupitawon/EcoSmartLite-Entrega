const { Pool, types } = require('pg');
require('dotenv').config();

types.setTypeParser(1114, (v) => (v === null ? null : new Date(v.replace(' ', 'T') + 'Z')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Error imprevisto en cliente inactivo del pool:', err);
});

module.exports = pool;