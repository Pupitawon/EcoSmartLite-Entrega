const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/db');

const MIGRACION = fs.readFileSync(path.join(__dirname, '..', 'sql', '01_migracion_lecturas.sql'), 'utf8');
after(() => pool.end());

const ids = async () => (await pool.query("SELECT id_alerta, estado_alerta FROM alerta_llenado WHERE id_contenedor=105 ORDER BY id_alerta")).rows;

test('la migración es idempotente (se puede correr varias veces)', async () => {
  await pool.query(MIGRACION);
  await pool.query(MIGRACION);
});

test('limpia los duplicados que dejaba el código anterior y deja una sola alerta pendiente', async () => {
  // Reproduce el estado de la BD real: sin índice único y con una alerta 'pendiente' por cada lectura >= 80 %.
  await pool.query('DELETE FROM alerta_llenado WHERE id_contenedor=105');
  await pool.query('DROP INDEX uq_alerta_pendiente_por_contenedor');
  for (const id of [900, 901, 902]) {
    await pool.query(
      "INSERT INTO alerta_llenado (id_alerta, id_contenedor, fecha_generacion, estado_alerta) VALUES ($1, 105, (NOW() AT TIME ZONE 'UTC'), 'pendiente')",
      [id]
    );
  }
  await pool.query("INSERT INTO alerta_llenado (id_alerta, id_contenedor, fecha_generacion, estado_alerta) VALUES (903, 105, (NOW() AT TIME ZONE 'UTC'), 'resuelta')");

  await pool.query(MIGRACION);

  assert.deepEqual(await ids(), [
    { id_alerta: 900, estado_alerta: 'pendiente' }, // se conserva la más antigua
    { id_alerta: 901, estado_alerta: 'duplicada' },
    { id_alerta: 902, estado_alerta: 'duplicada' },
    { id_alerta: 903, estado_alerta: 'resuelta' }, // lo ya resuelto no se toca
  ]);
  // Nada se borró, y ahora la base impide un segundo 'pendiente'.
  await assert.rejects(
    pool.query("INSERT INTO alerta_llenado (id_contenedor, fecha_generacion, estado_alerta) VALUES (105, (NOW() AT TIME ZONE 'UTC'), 'pendiente')"),
    /uq_alerta_pendiente_por_contenedor/
  );
  await pool.query('DELETE FROM alerta_llenado WHERE id_contenedor=105');
});

test('si id_alerta no era autogenerado, el contador parte después del id más alto existente', async () => {
  await pool.query('DELETE FROM alerta_llenado');
  await pool.query('ALTER TABLE alerta_llenado ALTER COLUMN id_alerta DROP IDENTITY');
  await pool.query("INSERT INTO alerta_llenado (id_alerta, id_contenedor, fecha_generacion, estado_alerta) VALUES (500, 102, (NOW() AT TIME ZONE 'UTC'), 'resuelta')");

  await pool.query(MIGRACION);

  const { rows } = await pool.query(
    "INSERT INTO alerta_llenado (id_contenedor, fecha_generacion, estado_alerta) VALUES (102, (NOW() AT TIME ZONE 'UTC'), 'resuelta') RETURNING id_alerta"
  );
  assert.equal(rows[0].id_alerta, 501);
  await pool.query('DELETE FROM alerta_llenado');
});
