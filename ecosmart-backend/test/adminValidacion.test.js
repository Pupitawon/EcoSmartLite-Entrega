const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generarClave } = require('../src/services/firebaseAuth');
const { adminSchema, normalizarTelefono } = require('../src/services/adminValidacion');

test('generarClave cumple las reglas de la app', () => {
  for (let i = 0; i < 50; i++) {
    const c = generarClave();
    assert.equal(c.length, 16);
    assert.match(c, /[A-Z]/);
    assert.match(c, /[a-z]/);
    assert.match(c, /\d/);
    assert.match(c, /[^A-Za-z0-9]/);
  }
});

test('normalizarTelefono acepta celulares chilenos y rechaza el resto', () => {
  assert.equal(normalizarTelefono('9 1234 5678'), '+56912345678');
  assert.equal(normalizarTelefono('+56912345678'), '+56912345678');
  assert.equal(normalizarTelefono('912345678'), '+56912345678');
  assert.equal(normalizarTelefono('12345'), null);
});

test('adminSchema normaliza correo, teléfono y RUT, y rechaza lo inválido', () => {
  const base = { nombre_completo: 'Ana Pérez', correo: 'ANA@Mail.cl', telefono: '912345678', modo: 'enlace' };
  const ok = adminSchema.safeParse(base);
  assert.equal(ok.success, true);
  assert.equal(ok.data.correo, 'ana@mail.cl');
  assert.equal(ok.data.telefono, '+56912345678');
  assert.equal(adminSchema.safeParse({ ...base, rut: '11.111.111-1' }).data.rut, '11111111-1');
  assert.equal(adminSchema.safeParse({ ...base, rut: '11111111-2' }).success, false);
  assert.equal(adminSchema.safeParse({ ...base, extra: 1 }).success, false);
  assert.equal(adminSchema.safeParse({ ...base, modo: 'otro' }).success, false);
});
