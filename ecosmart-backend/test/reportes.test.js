const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, privateKey;

const limpiar = async () => {
  await pool.query("DELETE FROM reporte_anomalia WHERE id_usuario IN (SELECT id_usuario FROM usuario WHERE id_auth LIKE 'uid-rep-%')");
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-rep-%'");
};

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  jwksServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'application/json'); r.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise((r) => jwksServer.listen(4999, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
  await limpiar();
  await pool.query(
    `INSERT INTO usuario (id_auth, rut, nombre_completo, correo, saldo_ecopoints, recibe_notificaciones, fecha_registro)
     VALUES ('uid-rep-1', '22222222-2', 'Vecina Reportera', 'rep1@mail.cl', 0, true, NOW() AT TIME ZONE 'UTC')`
  );
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

const reportar = async (body, sub = 'uid-rep-1') =>
  fetch(`${base}/api/reportes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(sub ? { Authorization: `Bearer ${await token(sub)}` } : {}) },
    body: JSON.stringify(body),
  });

const revisar = (id, body) =>
  fetch(`${base}/api/reportes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('sin token → 401; usuario sin perfil → 404; contenedor inexistente → 404', async () => {
  assert.equal((await reportar({ id_contenedor: 101, tipo_anomalia: 'danado' }, null)).status, 401);
  assert.equal((await reportar({ id_contenedor: 101, tipo_anomalia: 'danado' }, 'uid-rep-sin-perfil')).status, 404);
  const r = await reportar({ id_contenedor: 99999, tipo_anomalia: 'danado' });
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, 'contenedor_no_existe');
});

test('validación: tipo desconocido, id no numérico, campos extra (id_usuario) → 422', async () => {
  for (const body of [
    { id_contenedor: 101, tipo_anomalia: 'incendio' },
    { id_contenedor: '101', tipo_anomalia: 'danado' },
    { id_contenedor: 101, tipo_anomalia: 'danado', id_usuario: 1 },
    { id_contenedor: 101, tipo_anomalia: 'otro', descripcion: 'x'.repeat(501) },
  ]) {
    assert.equal((await reportar(body)).status, 422, JSON.stringify(body));
  }
});

test('crea el reporte pendiente, lo emite en vivo y el panel lo lista sin datos personales', async () => {
  const bus = require('../src/events/bus');
  const emitido = new Promise((resolve) => bus.once('reporte', resolve));

  const r = await reportar({ id_contenedor: 102, tipo_anomalia: 'residuos_incorrectos', descripcion: '  Hay escombros  ' });
  assert.equal(r.status, 201);
  const { reporte } = await r.json();
  assert.equal(reporte.id_contenedor, 102);
  assert.equal(reporte.estado_revision, 'pendiente');
  assert.equal(reporte.descripcion, 'Hay escombros');
  assert.equal(reporte.nombre_material, 'Vidrio');
  assert.equal((await emitido).id_reporte, reporte.id_reporte);

  const lista = await (await fetch(`${base}/api/reportes?estado=pendiente`)).json();
  const fila = lista.find((x) => x.id_reporte === reporte.id_reporte);
  assert.ok(fila);
  assert.equal('id_usuario' in fila || 'rut' in fila || 'correo' in fila, false);
});

test('el panel cambia el estado de revisión; estado inválido → 422; id inexistente → 404', async () => {
  const { reporte } = await (await reportar({ id_contenedor: 103, tipo_anomalia: 'danado' })).json();

  const ok = await revisar(reporte.id_reporte, { estado_revision: 'resuelto' });
  assert.equal(ok.status, 200);
  const j = await ok.json();
  assert.equal(j.reporte.estado_revision, 'resuelto');
  assert.ok(j.reporte.fecha_revision);

  const pendientes = await (await fetch(`${base}/api/reportes?estado=pendiente`)).json();
  assert.equal(pendientes.some((x) => x.id_reporte === reporte.id_reporte), false);

  assert.equal((await revisar(reporte.id_reporte, { estado_revision: 'cerrado' })).status, 422);
  assert.equal((await revisar(999999, { estado_revision: 'resuelto' })).status, 404);
});
