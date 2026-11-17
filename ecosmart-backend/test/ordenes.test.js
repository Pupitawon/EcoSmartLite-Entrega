// UID de administrador para estas pruebas (se define antes de cargar la app, que lee la config al iniciar).
process.env.ADMIN_UIDS = 'uid-ot-admin';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, privateKey;

const limpiar = () => pool.query("DELETE FROM orden_trabajo WHERE creada_por LIKE 'uid-ot-%'");

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  jwksServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'application/json'); r.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise((r) => jwksServer.listen(4999, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
  await limpiar();
});
after(async () => {
  await limpiar();
  server.close(); jwksServer.close(); await pool.end();
});

const token = (sub) =>
  new SignJWT({ email: `${sub}@mail.cl`, email_verified: false })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub).setAudience(PROJECT).setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setIssuedAt().setExpirationTime('10m').sign(privateKey);

const pedir = async (ruta, { method = 'GET', body, sub = 'uid-ot-admin' } = {}) =>
  fetch(`${base}/api/ordenes${ruta}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(sub ? { Authorization: `Bearer ${await token(sub)}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const NUEVA = { id_contenedor: 101, tipo: 'Vaciado', prioridad: 'Alta', tecnico: 'R. Fuentes' };

test('sin token → 401; usuario que no es administrador → 403 (también para leer)', async () => {
  assert.equal((await pedir('', { sub: null })).status, 401);
  assert.equal((await pedir('', { sub: 'uid-ot-vecino' })).status, 403);
  assert.equal((await pedir('', { method: 'POST', body: NUEVA, sub: 'uid-ot-vecino' })).status, 403);
});

test('validación: tipo o prioridad desconocidos, técnico vacío, campos extra → 422; contenedor inexistente → 404', async () => {
  for (const body of [
    { ...NUEVA, tipo: 'Pintar' },
    { ...NUEVA, prioridad: 'Urgente' },
    { ...NUEVA, tecnico: '   ' },
    { ...NUEVA, id_contenedor: '101' },
    { ...NUEVA, estado: 'Cerrada' },
  ]) {
    assert.equal((await pedir('', { method: 'POST', body })).status, 422, JSON.stringify(body));
  }
  const r = await pedir('', { method: 'POST', body: { ...NUEVA, id_contenedor: 99999 } });
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, 'contenedor_no_existe');
});

test('crea la orden en Pendiente, la lista y la avanza paso a paso hasta Cerrada', async () => {
  const r = await pedir('', { method: 'POST', body: NUEVA });
  assert.equal(r.status, 201);
  const { orden } = await r.json();
  assert.equal(orden.estado, 'Pendiente');
  assert.equal(orden.contenedor, 101);
  assert.equal(orden.id, `OT-${orden.id_orden}`);
  assert.ok(orden.id_orden >= 1001);

  const lista = await (await pedir('')).json();
  assert.ok(lista.some((o) => o.id_orden === orden.id_orden));

  const pasos = [];
  for (let i = 0; i < 5; i++) {
    const a = await pedir(`/${orden.id_orden}/avanzar`, { method: 'PATCH' });
    assert.equal(a.status, 200);
    pasos.push((await a.json()).orden.estado);
  }
  assert.deepEqual(pasos, ['Asignada', 'En terreno', 'Ejecutada', 'Verificada', 'Cerrada']);
  assert.equal((await pedir(`/${orden.id_orden}/avanzar`, { method: 'PATCH' })).status, 409);
});

test('dos avances simultáneos no se saltan pasos', async () => {
  const { orden } = await (await pedir('', { method: 'POST', body: NUEVA })).json();
  const rs = await Promise.all([1, 2].map(() => pedir(`/${orden.id_orden}/avanzar`, { method: 'PATCH' })));
  const estados = (await Promise.all(rs.map((x) => x.json()))).map((j) => j.orden.estado).sort();
  assert.deepEqual(estados, ['Asignada', 'En terreno']);
});

test('eliminar: 204, luego 404; id inválido → 422', async () => {
  const { orden } = await (await pedir('', { method: 'POST', body: NUEVA })).json();
  assert.equal((await pedir(`/${orden.id_orden}`, { method: 'DELETE', sub: 'uid-ot-vecino' })).status, 403);
  assert.equal((await pedir(`/${orden.id_orden}`, { method: 'DELETE' })).status, 204);
  assert.equal((await pedir(`/${orden.id_orden}`, { method: 'DELETE' })).status, 404);
  assert.equal((await pedir(`/${orden.id_orden}/avanzar`, { method: 'PATCH' })).status, 404);
  assert.equal((await pedir('/abc', { method: 'DELETE' })).status, 422);
});
