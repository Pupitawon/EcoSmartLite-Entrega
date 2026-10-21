// Corre en su propio proceso: el límite se fija ANTES de cargar la app.
process.env.RATE_LIMIT_POR_MINUTO = '5';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
const pool = require('../src/config/db');

let server, base;
before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});
after(async () => { server.close(); await pool.end(); });

test('supera el límite por minuto → 429', async () => {
  const estados = [];
  for (let i = 0; i < 8; i++) {
    const r = await fetch(`${base}/api/lecturas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer clave-incorrecta-123456' },
      body: JSON.stringify({ id_contenedor: 101, porcentaje_llenado: 10 }),
    });
    estados.push(r.status);
  }
  assert.deepEqual(estados, [401, 401, 401, 401, 401, 429, 429, 429]);
});
