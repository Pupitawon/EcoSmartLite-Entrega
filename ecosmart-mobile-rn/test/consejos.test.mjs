import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSEJOS, consejoDelDia, saludoDe } from '../src/utils/consejos.js';

test('hay un consejo por cada día de la semana', () => {
  assert.equal(CONSEJOS.length, 7);
});

test('el consejo es el mismo durante todo el día', () => {
  assert.equal(consejoDelDia(new Date(2026, 10, 23, 8, 0)), consejoDelDia(new Date(2026, 10, 23, 22, 30)));
});

test('cada día de la semana tiene su consejo y se repite a la semana siguiente', () => {
  // 22-11-2026 es domingo
  assert.equal(consejoDelDia(new Date(2026, 10, 22)), CONSEJOS[0]);
  assert.equal(consejoDelDia(new Date(2026, 10, 23)), CONSEJOS[1]);
  assert.equal(consejoDelDia(new Date(2026, 10, 28)), CONSEJOS[6]);
  assert.equal(consejoDelDia(new Date(2026, 10, 29)), consejoDelDia(new Date(2026, 10, 22)));
});


test('el saludo cambia según la hora del día', () => {
  assert.equal(saludoDe(10), 'Buenos días');
  assert.equal(saludoDe(14), 'Buenos días');
  assert.equal(saludoDe(15), 'Buenas tardes');
  assert.equal(saludoDe(19), 'Buenas tardes');
  assert.equal(saludoDe(20), 'Buenas noches');
  assert.equal(saludoDe(23), 'Buenas noches');
});