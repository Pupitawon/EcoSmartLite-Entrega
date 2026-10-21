const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
let server, base, jwksServer, privateKey, otherKey;

before(async () => {
  const pair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  otherKey = (await generateKeyPair('RS256')).privateKey; // clave que Google NO publica
  // Simula el JWKS de Google (securetoken)
  jwksServer = http.createServer((_q, r) => {
    r.setHeader('Content-Type', 'application/json');
    r.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((r) => jwksServer.listen(4999, r));
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://localhost:${server.address().port}`;
});
after(async () => { server.close(); jwksServer.close(); await pool.end(); });

const token = ({ key = privateKey, sub = 'uid-cualquiera', aud = PROJECT, iss = `https://securetoken.google.com/${PROJECT}`, exp = '10m', claims = {} } = {}) =>
  new SignJWT({ role: 'authenticated', ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub).setAudience(aud).setIssuer(iss).setIssuedAt().setExpirationTime(exp).sign(key);

const enviar = (t) =>
  fetch(`${base}/api/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ id_contenedor: 101, porcentaje_llenado: 42 }),
  });

test('token Firebase válido con claim ingest=true → 201', async () => {
  assert.equal((await enviar(await token({ claims: { ingest: true } }))).status, 201);
});

test('UID listado en FIREBASE_INGEST_UIDS → 201', async () => {
  assert.equal((await enviar(await token({ sub: 'uid-gateway-permitido' }))).status, 201);
});

test('ciudadano normal (token válido, rol authenticated, sin permiso) → 403', async () => {
  assert.equal((await enviar(await token())).status, 403);
});

test('token firmado con otra clave → 401', async () => {
  assert.equal((await enviar(await token({ key: otherKey, claims: { ingest: true } }))).status, 401);
});

test('token de otro proyecto de Firebase (audience/issuer distinto) → 401', async () => {
  assert.equal((await enviar(await token({ aud: 'otro-proyecto', iss: 'https://securetoken.google.com/otro-proyecto', claims: { ingest: true } }))).status, 401);
});

test('token expirado → 401', async () => {
  assert.equal((await enviar(await token({ exp: new Date(Date.now() - 60_000), claims: { ingest: true } }))).status, 401);
});

test('basura que parece JWT → 401; la API key sigue funcionando', async () => {
  assert.equal((await enviar('aaa.bbb.ccc')).status, 401);
  assert.equal((await enviar(process.env.INGEST_API_KEY)).status, 201);
});

test('el token de Firebase también sirve en la ruta antigua PUT /nivel', async () => {
  const r = await fetch(`${base}/api/contenedores/101/nivel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token({ claims: { ingest: true } })}` },
    body: JSON.stringify({ porcentaje_llenado: 41 }),
  });
  assert.equal(r.status, 200);
});
