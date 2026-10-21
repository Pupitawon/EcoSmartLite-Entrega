const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
const pool = require('../src/config/db');

const KEY = process.env.INGEST_API_KEY;
let server, base;

before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});
after(async () => { server.close(); await pool.end(); });

const post = (body, key = KEY) =>
  fetch(`${base}/api/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
  });

const put = (id, body, key = KEY) =>
  fetch(`${base}/api/contenedores/${id}/nivel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
  });

const pendientes = async (id) =>
  (await pool.query("SELECT count(*)::int n FROM alerta_llenado WHERE id_contenedor=$1 AND estado_alerta='pendiente'", [id])).rows[0].n;

const limpiar = async (id) => {
  await pool.query('DELETE FROM alerta_llenado WHERE id_contenedor=$1', [id]);
  await pool.query("UPDATE contenedor SET porcentaje_llenado=10, estado_operativo='disponible', fecha_ultima_lectura=NULL WHERE id_contenedor=$1", [id]);
};

// ---------------- Autenticación y validación ----------------
test('rechaza sin credencial (401) y con key incorrecta (401)', async () => {
  assert.equal((await post({ id_contenedor: 101, porcentaje_llenado: 50 }, null)).status, 401);
  assert.equal((await post({ id_contenedor: 101, porcentaje_llenado: 50 }, 'otra-clave-incorrecta-123')).status, 401);
});

test('validación: rango, tipos, campos extra, fecha futura y cuerpo vacío (422)', async () => {
  for (const body of [
    { id_contenedor: 101, porcentaje_llenado: 101 },
    { id_contenedor: 101, porcentaje_llenado: -1 },
    { id_contenedor: 101, porcentaje_llenado: '50' },
    { id_contenedor: 'x', porcentaje_llenado: 50 },
    { porcentaje_llenado: 50 },
    { id_contenedor: 101, porcentaje_llenado: 50, extra: 1 },
    { id_contenedor: 101, porcentaje_llenado: 50, fecha_lectura: new Date(Date.now() + 3_600_000).toISOString() },
  ]) {
    assert.equal((await post(body)).status, 422, JSON.stringify(body));
  }
  const vacio = await fetch(`${base}/api/lecturas`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}` } });
  assert.equal(vacio.status, 422);
});

test('JSON malformado → 400; contenedor inexistente → 404', async () => {
  const r = await fetch(`${base}/api/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: '{"id_contenedor": 101,',
  });
  assert.equal(r.status, 400);
  assert.equal((await post({ id_contenedor: 99999, porcentaje_llenado: 50 })).status, 404);
});

// ---------------- Última lectura, estado operativo, sin reporte ----------------
test('guarda la última lectura, la devuelve como número y no alerta bajo el umbral', async () => {
  await limpiar(101);
  const r = await post({ id_contenedor: 101, porcentaje_llenado: 79.9 });
  assert.equal(r.status, 201);
  const j = await r.json();
  assert.equal(j.alerta_creada, false);
  assert.equal(j.contenedor.porcentaje_llenado, 79.9);
  assert.equal(typeof j.contenedor.latitud, 'number');
  assert.equal(j.contenedor.sin_reporte, false);
  assert.equal(j.contenedor.estado_operativo, 'atencion');
});

test('estado_operativo conserva la regla anterior: disponible / atencion / critico', async () => {
  await limpiar(101);
  for (const [p, esperado] of [[10, 'disponible'], [50, 'atencion'], [79, 'atencion'], [80, 'critico'], [100, 'critico']]) {
    const j = await (await post({ id_contenedor: 101, porcentaje_llenado: p })).json();
    assert.equal(j.contenedor.estado_operativo, esperado, `${p}%`);
  }
});

