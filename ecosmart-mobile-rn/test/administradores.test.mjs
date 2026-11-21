import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoAdmin, telefonoVisible } from '../src/admin/administradoresVista.js';

test('estadoAdmin: activo, desactivado y con contraseña temporal pendiente', () => {
  assert.equal(estadoAdmin({ activo: true, debe_cambiar_clave: false }).texto, 'Activo');
  assert.equal(estadoAdmin({ activo: false, debe_cambiar_clave: false }).texto, 'Desactivado');
  assert.equal(estadoAdmin({ activo: false, debe_cambiar_clave: true }).texto, 'Desactivado');
  assert.equal(estadoAdmin({ activo: true, debe_cambiar_clave: true }).texto, 'Debe cambiar contraseña');
  assert.match(estadoAdmin({ activo: true }).color, /^#[0-9a-f]{6}$/i);
});

test('telefonoVisible agrupa el celular chileno y deja tal cual lo que no reconoce', () => {
  assert.equal(telefonoVisible('+56912345678'), '+56 9 1234 5678');
  assert.equal(telefonoVisible('12345'), '12345');
  assert.equal(telefonoVisible(null), '—');
});
