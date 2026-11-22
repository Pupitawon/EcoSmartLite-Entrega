// Coordenadas de un contenedor que el admin escribe a mano, y el enlace para abrirlas en Google Maps.
// Sin React: se prueba con node --test.

const NUMERO = /^-?\d+(\.\d+)?$/;

function numero(texto) {
  const limpio = String(texto ?? '').trim().replace(',', '.');
  return NUMERO.test(limpio) ? Number(limpio) : null;
}

/**
 * Lee latitud y longitud escritas (acepta coma o punto decimal).
 * Devuelve { latitud, longitud } o { error } con el motivo en español.
 */
export function leerCoordenadas(latTexto, lngTexto) {
  const latitud = numero(latTexto);
  const longitud = numero(lngTexto);
  if (latitud === null || longitud === null) return { error: 'Escribe la latitud y la longitud como números, por ejemplo -22.4612.' };
  if (latitud < -90 || latitud > 90) return { error: 'La latitud debe estar entre -90 y 90.' };
  if (longitud < -180 || longitud > 180) return { error: 'La longitud debe estar entre -180 y 180.' };
  if (latitud === 0 && longitud === 0) return { error: 'La ubicación (0, 0) no es válida.' };
  return { latitud, longitud };
}

/** Enlace que abre el punto en Google Maps (app o navegador). */
export const urlGoogleMaps = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

/** Ruta en Google Maps desde donde está la persona hasta el contenedor, a pie (se puede cambiar en Google Maps). */
export const urlComoLlegar = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

// Calama: los resultados de esta zona salen primero, sin descartar el resto de Chile.
const VIEWBOX_CALAMA = '-69.00,-22.40,-68.85,-22.52';

/** Búsqueda de OpenStreetMap (Nominatim): de dirección a puntos, solo en Chile y priorizando Calama. */
export const urlBuscarDireccion = (texto) =>
  `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: String(texto ?? '').trim(),
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'cl',
    viewbox: VIEWBOX_CALAMA,
    bounded: '0',
    limit: '5',
    'accept-language': 'es',
  })}`;

/** Resultados de la búsqueda -> [{ lat, lng, texto }] con la dirección corta; descarta los que no traen punto válido. */
export function resultadosDesdeOSM(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), texto: direccionDesdeOSM(r) }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && r.texto);
}

/** Búsqueda inversa de OpenStreetMap (Nominatim): de coordenadas a dirección, en español. */
export const urlNominatim = (lat, lng) =>
  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;

/**
 * Dirección corta a partir de la respuesta de Nominatim: "Calle número, sector" o "Lugar, ciudad".
 * null si OpenStreetMap no encontró nada.
 */
export function direccionDesdeOSM(r) {
  if (!r || r.error) return null;
  const a = r.address || {};
  const calle = a.road || a.pedestrian || a.footway || a.path || a.residential;
  const principal = calle ? `${calle}${a.house_number ? ` ${a.house_number}` : ''}` : r.name || a.leisure || a.amenity || null;
  const zona = a.suburb || a.neighbourhood || a.quarter || a.city || a.town || a.village;
  if (principal) return zona ? `${principal}, ${zona}` : principal;
  const partes = String(r.display_name || '').split(',').map((x) => x.trim()).filter(Boolean);
  return partes.length ? partes.slice(0, 2).join(', ') : null;
}
