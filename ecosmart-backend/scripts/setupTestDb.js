// Prepara la BD LOCAL de pruebas: esquema base + migración + datos de ejemplo.
// ¡BORRA todo el esquema public! Por eso se niega a correr contra cualquier BD que no sea local y de pruebas.
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const url = new URL(process.env.DATABASE_URL);
const esLocal = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname);
const esDePrueba = url.pathname.replace('/', '').includes('test');
if (!esLocal || !esDePrueba) {
  console.error(`✗ Setup cancelado: DATABASE_URL (${url.hostname}${url.pathname}) no es una BD local de pruebas.`);
  console.error('  Debe ser localhost y el nombre de la base debe contener "test" (ej. ecosmart_test).');
  process.exit(1);
}

const archivos = [
  path.join(__dirname, '..', 'test', 'db', '00_schema_base.sql'),
  path.join(__dirname, '..', 'sql', '01_migracion_lecturas.sql'),
  path.join(__dirname, '..', 'sql', '02_migracion_usuarios.sql'),
  path.join(__dirname, '..', 'sql', '03_migracion_reportes.sql'),
  path.join(__dirname, '..', 'test', 'db', '10_seed.sql'),
];

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  for (const f of archivos) await client.query(fs.readFileSync(f, 'utf8'));
  await client.end();
  console.log('✓ BD de pruebas lista (esquema base + migración + seed)');
})().catch((e) => {
  console.error('✗ Falló el setup de la BD de pruebas:', e.message);
  process.exit(1);
});
