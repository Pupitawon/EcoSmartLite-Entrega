// UID de administrador para estas pruebas (antes de cargar la app, que lee la config al iniciar).
process.env.ADMIN_UIDS = 'uid-test-admin';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');
const { rutValido } = require('../src/controllers/usuarioController');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, privateKey;

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  jwksServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'application/json'); r.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise((r) => jwksServer.listen(4999, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-%'");
  await pool.query("DELETE FROM administrador WHERE id_auth LIKE 'uid-test-%'");
});
after(async () => {
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-%'");
  await pool.query("DELETE FROM administrador WHERE id_auth LIKE 'uid-test-%'");
  server.close(); jwksServer.close(); await pool.end();
});

const token = ({ sub, email = `${sub}@mail.cl`, exp = '10m', aud = PROJECT } = {}) =>
  new SignJWT({ email, email_verified: false })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub).setAudience(aud).setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setIssuedAt().setExpirationTime(exp).sign(privateKey);

const registrar = (t, body) =>
  fetch(`${base}/api/usuarios/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify(body),
  });

test('validación de RUT (dígito verificador)', () => {
  assert.equal(rutValido('11111111-1'), true);
  assert.equal(rutValido('12345678-5'), true);
  assert.equal(rutValido('12345678-9'), false);
  assert.equal(rutValido('abc'), false);
});

test('sin token → 401; token vencido → 401; audiencia ajena → 401', async () => {
  assert.equal((await registrar(null, { rut: '11111111-1', nombre_completo: 'Ana' })).status, 401);
  assert.equal((await registrar(await token({ sub: 'uid-test-a', exp: '-1m' }), { rut: '11111111-1', nombre_completo: 'Ana' })).status, 401);
  assert.equal((await registrar(await token({ sub: 'uid-test-a', aud: 'otro-proyecto' }), { rut: '11111111-1', nombre_completo: 'Ana' })).status, 401);
});

test('registro válido → 201, correo y UID salen del token, saldo 0', async () => {
  const r = await registrar(await token({ sub: 'uid-test-1' }), { rut: '11.111.111-1', nombre_completo: ' Ana Pérez ' });
  assert.equal(r.status, 201);
  const { usuario, creado } = await r.json();
  assert.equal(creado, true);
  assert.equal(usuario.rut, '11111111-1');
  assert.equal(usuario.nombre_completo, 'Ana Pérez');
  assert.equal(usuario.correo, 'uid-test-1@mail.cl');
  assert.equal(usuario.saldo_ecopoints, 0);
  const { rows } = await pool.query("SELECT id_auth FROM usuario WHERE rut='11111111-1'");
  assert.equal(rows[0].id_auth, 'uid-test-1');
});

test('registro repetido de la misma cuenta es idempotente (200, sin duplicar)', async () => {
  const r = await registrar(await token({ sub: 'uid-test-1' }), { rut: '11111111-1', nombre_completo: 'Ana Pérez' });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).creado, false);
  const { rows } = await pool.query("SELECT count(*)::int n FROM usuario WHERE id_auth='uid-test-1'");
  assert.equal(rows[0].n, 1);
});

test('otra cuenta con el mismo RUT → 409', async () => {
  const r = await registrar(await token({ sub: 'uid-test-2' }), { rut: '11111111-1', nombre_completo: 'Otra' });
  assert.equal(r.status, 409);
});

test('dos solicitudes simultáneas de la misma cuenta crean un solo usuario', async () => {
  const t = await token({ sub: 'uid-test-3' });
  const rs = await Promise.all([1, 2, 3].map(() => registrar(t, { rut: '12345678-5', nombre_completo: 'Luis' })));
  assert.ok(rs.every((r) => [200, 201].includes(r.status)), rs.map((r) => r.status).join());
  const { rows } = await pool.query("SELECT count(*)::int n FROM usuario WHERE id_auth='uid-test-3'");
  assert.equal(rows[0].n, 1);
});

test('datos inválidos → 422 (RUT malo, campos extra como saldo o id_auth)', async () => {
  const t = await token({ sub: 'uid-test-4' });
  assert.equal((await registrar(t, { rut: '12345678-9', nombre_completo: 'X Y' })).status, 422);
  assert.equal((await registrar(t, { rut: '12345678-5', nombre_completo: 'Xy', saldo_ecopoints: 9999 })).status, 422);
  assert.equal((await registrar(t, { rut: '12345678-5', nombre_completo: 'Xy', id_auth: 'otro' })).status, 422);
});

test('GET /me devuelve el perfil propio; sin registro → 404', async () => {
  const ok = await fetch(`${base}/api/usuarios/me`, { headers: { Authorization: `Bearer ${await token({ sub: 'uid-test-1' })}` } });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).usuario.rut, '11111111-1');
  const no = await fetch(`${base}/api/usuarios/me`, { headers: { Authorization: `Bearer ${await token({ sub: 'uid-test-nuevo' })}` } });
  assert.equal(no.status, 404);
});

test('GET /me marca es_admin; un administrador sin perfil de ciudadano igual puede entrar', async () => {
  const ciudadano = await (await fetch(`${base}/api/usuarios/me`, { headers: { Authorization: `Bearer ${await token({ sub: 'uid-test-1' })}` } })).json();
  assert.equal(ciudadano.usuario.es_admin, false);
  const admin = await fetch(`${base}/api/usuarios/me`, { headers: { Authorization: `Bearer ${await token({ sub: 'uid-test-admin' })}` } });
  assert.equal(admin.status, 200);
  assert.equal((await admin.json()).usuario.es_admin, true);
});

test('PATCH /me cambia recibe_notificaciones; solo ese campo; sin perfil → 404', async () => {
  const patch = async (sub, body) =>
    fetch(`${base}/api/usuarios/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(sub ? { Authorization: `Bearer ${await token({ sub })}` } : {}) },
      body: JSON.stringify(body),
    });

  const off = await patch('uid-test-1', { recibe_notificaciones: false });
  assert.equal(off.status, 200);
  assert.equal((await off.json()).usuario.recibe_notificaciones, false);
  const on = await patch('uid-test-1', { recibe_notificaciones: true });
  assert.equal((await on.json()).usuario.recibe_notificaciones, true);

  assert.equal((await patch(null, { recibe_notificaciones: false })).status, 401);
  assert.equal((await patch('uid-test-1', { recibe_notificaciones: 'no' })).status, 422);
  assert.equal((await patch('uid-test-1', { recibe_notificaciones: false, saldo_ecopoints: 999 })).status, 422);
  assert.equal((await patch('uid-test-nuevo', { recibe_notificaciones: false })).status, 404);
});

