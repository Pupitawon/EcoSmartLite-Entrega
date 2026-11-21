// Gestión de administradores por el súper usuario. Firebase Auth se simula con un servidor local (puerto 4998).
process.env.SUPER_UIDS = 'uid-adm-super';
process.env.ADMIN_UIDS = 'uid-adm-env';
process.env.FIREBASE_AUTH_URL = 'http://localhost:4998';
process.env.FIREBASE_WEB_API_KEY = 'clave-web-de-prueba';
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, firebase, privateKey;

// Firebase simulado: guarda las llamadas; `respuesta` decide qué contesta signUp.
let llamadas = [];
let respuesta = 'ok';
let siguienteUid = 1;

const limpiar = () => pool.query("DELETE FROM administrador WHERE correo LIKE '%@adm.test'");

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  jwksServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'application/json'); r.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise((r) => jwksServer.listen(4999, r));
  firebase = http.createServer((q, r) => {
    let cuerpo = '';
    q.on('data', (c) => { cuerpo += c; });
    q.on('end', () => {
      const metodo = q.url.split('accounts:')[1].split('?')[0];
      llamadas.push({ metodo, cuerpo: JSON.parse(cuerpo) });
      r.setHeader('Content-Type', 'application/json');
      if (metodo === 'signUp' && respuesta === 'EMAIL_EXISTS') { r.statusCode = 400; return r.end(JSON.stringify({ error: { message: 'EMAIL_EXISTS' } })); }
      if (respuesta === 'caido') { r.statusCode = 500; return r.end(JSON.stringify({ error: { message: 'INTERNAL' } })); }
      if (metodo === 'signUp') return r.end(JSON.stringify({ localId: `uid-adm-nuevo-${siguienteUid++}` }));
      return r.end(JSON.stringify({ email: 'ok' }));
    });
  });
  await new Promise((r) => firebase.listen(4998, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
  await limpiar();
});
after(async () => {
  await limpiar();
  server.close(); jwksServer.close(); firebase.close(); await pool.end();
});
beforeEach(() => { llamadas = []; respuesta = 'ok'; });

const token = (sub) =>
  new SignJWT({ email: `${sub}@mail.cl`, email_verified: false })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub).setAudience(PROJECT).setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setIssuedAt().setExpirationTime('10m').sign(privateKey);

