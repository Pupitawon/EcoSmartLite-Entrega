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

// Búsqueda unificada: une la idea de Marcelo (agregar ", Calama" si falta) con la lista de hasta 5 resultados.
test('urlBuscarDireccion busca en Chile, agrega Calama si falta y pide hasta 5 resultados', () => {
  const u = new URL(urlBuscarDireccion('Av. Granaderos 2390'));
  assert.equal(u.origin + u.pathname, 'https://nominatim.openstreetmap.org/search');
  assert.equal(u.searchParams.get('q'), 'Av. Granaderos 2390, Calama');
  assert.equal(u.searchParams.get('countrycodes'), 'cl');
  assert.equal(u.searchParams.get('limit'), '5');
  assert.equal(u.searchParams.get('accept-language'), 'es');
  assert.ok(u.searchParams.get('viewbox'));
  assert.equal(new URL(urlBuscarDireccion('Latorre 1500, Calama')).searchParams.get('q'), 'Latorre 1500, Calama');
  assert.equal(new URL(urlBuscarDireccion('  calle   ramírez  ')).searchParams.get('q'), 'calle ramírez, Calama');
});

test('resultadosDesdeOSM arma punto (7 decimales) y texto corto, y descarta lo inválido', () => {
  const r = resultadosDesdeOSM([
    { lat: '-22.45678901', lon: '-68.92345678', address: { road: 'Avenida Granaderos', house_number: '2390', city: 'Calama' } },
    { lat: 'x', lon: '-68.9' },
    { lat: '-22.47', lon: '-68.92', display_name: 'Plaza 23 de Marzo, Calama, Chile', address: {} },
  ]);
  assert.deepEqual(r, [
    { lat: -22.456789, lng: -68.9234568, texto: 'Avenida Granaderos 2390, Calama' },
    { lat: -22.47, lng: -68.92, texto: 'Plaza 23 de Marzo, Calama' },
  ]);
  assert.deepEqual(resultadosDesdeOSM([]), []);
  assert.deepEqual(resultadosDesdeOSM(null), []);
});

test('resultadosDesdeOSM no repite el mismo texto (tramos de una misma calle)', () => {
  const r = resultadosDesdeOSM([
    { lat: '-22.43', lon: '-68.92', address: { road: 'Avenida Granaderos', suburb: 'Villa Independencia Norte' } },
    { lat: '-22.44', lon: '-68.93', address: { road: 'Avenida Granaderos', suburb: 'Villa Independencia Norte' } },
    { lat: '-22.42', lon: '-68.92', address: { road: 'Avenida Granaderos', suburb: 'Villa Tucnar Huasi' } },
  ]);
  assert.deepEqual(r.map((x) => x.texto), ['Avenida Granaderos, Villa Independencia Norte', 'Avenida Granaderos, Villa Tucnar Huasi']);
  assert.deepEqual([r[0].lat, r[0].lng], [-22.43, -68.92]); // se queda con el primero (el más relevante)
});
