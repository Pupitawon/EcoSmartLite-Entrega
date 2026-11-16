const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');
const { nombreCorto, armarRanking } = require('../src/services/rankingService');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
const ID_BASE = 970000; // ids altos para no chocar con otros datos
let server, base, jwksServer, privateKey;

async function limpiar() {
  await pool.query('DELETE FROM deposito_residuo WHERE id_deposito >= $1', [ID_BASE]);
  await pool.query('DELETE FROM contenedor WHERE id_contenedor = $1', [ID_BASE]);
  await pool.query('DELETE FROM tipo_material WHERE id_material = $1', [ID_BASE]);
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-rank-%'");
}

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
const get = (t) => fetch(`${base}/api/usuarios/me/ranking`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });

test('nombreCorto: primer nombre e inicial del siguiente', () => {
  assert.equal(nombreCorto('Marcelo Araya Torres'), 'Marcelo A.');
  assert.equal(nombreCorto('  ana  '), 'ana');
  assert.equal(nombreCorto(''), 'Reciclador');
});

test('armarRanking: top de 10 y el usuario fuera del top va aparte', () => {
  const filas = Array.from({ length: 12 }, (_, i) => ({ posicion: i + 1, id_usuario: i + 1, nombre_completo: `Usuario${i + 1} Apellido`, botellas: 50 - i }));
  const r = armarRanking(filas, 12, { mes: 11, diasRestantes: 14 });
  assert.equal(r.titulo, 'Ranking de noviembre');
  assert.equal(r.top.length, 10);
  assert.equal(r.participantes, 12);
  assert.deepEqual([r.yo.posicion, r.yo.botellas], [12, 39]);
  const dentro = armarRanking(filas, 3, { mes: 11, diasRestantes: 14 });
  assert.equal(dentro.yo, null);
  assert.equal(dentro.top[2].yo, true);
  assert.equal(armarRanking(filas, 99, { mes: 11, diasRestantes: 1 }).en_ranking, false);
});

test('sin token → 401; sin perfil → 404', async () => {
  assert.equal((await get(null)).status, 401);
  assert.equal((await get(await token('uid-test-rank-sinperfil'))).status, 404);
});

test('ordena por botellas del mes, ignora meses anteriores y muestra nombres cortos', async () => {
  const ids = [];
  const nombres = ['Ana Prueba Uno', 'Beto Prueba Dos', 'Carla Prueba Tres'];
  for (let i = 0; i < 3; i++) {
    const t = await token(`uid-test-rank-${i}`);
    const reg = await fetch(`${base}/api/usuarios/registro`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ rut: ['11111111-1', '22222222-2', '33333333-3'][i], nombre_completo: nombres[i] }),
    });
    assert.ok([200, 201].includes(reg.status));
    ids.push((await reg.json()).usuario.id_usuario);
  }
  await pool.query("INSERT INTO tipo_material (id_material, nombre_material) VALUES ($1, 'Test')", [ID_BASE]);
  await pool.query("INSERT INTO contenedor (id_contenedor, id_material, latitud, longitud, porcentaje_llenado, estado_operativo) VALUES ($1, $1, -22.45, -68.92, 10, 'activo')", [ID_BASE]);
  // Ana: 3 botellas este mes. Beto: 8. Carla: 5 este mes y 99 hace 70 días (no cuentan).
  const depositos = [[0, 0, 3, 0], [1, 1, 8, 0], [2, 2, 5, 0], [3, 2, 99, 70]];
  for (const [k, u, cant, dias] of depositos) {
    await pool.query(
      `INSERT INTO deposito_residuo (id_deposito, id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados, cantidad_premiada, fecha_escaneo_offline)
       VALUES ($1, $2, $3, $4, 5, $5, (NOW() AT TIME ZONE 'UTC') - ($6 || ' days')::interval)`,
      [ID_BASE + k, ids[u], ID_BASE, `ECO-RNK${k}`, cant, String(dias)]
    );
  }
  const res = await get(await token('uid-test-rank-0'));
  assert.equal(res.status, 200);
  const { ranking } = await res.json();
  const mios = ranking.top.filter((f) => ['Ana P.', 'Beto P.', 'Carla P.'].includes(f.nombre));
  assert.deepEqual(mios.map((f) => [f.nombre, f.botellas]), [['Beto P.', 8], ['Carla P.', 5], ['Ana P.', 3]]);
  assert.equal(mios.find((f) => f.nombre === 'Ana P.').yo, true);
  assert.equal(ranking.en_ranking, true);
});
