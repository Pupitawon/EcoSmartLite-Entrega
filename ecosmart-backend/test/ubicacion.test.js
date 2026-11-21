// Cambiar la ubicación de un contenedor: solo administradores. Se define antes de cargar la app.
process.env.ADMIN_UIDS = 'uid-ubi-admin';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, privateKey, original;

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  jwksServer = http.createServer((_q, r) => { r.setHeader('Content-Type', 'application/json'); r.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise((r) => jwksServer.listen(4999, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
  original = (await pool.query('SELECT latitud, longitud, direccion FROM contenedor WHERE id_contenedor = 101')).rows[0];
});
after(async () => {
  await pool.query('UPDATE contenedor SET latitud = $1, longitud = $2, direccion = $3 WHERE id_contenedor = 101', [original.latitud, original.longitud, original.direccion]);
  server.close(); jwksServer.close(); await pool.end();
});

const token = (sub) =>
  new SignJWT({ email: `${sub}@mail.cl`, email_verified: false })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub).setAudience(PROJECT).setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setIssuedAt().setExpirationTime('10m').sign(privateKey);

const mover = async (id, body, sub = 'uid-ubi-admin') =>
  fetch(`${base}/api/contenedores/${id}/ubicacion`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(sub ? { Authorization: `Bearer ${await token(sub)}` } : {}) },
    body: JSON.stringify(body),
  });

test('sin token → 401; ciudadano → 403 solo_administradores', async () => {
  assert.equal((await mover(101, { latitud: -22.46, longitud: -68.93 }, null)).status, 401);
  const r = await mover(101, { latitud: -22.46, longitud: -68.93 }, 'uid-ubi-ciudadano');
  assert.equal(r.status, 403);
  assert.equal((await r.json()).error, 'solo_administradores');
});

test('el admin mueve el contenedor y el mapa público lo ve en el lugar nuevo', async () => {
  const r = await mover(101, { latitud: -22.4612345, longitud: -68.9298765 });
  assert.equal(r.status, 200);
  const { contenedor } = await r.json();
  assert.equal(contenedor.id_contenedor, 101);
  assert.equal(contenedor.latitud, -22.4612345);
  assert.equal(contenedor.longitud, -68.9298765);
  const lista = await (await fetch(`${base}/api/contenedores`)).json();
  const c = lista.find((x) => x.id_contenedor === 101);
  assert.equal(c.latitud, -22.4612345);
  assert.equal(c.longitud, -68.9298765);
});

test('coordenadas inválidas → 422; contenedor inexistente → 404; id malo → 422', async () => {
  for (const body of [
    { latitud: 95, longitud: -68.9 },
    { latitud: -22.4, longitud: -190 },
    { latitud: '-22.4', longitud: -68.9 },
    { latitud: -22.4 },
    { latitud: -22.4, longitud: -68.9, extra: 1 },
    { latitud: 0, longitud: 0 },
  ]) {
    assert.equal((await mover(101, body)).status, 422, JSON.stringify(body));
  }
  assert.equal((await mover(999999, { latitud: -22.46, longitud: -68.93 })).status, 404);
  assert.equal((await mover('abc', { latitud: -22.46, longitud: -68.93 })).status, 422);
});

test('dirección: se guarda con la ubicación, se puede cambiar sola y se borra con texto vacío', async () => {
  const r = await mover(101, { latitud: -22.4601, longitud: -68.9301, direccion: '  Av. Granaderos 2390, frente al Jumbo  ' });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).contenedor.direccion, 'Av. Granaderos 2390, frente al Jumbo');
  const lista = await (await fetch(`${base}/api/contenedores`)).json();
  assert.equal(lista.find((x) => x.id_contenedor === 101).direccion, 'Av. Granaderos 2390, frente al Jumbo');

  const solo = await mover(101, { direccion: 'Plaza 23 de Marzo' });
  assert.equal(solo.status, 200);
  const c = (await solo.json()).contenedor;
  assert.equal(c.direccion, 'Plaza 23 de Marzo');
  assert.equal(c.latitud, -22.4601); // no se movió

  const vacia = await mover(101, { direccion: '   ' });
  assert.equal((await vacia.json()).contenedor.direccion, null);
});

test('dirección: muy larga, sin campos o con coordenada a medias → 422', async () => {
  assert.equal((await mover(101, { direccion: 'x'.repeat(201) })).status, 422);
  assert.equal((await mover(101, {})).status, 422);
  assert.equal((await mover(101, { latitud: -22.46, direccion: 'Calle 1' })).status, 422);
});
