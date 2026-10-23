// Colores y constantes tomados de la app de Jeremy (Tailwind: zinc / stone / emerald / amber).
export const FILL_THRESHOLDS = { MEDIUM: 50, FULL: 80 }; // RNF-04: verde 0-49, amarillo 50-79, rojo 80-100

export const STATUS_META = {
  low: { color: '#22c55e', label: 'Disponible' },
  medium: { color: '#eab308', label: 'Moderado' },
  full: { color: '#ef4444', label: 'Lleno' },
  unknown: { color: '#9ca3af', label: 'Estado no disponible' },
};

export function getFillStatus(fill) {
  if (fill >= FILL_THRESHOLDS.FULL) return 'full';
  if (fill >= FILL_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

// Sin lectura reciente del sensor (campo sin_reporte de la API) no se muestra un color falso.
export const getPinStatus = (pin) => getFillStatus(pin.fill);

// Mismos ids que acepta POST /api/reportes.
export const ANOMALY_TYPES = [
  { id: 'danado', label: 'Contenedor dañado' },
  { id: 'residuos_incorrectos', label: 'Residuos que no corresponden' },
  { id: 'otro', label: 'Otro problema' },
];

export const CALAMA = { latitude: -22.4589, longitude: -68.9285 };

const oscuro = {
  dark: true,
  fondoApp: '#09090b', // zinc-950
  superficie: '#18181b', // zinc-900
  borde: '#27272a', // zinc-800
  texto: '#ffffff',
  textoSuave: '#a1a1aa', // zinc-400
  textoCampo: '#d4d4d8', // zinc-300
  campo: '#09090b',
  campoBorde: '#27272a',
  acento: '#10b981', // emerald-500
  acentoFuerte: '#059669', // emerald-600
  navFondo: '#09090b',
  navActivoFondo: 'rgba(39,39,42,0.8)',
  navActivo: '#34d399', // emerald-400
  navInactivo: '#71717a',
  iconoTema: '#fbbf24',
  error: '#ef4444',
  ambar: '#f59e0b',
};

const claro = {
  dark: false,
  fondoApp: '#fafaf9', // stone-50
  superficie: '#ffffff',
  borde: '#e7e5e4', // stone-200
  texto: '#18181b',
  textoSuave: '#78716c', // stone-500
  textoCampo: '#44403c', // stone-700
  campo: '#fafaf9',
  campoBorde: '#d6d3d1', // stone-300
  acento: '#10b981',
  acentoFuerte: '#059669',
  navFondo: '#059669', // emerald-600
  navActivoFondo: 'rgba(255,255,255,0.2)',
  navActivo: '#ffffff',
  navInactivo: 'rgba(255,255,255,0.7)',
  iconoTema: '#d97706',
  error: '#ef4444',
  ambar: '#d97706',
};

export const temaDe = (darkMode) => (darkMode ? oscuro : claro);
