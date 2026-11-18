// Contenedor del backend -> pin del mapa. Lo usan el mapa del ciudadano y el del administrador.
// Sin React: se prueba con node --test (test/admin.test.mjs).

/** id_contenedor es lo que necesitan el reporte ciudadano y el detalle del admin. */
export const aPin = (c) => ({
  id_contenedor: c.id_contenedor,
  name: `Contenedor #${c.id_contenedor}`,
  category: c.nombre_material || null,
  lat: c.latitud,
  lng: c.longitud,
  fill: Math.round(c.porcentaje_llenado),
  address: c.direccion || null,
  sinReporte: Boolean(c.sin_reporte),
  ultimaLectura: c.fecha_ultima_lectura || null,
});

/** Solo los contenedores con ubicación pueden ir al mapa. */
export const pinesDe = (contenedores) =>
  (contenedores || []).filter((c) => c.latitud != null && c.longitud != null).map(aPin);
