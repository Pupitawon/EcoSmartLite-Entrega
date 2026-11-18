import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pinesDe } from '../src/utils/pines.js';
import { resumenAdmin } from '../src/admin/utils.js';

test('pinesDe descarta contenedores sin coordenadas', () => {
  const pines = pinesDe([
    { id_contenedor: 1, latitud: -22.4, longitud: -68.9, porcentaje_llenado: 81.6, sin_reporte: false },
    { id_contenedor: 2, latitud: null, longitud: -68.9, porcentaje_llenado: 10 },
  ]);
  assert.equal(pines.length, 1);
  assert.equal(pines[0].fill, 82);
  assert.equal(pines[0].name, 'Contenedor #1');
});

test('resumenAdmin cuenta solo lo pendiente', () => {
  const r = resumenAdmin({
    alertas: [{ estado_alerta: 'pendiente' }, { estado_alerta: 'resuelta' }],
    reportes: [{ estado_revision: 'pendiente' }, { estado_revision: 'en_revision' }, { estado_revision: 'resuelto' }],
    ordenes: [{ estado: 'Pendiente' }, { estado: 'En terreno' }, { estado: 'Cerrada' }],
  });
  assert.deepEqual(r, { alertasPendientes: 1, reportesPendientes: 1, ordenesAbiertas: 2 });
});

test('resumenAdmin con listas vacías o undefined', () => {
  assert.deepEqual(resumenAdmin({ alertas: [], reportes: undefined }), { alertasPendientes: 0, reportesPendientes: 0, ordenesAbiertas: 0 });
});
