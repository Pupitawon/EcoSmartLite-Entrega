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
});
after(async () => {
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-%'");
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
