// Roles: súper usuario (SUPER_UIDS), ADMIN_UIDS y la tabla administrador. Se definen antes de cargar la app.
process.env.SUPER_UIDS = 'uid-rol-super';
process.env.ADMIN_UIDS = 'uid-rol-env';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');
const { rolDe } = require('../src/services/rolService');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, privateKey;

const limpiar = () => pool.query("DELETE FROM administrador WHERE id_auth LIKE 'uid-rol-%'");
const sembrar = (uid, { activo = true, debe = false } = {}) =>
  pool.query(
    `INSERT INTO administrador (id_auth, correo, nombre_completo, telefono, rut, activo, debe_cambiar_clave, creado_por)
     VALUES ($1, $2, 'Prueba Rol', '+56912345678', '11111111-1', $3, $4, 'uid-rol-super')`,
    [uid, `${uid}@mail.cl`, activo, debe]
  );

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  jwksServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'application/json'); r.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise((r) => jwksServer.listen(4999, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
  await limpiar();
  await sembrar('uid-rol-activo');
  await sembrar('uid-rol-inactivo', { activo: false });
  await sembrar('uid-rol-debe', { debe: true });
  await sembrar('uid-rol-super', { activo: false, debe: true }); // el súper usuario nunca queda bloqueado
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

const ordenes = async (sub) => fetch(`${base}/api/ordenes`, { headers: { Authorization: `Bearer ${await token(sub)}` } });

test('rolDe: fila activa es admin; inactiva no lo es y queda marcada como desactivada', async () => {
  const activo = await rolDe('uid-rol-activo');
  assert.equal(activo.esAdmin, true);
  assert.equal(activo.esSuper, false);
  assert.equal(activo.admin.correo, 'uid-rol-activo@mail.cl');
  const inactivo = await rolDe('uid-rol-inactivo');
  assert.equal(inactivo.esAdmin, false);
  assert.equal(inactivo.desactivado, true);
  const nadie = await rolDe('uid-rol-nadie');
  assert.deepEqual({ ...nadie, admin: null }, { esAdmin: false, esSuper: false, debeCambiarClave: false, desactivado: false, admin: null });
});

test('requireAdmin: admin de la tabla entra; desconocido e inactivo → 403 solo_administradores', async () => {
  assert.equal((await ordenes('uid-rol-activo')).status, 200);
  for (const sub of ['uid-rol-nadie', 'uid-rol-inactivo']) {
    const r = await ordenes(sub);
    assert.equal(r.status, 403);
    assert.equal((await r.json()).error, 'solo_administradores');
  }
});

test('requireAdmin: con contraseña temporal sin cambiar → 403 debe_cambiar_clave', async () => {
  const r = await ordenes('uid-rol-debe');
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'debe_cambiar_clave');
});

test('súper usuario y ADMIN_UIDS entran aunque su fila esté inactiva o con el flag', async () => {
  const sup = await rolDe('uid-rol-super');
  assert.equal(sup.esSuper, true);
  assert.equal(sup.esAdmin, true);
  assert.equal(sup.debeCambiarClave, false);
  assert.equal(sup.desactivado, false);
  assert.equal((await ordenes('uid-rol-super')).status, 200);
  assert.equal((await ordenes('uid-rol-env')).status, 200);
});