const pedir = async (ruta, { method = 'GET', body, sub = 'uid-adm-super' } = {}) =>
  fetch(`${base}/api/administradores${ruta}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(sub ? { Authorization: `Bearer ${await token(sub)}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const datos = (correo, modo = 'enlace') => ({ nombre_completo: 'Ana Pérez', correo, telefono: '9 1234 5678', modo });

test('sin token → 401; admin normal o ciudadano → 403 solo_super_usuario', async () => {
  assert.equal((await pedir('', { sub: null })).status, 401);
  for (const sub of ['uid-adm-env', 'uid-adm-ciudadano']) {
    const rutas = [
      pedir('', { sub }),
      pedir('', { method: 'POST', body: datos('x@adm.test'), sub }),
      pedir('/1', { method: 'PATCH', body: { activo: false }, sub }),
      pedir('/1/reenviar', { method: 'POST', sub }),
    ];
    for (const r of await Promise.all(rutas)) {
      assert.equal(r.status, 403);
      assert.equal((await r.json()).error, 'solo_super_usuario');
    }
  }
  assert.equal(llamadas.length, 0);
});

test('crear con enlace: crea la cuenta, envía el correo y no devuelve contraseña', async () => {
  const r = await pedir('', { method: 'POST', body: datos('Enlace@adm.test') });
  assert.equal(r.status, 201);
  const cuerpo = await r.json();
  assert.equal(cuerpo.clave_temporal, undefined);
  assert.equal(cuerpo.administrador.correo, 'enlace@adm.test');
  assert.equal(cuerpo.administrador.telefono, '+56912345678');
  assert.equal(cuerpo.administrador.debe_cambiar_clave, false);
  assert.deepEqual(llamadas.map((l) => l.metodo), ['signUp', 'sendOobCode']);
  assert.equal(llamadas[1].cuerpo.requestType, 'PASSWORD_RESET');
  assert.equal(llamadas[1].cuerpo.email, 'enlace@adm.test');
});

test('crear con contraseña temporal: la devuelve una vez y nunca aparece en la lista ni en la base', async () => {
  const r = await pedir('', { method: 'POST', body: datos('temporal@adm.test', 'temporal') });
  assert.equal(r.status, 201);
  const { administrador, clave_temporal } = await r.json();
  assert.equal(clave_temporal.length, 16);
  assert.equal(llamadas[0].cuerpo.password, clave_temporal);
  assert.equal(administrador.debe_cambiar_clave, true);
  assert.deepEqual(llamadas.map((l) => l.metodo), ['signUp']);
  const lista = await (await pedir('')).text();
  assert.equal(lista.includes(clave_temporal), false);
  const fila = await pool.query("SELECT row_to_json(a)::text AS t FROM administrador a WHERE correo = 'temporal@adm.test'");
  assert.equal(fila.rows[0].t.includes(clave_temporal), false);
});

test('correo con cuenta en Firebase → 409 correo_con_cuenta y no se crea nada', async () => {
  respuesta = 'EMAIL_EXISTS';
  const r = await pedir('', { method: 'POST', body: datos('existe@adm.test') });
  assert.equal(r.status, 409);
  const cuerpo = await r.json();
  assert.equal(cuerpo.error, 'correo_con_cuenta');
  assert.match(cuerpo.mensaje, /usa otro correo/);
  assert.equal((await pool.query("SELECT 1 FROM administrador WHERE correo = 'existe@adm.test'")).rowCount, 0);
});

test('Firebase caído → 502 firebase_error y no se crea nada', async () => {
  respuesta = 'caido';
  const r = await pedir('', { method: 'POST', body: datos('caido@adm.test') });
  assert.equal(r.status, 502);
  assert.equal((await r.json()).error, 'firebase_error');
  assert.equal((await pool.query("SELECT 1 FROM administrador WHERE correo = 'caido@adm.test'")).rowCount, 0);
});

test('correo ya registrado como admin → 409 admin_existe sin llamar a Firebase; datos inválidos → 422', async () => {
  const r = await pedir('', { method: 'POST', body: datos('enlace@adm.test') });
  assert.equal(r.status, 409);
  assert.equal((await r.json()).error, 'admin_existe');
  assert.equal(llamadas.length, 0);
  assert.equal((await pedir('', { method: 'POST', body: { ...datos('malo@adm.test'), telefono: '12345' } })).status, 422);
});

test('dos creaciones iguales a la vez: una 201 y otra 409', async () => {
  const [a, b] = await Promise.all([
    pedir('', { method: 'POST', body: datos('doble@adm.test') }),
    pedir('', { method: 'POST', body: datos('doble@adm.test') }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  assert.equal((await pool.query("SELECT 1 FROM administrador WHERE correo = 'doble@adm.test'")).rowCount, 1);
});

test('desactivar quita el acceso al instante; reactivar lo devuelve; reenviar no libera la temporal', async () => {
  const { administrador } = await (await pedir('', { method: 'POST', body: datos('ciclo@adm.test', 'temporal') })).json();
  const id = administrador.id_admin;
  const uid = administrador.id_auth;
  await pool.query('UPDATE administrador SET debe_cambiar_clave = FALSE WHERE id_admin = $1', [id]);
  const ordenes = async () => fetch(`${base}/api/ordenes`, { headers: { Authorization: `Bearer ${await token(uid)}` } });
  assert.equal((await ordenes()).status, 200);

  const off = await pedir(`/${id}`, { method: 'PATCH', body: { activo: false } });
  assert.equal(off.status, 200);
  assert.equal((await off.json()).administrador.activo, false);
  assert.equal((await ordenes()).status, 403);
  const rr = await pedir(`/${id}/reenviar`, { method: 'POST' });
  assert.equal(rr.status, 409);
  assert.equal((await rr.json()).error, 'admin_desactivado');

  assert.equal((await pedir(`/${id}`, { method: 'PATCH', body: { activo: true } })).status, 200);
  assert.equal((await ordenes()).status, 200);

  await pool.query('UPDATE administrador SET debe_cambiar_clave = TRUE WHERE id_admin = $1', [id]);
  llamadas = [];
  const re = await pedir(`/${id}/reenviar`, { method: 'POST' });
  assert.equal(re.status, 200);
  assert.deepEqual(llamadas.map((l) => l.metodo), ['sendOobCode']);
  // Reenviar NO libera la contraseña temporal: Firebase no la invalida hasta que se usa el enlace.
  const fila = await pool.query('SELECT debe_cambiar_clave FROM administrador WHERE id_admin = $1', [id]);
  assert.equal(fila.rows[0].debe_cambiar_clave, true);

  assert.equal((await pedir('/999999', { method: 'PATCH', body: { activo: false } })).status, 404);
  assert.equal((await pedir(`/${id}`, { method: 'PATCH', body: { activo: 'no' } })).status, 422);
});

test('la lista incluye a los definidos en el servidor (SUPER_UIDS y ADMIN_UIDS)', async () => {
  const r = await pedir('');
  assert.equal(r.status, 200);
  const { administradores, definidos_en_servidor } = await r.json();
  assert.ok(administradores.some((a) => a.correo === 'enlace@adm.test'));
  assert.deepEqual(definidos_en_servidor, [{ uid: 'uid-adm-super', tipo: 'super' }, { uid: 'uid-adm-env', tipo: 'admin' }]);
});
