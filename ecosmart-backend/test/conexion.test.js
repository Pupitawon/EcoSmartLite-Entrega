const { test } = require('node:test');
const assert = require('node:assert/strict');
const { estadoConexion } = require('../src/services/lecturaService');

const AHORA = new Date('2026-11-08T12:00:00Z').getTime();
const haceMin = (m) => new Date(AHORA - m * 60000);

test('lectura reciente → en_linea', () => {
  assert.equal(estadoConexion(haceMin(5), AHORA).estado_conexion, 'en_linea');
});
test('hasta 24 min sin lectura → sigue en_linea', () => {
  assert.equal(estadoConexion(haceMin(24), AHORA).estado_conexion, 'en_linea');
});
test('25 min o más sin lectura → sin_conexion', () => {
  assert.equal(estadoConexion(haceMin(25), AHORA).estado_conexion, 'sin_conexion');
  assert.equal(estadoConexion(haceMin(300), AHORA).estado_conexion, 'sin_conexion');
});
test('contenedor que nunca reportó → sin_conexion', () => {
  assert.deepEqual(estadoConexion(null, AHORA), { estado_conexion: 'sin_conexion', minutos_sin_lectura: null });
});