const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { generateKeyPair, exportJWK, SignJWT } = require('jose');
const app = require('../index');
const pool = require('../src/config/db');

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
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-ins-%'");
});
after(async () => {
  await limpiar();
  await pool.query("DELETE FROM usuario WHERE id_auth LIKE 'uid-test-ins-%'");
  server.close(); jwksServer.close(); await pool.end();
});

const token = ({ sub, email = `${sub}@mail.cl`, exp = '10m', aud = PROJECT } = {}) =>
  new SignJWT({ email, email_verified: false })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub).setAudience(aud).setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setIssuedAt().setExpirationTime(exp).sign(privateKey);


const { calcularRacha, calcularLogros } = require('../src/services/insigniaService');
const UID = 'uid-test-ins-1';
const ID_BASE = 990000; // ids altos para no chocar con otros datos

async function limpiar() {
  await pool.query('DELETE FROM logro_usuario WHERE id_logro >= $1', [ID_BASE]);
  await pool.query('DELETE FROM deposito_residuo WHERE id_deposito >= $1', [ID_BASE]);
  await pool.query('DELETE FROM insignia WHERE id_insignia >= $1', [ID_BASE]);
  await pool.query('DELETE FROM contenedor WHERE id_contenedor = $1', [ID_BASE]);
  await pool.query('DELETE FROM tipo_material WHERE id_material = $1', [ID_BASE]);
}
before(limpiar);
const get = (t) => fetch(`${base}/api/usuarios/me/insignias`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });

test('racha: días seguidos, viva si el último depósito fue hoy o ayer', () => {
  assert.deepEqual(calcularRacha(['2026-11-15', '2026-11-14', '2026-11-13', '2026-11-10'], '2026-11-15'), { actual: 3, maxima: 3 });
  assert.deepEqual(calcularRacha(['2026-11-14', '2026-11-12', '2026-11-11'], '2026-11-15'), { actual: 1, maxima: 2 });
  assert.deepEqual(calcularRacha(['2026-11-13'], '2026-11-15'), { actual: 0, maxima: 1 });
  assert.deepEqual(calcularRacha([], '2026-11-15'), { actual: 0, maxima: 0 });
});

test('logros: nivel y avance según el valor', () => {
  const por = (v) => Object.fromEntries(calcularLogros(v).map((l) => [l.id, l]));
  const cero = por({ depositante: 0, racha: 0, botellas: 0 });
  assert.equal(cero.depositante.nivel, 0);
  assert.equal(cero.depositante.meta, 1);
  const medio = por({ depositante: 10, racha: 3, botellas: 30 });
  assert.equal(medio.depositante.nivel, 2); // 1 y 5 superados, falta 15
  assert.equal(medio.depositante.meta, 15);
  assert.equal(medio.depositante.avance, 0.5); // (10-5)/(15-5)
  assert.deepEqual(medio.depositante.niveles.map((n) => n.alcanzado), [true, true, false, false, false]); // todos los niveles, con su estado
  assert.deepEqual(medio.depositante.niveles.map((n) => n.requerido), [1, 5, 15, 30, 60]);
  assert.equal(medio.racha.nivel, 1);
  assert.equal(medio.botellas.nivel, 1);
  const tope = por({ depositante: 999, racha: 999, botellas: 9999 });
  assert.equal(tope.depositante.nivel, tope.depositante.niveles_totales);
  assert.equal(tope.depositante.meta, null);
  assert.equal(tope.depositante.avance, 1);
});

test('sin token → 401; sin perfil → 404', async () => {
  assert.equal((await get(null)).status, 401);
  assert.equal((await get(await token({ sub: 'uid-test-ins-sinperfil' }))).status, 404);
});

test('devuelve insignias con las desbloqueadas, avance a la siguiente y racha', async () => {
  const t = await token({ sub: UID });
  const reg = await fetch(`${base}/api/usuarios/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ rut: '11111111-1', nombre_completo: 'Ana Prueba' }),
  });
  assert.ok([200, 201].includes(reg.status));
  const { usuario } = await reg.json();

  await pool.query("INSERT INTO tipo_material (id_material, nombre_material) VALUES ($1, 'Test')", [ID_BASE]);
  await pool.query("INSERT INTO contenedor (id_contenedor, id_material, latitud, longitud, porcentaje_llenado, estado_operativo) VALUES ($1, $1, -22.45, -68.92, 10, 'activo')", [ID_BASE]);
  await pool.query(`INSERT INTO insignia (id_insignia, nombre_insignia, descripcion, umbral_depositos) VALUES
    ($1, 'Primer paso', 'Tu primer depósito', 1), ($1 + 1, 'Constante', 'Tres depósitos', 3), ($1 + 2, 'Experto', 'Diez depósitos', 10)`, [ID_BASE]);
  // Dos depósitos: hoy y ayer (hora de Chile). Fechas en UTC con margen de medio día para evitar bordes.
  for (const [k, dias] of [[0, 0], [1, 1]]) {
    await pool.query(
      `INSERT INTO deposito_residuo (id_deposito, id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados, cantidad_premiada, fecha_escaneo_offline)
       VALUES ($1, $2, $3, $4, 5, 3, (NOW() AT TIME ZONE 'UTC') - ($5 || ' days')::interval)`,
      [ID_BASE + k, usuario.id_usuario, ID_BASE, `ECO-TEST${k}`, String(dias)]
    );
  }
  await pool.query('INSERT INTO logro_usuario (id_logro, id_usuario, id_insignia, fecha_desbloqueo) VALUES ($1, $2, $3, NOW())', [ID_BASE, usuario.id_usuario, ID_BASE]);

  const res = await get(t);
  assert.equal(res.status, 200);
  const { resumen } = await res.json();
  assert.equal(resumen.depositos, 2);
  assert.equal(resumen.logros.length, 3);
  assert.equal(resumen.botellas, 6); // 2 depósitos x 3 botellas
  assert.equal(resumen.logros.find((l) => l.id === 'depositante').nivel, 1); // 2 depósitos: nivel 1 (1), falta 5
  assert.equal(resumen.insignias_totales >= 3, true);
  const mias = resumen.insignias.filter((i) => i.id_insignia >= ID_BASE);
  assert.deepEqual(mias.map((i) => i.desbloqueada), [true, false, false]);
  assert.deepEqual(resumen.siguiente, { nombre: 'Constante', umbral_depositos: 3, faltan: 1 });
  assert.equal(resumen.racha.maxima >= 1, true);
});