const sembrarAdmin = (uid, { activo = true, debe = false, nombre = 'Ana Admin' } = {}) =>
  pool.query(
    `INSERT INTO administrador (id_auth, correo, nombre_completo, telefono, rut, activo, debe_cambiar_clave, creado_por)
     VALUES ($1, $2, $3, '+56912345678', '11111111-1', $4, $5, 'uid-super')`,
    [uid, `${uid}@mail.cl`, nombre, activo, debe]
  );
const me = async (sub) => fetch(`${base}/api/usuarios/me`, { headers: { Authorization: `Bearer ${await token({ sub })}` } });
const claveCambiada = async (sub) =>
  fetch(`${base}/api/usuarios/me/clave-cambiada`, { method: 'POST', headers: { Authorization: `Bearer ${await token({ sub })}` } });

test('GET /me de un admin de la tabla sin perfil de ciudadano trae sus datos y su rol', async () => {
  await sembrarAdmin('uid-test-tabla');
  const r = await me('uid-test-tabla');
  assert.equal(r.status, 200);
  const { usuario } = await r.json();
  assert.equal(usuario.nombre_completo, 'Ana Admin');
  assert.equal(usuario.telefono, '+56912345678');
  assert.equal(usuario.rut, '11111111-1');
  assert.equal(usuario.es_admin, true);
  assert.equal(usuario.es_super, false);
  assert.equal(usuario.debe_cambiar_clave, false);
});

test('contraseña temporal: /me la marca y clave-cambiada la libera para usar el panel', async () => {
  await sembrarAdmin('uid-test-temp', { debe: true });
  assert.equal((await (await me('uid-test-temp')).json()).usuario.debe_cambiar_clave, true);
  const ordenes = async () => fetch(`${base}/api/ordenes`, { headers: { Authorization: `Bearer ${await token({ sub: 'uid-test-temp' })}` } });
  assert.equal((await ordenes()).status, 403);
  const ok = await claveCambiada('uid-test-temp');
  assert.equal(ok.status, 200);
  assert.equal((await (await me('uid-test-temp')).json()).usuario.debe_cambiar_clave, false);
  assert.equal((await ordenes()).status, 200);
  assert.equal((await claveCambiada('uid-test-nuevo')).status, 404);
});

test('admin desactivado sin perfil → 403 admin_desactivado; con perfil de ciudadano entra como ciudadano', async () => {
  await sembrarAdmin('uid-test-off', { activo: false });
  const r = await me('uid-test-off');
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'admin_desactivado');
  await sembrarAdmin('uid-test-1', { activo: false });
  const c = await me('uid-test-1');
  assert.equal(c.status, 200);
  assert.equal((await c.json()).usuario.es_admin, false);
});
