import { test } from 'node:test';
import assert from 'node:assert/strict';
import { direccionDesdeOSM, leerCoordenadas, resultadosDesdeOSM, urlBuscarDireccion, urlComoLlegar, urlGoogleMaps } from '../src/utils/ubicacion.js';

test('leerCoordenadas acepta punto o coma decimal y espacios', () => {
  assert.deepEqual(leerCoordenadas('-22.4612', '-68.9298'), { latitud: -22.4612, longitud: -68.9298 });
  assert.deepEqual(leerCoordenadas(' -22,4612 ', '-68,9298'), { latitud: -22.4612, longitud: -68.9298 });
});

test('leerCoordenadas rechaza vacíos, texto, fuera de rango y (0, 0)', () => {
  for (const [lat, lng] of [['', '-68.9'], ['abc', '-68.9'], ['95', '-68.9'], ['-22.4', '-190'], ['0', '0'], ['-22.4.5', '-68.9']]) {
    const r = leerCoordenadas(lat, lng);
    assert.equal(typeof r.error, 'string', `${lat}, ${lng}`);
  }
});

test('urlGoogleMaps abre el punto exacto', () => {
  assert.equal(urlGoogleMaps(-22.4612, -68.9298), 'https://www.google.com/maps/search/?api=1&query=-22.4612,-68.9298');
});

test('direccionDesdeOSM arma "calle número, sector" y omite lo que falta', () => {
  assert.equal(
    direccionDesdeOSM({ address: { road: 'Avenida Granaderos', house_number: '2390', suburb: 'Villa Exótica', city: 'Calama' } }),
    'Avenida Granaderos 2390, Villa Exótica'
  );
  assert.equal(direccionDesdeOSM({ address: { pedestrian: 'Calle Ramírez', city: 'Calama' } }), 'Calle Ramírez, Calama');
  assert.equal(direccionDesdeOSM({ name: 'Plaza 23 de Marzo', address: { leisure: 'Plaza 23 de Marzo', city: 'Calama' } }), 'Plaza 23 de Marzo, Calama');
  assert.equal(direccionDesdeOSM({ display_name: 'Algo, Calama, Chile', address: {} }), 'Algo, Calama');
  assert.equal(direccionDesdeOSM({ error: 'Unable to geocode' }), null);
  assert.equal(direccionDesdeOSM(null), null);
});

test('urlComoLlegar abre la ruta a pie hasta el contenedor', () => {
  assert.equal(
    urlComoLlegar(-22.4612, -68.9298),
    'https://www.google.com/maps/dir/?api=1&destination=-22.4612,-68.9298&travelmode=walking'
  );
});

test('urlBuscarDireccion busca en Chile, prioriza Calama y codifica el texto', () => {
  const u = new URL(urlBuscarDireccion('Av. Granaderos 2390'));
  assert.equal(u.origin + u.pathname, 'https://nominatim.openstreetmap.org/search');
  assert.equal(u.searchParams.get('q'), 'Av. Granaderos 2390');
  assert.equal(u.searchParams.get('countrycodes'), 'cl');
  assert.equal(u.searchParams.get('limit'), '5');
  assert.equal(u.searchParams.get('accept-language'), 'es');
  assert.ok(u.searchParams.get('viewbox'));
});

test('resultadosDesdeOSM arma punto y texto corto, y descarta lo inválido', () => {
  const r = resultadosDesdeOSM([
    { lat: '-22.4601', lon: '-68.9301', address: { road: 'Avenida Granaderos', house_number: '2390', city: 'Calama' } },
    { lat: 'x', lon: '-68.9' },
    { lat: '-22.47', lon: '-68.92', display_name: 'Plaza 23 de Marzo, Calama, Chile', address: {} },
  ]);
  assert.deepEqual(r, [
    { lat: -22.4601, lng: -68.9301, texto: 'Avenida Granaderos 2390, Calama' },
    { lat: -22.47, lng: -68.92, texto: 'Plaza 23 de Marzo, Calama' },
  ]);
  assert.deepEqual(resultadosDesdeOSM(null), []);
});
