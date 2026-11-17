const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');
const { calcularDesafios } = require('../src/services/desafioService');

const PROJECT = process.env.FIREBASE_PROJECT_ID;
const UID = 'uid-test-des-1';
const ID_BASE = 980000; // ids altos para no chocar con otros datos
let server, base, jwksServer, privateKey;

async function limpiar() {
  await pool.query('DELETE FROM deposito_residuo WHERE id_deposito >= $1', [ID_BASE]);
  await pool.query('DELETE FROM contenedor WHERE id_contenedor = $1', [ID_BASE]);
  await pool.query('DELETE FROM tipo_material WHERE id_material = $1', [ID_BASE]);
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-des-%'");
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
const get = (t) => fetch(`${base}/api/usuarios/me/desafios`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });

test('calcularDesafios: progreso, tope en la meta y hitos del mes', () => {
  const r = calcularDesafios({ depositosHoy: 1, botellasHoy: 7, limiteDiario: 10, botellasMes: 13, mes: 11, diasRestantesMes: 14, horasRestantesDia: 23 });
  const [primero, cinco, limite] = r.dia.desafios;
  assert.deepEqual([primero.valor, primero.completado], [1, true]);
  assert.deepEqual([cinco.valor, cinco.meta, cinco.completado], [5, 5, true]); // 7 botellas, el valor se topa en la meta
  assert.deepEqual([limite.valor, limite.meta, limite.completado], [7, 10, false]);
  assert.equal(r.mes.titulo, 'Desafío de noviembre');
  assert.equal(r.mes.valor, 13);
  assert.deepEqual(r.mes.hitos.map((h) => h.alcanzado), [true, false, false]);
  assert.equal(r.mes.completado, false);
  const lleno = calcularDesafios({ depositosHoy: 0, botellasHoy: 0, limiteDiario: 10, botellasMes: 99, mes: 1, diasRestantesMes: 3, horasRestantesDia: 5 });
  assert.equal(lleno.mes.valor, 30); // no pasa de la meta
  assert.equal(lleno.mes.completado, true);
});

test('sin token → 401; sin perfil → 404', async () => {
  assert.equal((await get(null)).status, 401);
  assert.equal((await get(await token('uid-test-des-sinperfil'))).status, 404);
});

test('cuenta lo reciclado hoy y en el mes (hora de Chile)', async () => {
  const t = await token(UID);
  const reg = await fetch(`${base}/api/usuarios/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ rut: '11111111-1', nombre_completo: 'Ana Prueba' }),
  });
  assert.ok([200, 201].includes(reg.status));
  const { usuario } = await reg.json();
  await pool.query("INSERT INTO tipo_material (id_material, nombre_material) VALUES ($1, 'Test')", [ID_BASE]);
  await pool.query("INSERT INTO contenedor (id_contenedor, id_material, latitud, longitud, porcentaje_llenado, estado_operativo) VALUES ($1, $1, -22.45, -68.92, 10, 'activo')", [ID_BASE]);
  // Dos depósitos hoy (3 y 4 botellas) y uno hace 40 días (no cuenta ni hoy ni este mes).
  for (const [k, cant, dias] of [[0, 3, 0], [1, 4, 0], [2, 9, 40]]) {
    await pool.query(
      `INSERT INTO deposito_residuo (id_deposito, id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados, cantidad_premiada, fecha_escaneo_offline)
       VALUES ($1, $2, $3, $4, 5, $5, (NOW() AT TIME ZONE 'UTC') - ($6 || ' days')::interval)`,
      [ID_BASE + k, usuario.id_usuario, ID_BASE, `ECO-DES${k}`, cant, String(dias)]
    );
  }
  const res = await get(t);
  assert.equal(res.status, 200);
  const { desafios } = await res.json();
  const [primero, cinco] = desafios.dia.desafios;
  assert.equal(primero.valor, 1); // el tope de "primer depósito" es 1
  assert.equal(cinco.valor, 5);
  assert.equal(desafios.dia.desafios[2].valor, 7); // 3 + 4 botellas hoy (límite por defecto 10)
  assert.ok(desafios.mes.botellas >= 7 && desafios.mes.botellas <= 7 + 0); // el de hace 40 días queda fuera del mes
  assert.equal(desafios.mes.meta, 30);
  assert.ok(desafios.mes.dias_restantes >= 0);
  assert.ok(desafios.dia.horas_restantes >= 0 && desafios.dia.horas_restantes <= 24);
});