test('sin_reporte: sin lectura reciente se marca; con lectura nueva deja de marcarse', async () => {
  await pool.query("UPDATE contenedor SET fecha_ultima_lectura=(NOW() AT TIME ZONE 'UTC') - INTERVAL '30 hours' WHERE id_contenedor=101");
  let lista = await (await fetch(`${base}/api/contenedores`)).json();
  assert.equal(lista.find((c) => c.id_contenedor === 101).sin_reporte, true);
  await post({ id_contenedor: 101, porcentaje_llenado: 30 });
  lista = await (await fetch(`${base}/api/contenedores`)).json();
  assert.equal(lista.find((c) => c.id_contenedor === 101).sin_reporte, false);
});

test('un contenedor que nunca reportó (fecha NULL) aparece como sin_reporte', async () => {
  await limpiar(105);
  const c = (await (await fetch(`${base}/api/contenedores`)).json()).find((x) => x.id_contenedor === 105);
  assert.equal(c.fecha_ultima_lectura, null);
  assert.equal(c.sin_reporte, true);
});

test('la hora de la lectura se guarda y se lee en UTC (sin corrimiento)', async () => {
  const antes = Date.now();
  const j = await (await post({ id_contenedor: 101, porcentaje_llenado: 20 })).json();
  const t = new Date(j.contenedor.fecha_ultima_lectura).getTime();
  assert.ok(Math.abs(t - antes) < 10_000, `diferencia ${t - antes} ms`);
  const fechaCliente = '2026-03-01T12:00:00Z';
  await limpiar(101);
  const k = await (await post({ id_contenedor: 101, porcentaje_llenado: 20, fecha_lectura: fechaCliente })).json();
  assert.equal(k.contenedor.fecha_ultima_lectura, '2026-03-01T12:00:00.000Z');
});

// ---------------- Regla de alerta ----------------
test('alerta exactamente en 80 %, sin duplicados mientras siga sobre el umbral', async () => {
  await limpiar(102);
  const a = await (await post({ id_contenedor: 102, porcentaje_llenado: 80 })).json();
  assert.equal(a.alerta_creada, true);
  for (const p of [85, 90, 100, 80]) {
    const j = await (await post({ id_contenedor: 102, porcentaje_llenado: p })).json();
    assert.equal(j.alerta_creada, false, `no debe duplicar en ${p}%`);
  }
  assert.equal(await pendientes(102), 1);
  const fila = (await pool.query("SELECT porcentaje_disparo FROM alerta_llenado WHERE id_contenedor=102")).rows[0];
  assert.equal(Number(fila.porcentaje_disparo), 80);
});

test('lecturas simultáneas sobre el umbral crean una sola alerta', async () => {
  await limpiar(103);
  const rs = await Promise.all(Array.from({ length: 12 }, (_, i) => post({ id_contenedor: 103, porcentaje_llenado: 85 + (i % 5) })));
  assert.ok(rs.every((r) => r.status === 201 || r.status === 200));
  assert.equal(await pendientes(103), 1);
});

test('al bajar de 80 % se resuelve y un nuevo cruce genera otra alerta', async () => {
  await limpiar(104);
  await post({ id_contenedor: 104, porcentaje_llenado: 90 });
  const baja = await (await post({ id_contenedor: 104, porcentaje_llenado: 20 })).json();
  assert.equal(baja.alerta_resuelta, true);
  assert.equal(await pendientes(104), 0);
  const sube = await (await post({ id_contenedor: 104, porcentaje_llenado: 82 })).json();
  assert.equal(sube.alerta_creada, true);
  const total = (await pool.query('SELECT count(*)::int n FROM alerta_llenado WHERE id_contenedor=104')).rows[0].n;
  assert.equal(total, 2);
  const res = (await pool.query("SELECT fecha_resolucion FROM alerta_llenado WHERE id_contenedor=104 AND estado_alerta='resuelta'")).rows[0];
  assert.ok(res.fecha_resolucion instanceof Date);
});

