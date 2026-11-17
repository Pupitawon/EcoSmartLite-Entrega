// Constantes y reglas del panel de administración (antes estaban en el panel web del backend).

export const COLOR = {
  rojo: '#ef4444',
  ambar: '#f59e0b',
  verde: '#10b981',
  azul: '#0ea5e9',
  gris: '#71717a',
};

// Reportes ciudadanos (RF-05): mismos ids que el backend.
export const TIPO_REPORTE = {
  danado: 'Contenedor dañado',
  residuos_incorrectos: 'Residuos que no corresponden',
  otro: 'Otro problema',
};
export const ESTADO_REPORTE = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  descartado: 'Descartado',
};
export const COLOR_REPORTE = {
  pendiente: COLOR.ambar,
  en_revision: COLOR.azul,
  resuelto: COLOR.verde,
  descartado: COLOR.gris,
};

// Estado de conexión del sensor (campo estado_conexion de /api/contenedores).
export const CONEXION = {
  en_linea: { txt: 'En línea', color: COLOR.verde },
  sin_conexion: { txt: 'Sin conexión', color: COLOR.rojo },
};

// Órdenes de trabajo.
export const COLUMNAS_OT = ['Pendiente', 'Asignada', 'En terreno', 'Ejecutada', 'Verificada', 'Cerrada'];
export const TIPOS_OT = [
  'Vaciado',
  'Inspección',
  'Revisión de conectividad',
  'Reemplazo de sensor',
  'Limpieza',
  'Recalibración',
  'Reparación',
];
export const PRIORIDADES = ['Alta', 'Media', 'Baja'];
export const COLOR_PRIORIDAD = { Alta: COLOR.rojo, Media: COLOR.ambar, Baja: COLOR.verde };
export const TECNICOS = ['R. Fuentes', 'M. Soto', 'J. Pinto', 'Sin asignar'];

export const material = (c) => c?.nombre_material || 'Sin material';
export const ubicacion = (c) =>
  c?.latitud != null && c?.longitud != null ? `${c.latitud.toFixed(4)}, ${c.longitud.toFixed(4)}` : '—';

/** "hace 5 min", "hace 2 h"... */
export function hace(iso, ahora = Date.now()) {
  if (!iso) return 'Nunca reportó';
  const s = Math.max(0, (ahora - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'hace instantes';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

/** Reglas para clasificar un contenedor según el umbral y las horas configuradas en el backend. */
export function criterios(config, ahora) {
  const umbral = config.umbral_alerta;
  const sinLectura = (c) => !c.fecha_ultima_lectura;
  const sinReporte = (c) =>
    sinLectura(c) || ahora - new Date(c.fecha_ultima_lectura).getTime() > config.sin_reporte_horas * 3_600_000;
  const enAlerta = (c) => c.alerta_activa || (!sinLectura(c) && c.porcentaje_llenado >= umbral);
  const sinConexion = (c) => c.estado_conexion === 'sin_conexion';
  const colorLlenado = (pct) => (pct >= umbral ? COLOR.rojo : pct >= 50 ? COLOR.ambar : COLOR.verde);
  const estadoDe = (c) => {
    if (sinLectura(c)) return { txt: 'Sin lectura', color: COLOR.gris };
    if (enAlerta(c)) return { txt: 'Alerta', color: COLOR.rojo };
    if (c.porcentaje_llenado >= 50) return { txt: 'Atención', color: COLOR.ambar };
    return { txt: 'Disponible', color: COLOR.verde };
  };
  return { umbral, sinLectura, sinReporte, enAlerta, sinConexion, colorLlenado, estadoDe };
}

/** Tipo de actividad y prioridad sugeridos al crear una orden. */
export function sugerenciaOrden(c, tipoReporte, cr) {
  const tipo =
    tipoReporte === 'danado' ? 'Reparación'
      : tipoReporte === 'residuos_incorrectos' ? 'Limpieza'
      : tipoReporte ? 'Inspección'
      : cr.enAlerta(c) ? 'Vaciado'
      : cr.sinReporte(c) || cr.sinConexion(c) ? 'Revisión de conectividad'
      : 'Inspección';
  const prioridad = cr.enAlerta(c) || tipoReporte === 'danado' ? 'Alta' : 'Media';
  return { tipo, prioridad };
}

/** Color con transparencia (#rrggbb + alfa). */
export const suave = (hex, alfa = '26') => `${hex}${alfa}`;
