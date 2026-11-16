// Ligas del reciclador, de menor a mayor. Mismos nombres que usa Duolingo
// (Bronce, Plata, Oro, Zafiro, Rubí, Esmeralda, Amatista, Perla, Obsidiana, Diamante).
// La liga depende solo de los depósitos acumulados: `desde` es el mínimo para entrar en ella.
export const LIGAS = [
  { nombre: 'Bronce', desde: 0, color: '#b45309' },
  { nombre: 'Plata', desde: 3, color: '#94a3b8' },
  { nombre: 'Oro', desde: 8, color: '#eab308' },
  { nombre: 'Zafiro', desde: 15, color: '#3b82f6' },
  { nombre: 'Rubí', desde: 25, color: '#e11d48' },
  { nombre: 'Esmeralda', desde: 40, color: '#10b981' },
  { nombre: 'Amatista', desde: 60, color: '#a855f7' },
  { nombre: 'Perla', desde: 90, color: '#f472b6' },
  { nombre: 'Obsidiana', desde: 130, color: '#475569' },
  { nombre: 'Diamante', desde: 200, color: '#22d3ee' },
];

/**
 * Liga actual según los depósitos, la siguiente (o null en Diamante) y el avance 0..1 dentro de la liga.
 * Ejemplo: 3 depósitos -> Plata, siguiente Oro (8), avance 0 de 5.
 */
export function ligaDe(depositos) {
  const n = Math.max(0, Number(depositos) || 0);
  let indice = 0;
  LIGAS.forEach((l, i) => { if (n >= l.desde) indice = i; });
  const actual = LIGAS[indice];
  const siguiente = LIGAS[indice + 1] || null;
  const avance = siguiente ? (n - actual.desde) / (siguiente.desde - actual.desde) : 1;
  return { actual, siguiente, avance, faltan: siguiente ? siguiente.desde - n : 0, posicion: indice + 1, total: LIGAS.length };
}