test('una lectura más antigua que la guardada se ignora', async () => {
  await limpiar(105);
  await post({ id_contenedor: 105, porcentaje_llenado: 40 });
  const vieja = new Date(Date.now() - 3_600_000).toISOString();
  const r = await post({ id_contenedor: 105, porcentaje_llenado: 95, fecha_lectura: vieja });
  assert.equal((await r.json()).recibida, false);
  const c = (await (await fetch(`${base}/api/contenedores`)).json()).find((x) => x.id_contenedor === 105);
  assert.equal(c.porcentaje_llenado, 40);
  assert.equal(await pendientes(105), 0);
});

// ---------------- Consultas del panel ----------------
test('GET /api/alertas/pendientes (ruta existente) y /api/alertas?estado= devuelven las alertas', async () => {
  await limpiar(102);
  await post({ id_contenedor: 102, porcentaje_llenado: 91 });
  const pend = await (await fetch(`${base}/api/alertas/pendientes`)).json();
  const a = pend.find((x) => x.id_contenedor === 102);
  assert.equal(a.estado_alerta, 'pendiente');
  assert.equal(a.porcentaje_llenado, 91);
  const todas = await (await fetch(`${base}/api/alertas`)).json();
  assert.ok(todas.length >= pend.length);
  const resueltas = await (await fetch(`${base}/api/alertas?estado=resuelta`)).json();
  assert.ok(resueltas.every((x) => x.estado_alerta === 'resuelta'));
});

test('GET /api/config expone umbral y horas de sin reporte', async () => {
  assert.deepEqual(await (await fetch(`${base}/api/config`)).json(), { umbral_alerta: 80, sin_reporte_horas: 6 });
});

// ---------------- Ruta antigua PUT /api/contenedores/:id/nivel ----------------
test('PUT antiguo: exige credencial, valida y usa la misma regla sin duplicados', async () => {
  await limpiar(101);
  assert.equal((await put(101, { porcentaje_llenado: 90 }, null)).status, 401);
  assert.equal((await put('abc', { porcentaje_llenado: 90 })).status, 422);
  assert.equal((await put(101, { porcentaje_llenado: 500 })).status, 422);
  assert.equal((await put(99999, { porcentaje_llenado: 50 })).status, 404);
  const r = await put(101, { porcentaje_llenado: 90 });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.mensaje, 'Lectura actualizada');
  assert.equal(j.alerta_creada, true);
  for (let i = 0; i < 4; i++) await put(101, { porcentaje_llenado: 91 + i });
  assert.equal(await pendientes(101), 1, 'el código anterior creaba una alerta por cada lectura');
});

// ---------------- Tiempo real ----------------
test('SSE: el panel recibe el evento al llegar una lectura', async () => {
  const ctrl = new AbortController();
  const res = await fetch(`${base}/api/stream`, { signal: ctrl.signal });
  assert.match(res.headers.get('content-type'), /text\/event-stream/);
  const reader = res.body.getReader();
  await reader.read(); // "retry: 3000"
  await post({ id_contenedor: 101, porcentaje_llenado: 33 });
  const { value } = await reader.read();
  const txt = new TextDecoder().decode(value);
  ctrl.abort();
  assert.match(txt, /event: lectura/);
  assert.match(txt, /"id_contenedor":101/);
});

test('SSE: una lectura rechazada NO emite evento', async () => {
  const ctrl = new AbortController();
  const res = await fetch(`${base}/api/stream`, { signal: ctrl.signal });
  const reader = res.body.getReader();
  await reader.read();
  await post({ id_contenedor: 101, porcentaje_llenado: 150 }); // 422
  await post({ id_contenedor: 101, porcentaje_llenado: 44 }, null); // 401
  await post({ id_contenedor: 101, porcentaje_llenado: 45 }); // válida
  const { value } = await reader.read();
  ctrl.abort();
  const txt = new TextDecoder().decode(value);
  assert.match(txt, /"porcentaje_llenado":45/);
  assert.doesNotMatch(txt, /"porcentaje_llenado":150|"porcentaje_llenado":44/);
});
