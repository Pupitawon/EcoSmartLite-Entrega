import { llamar } from './api';

/**
 * Insignias, avance hacia la siguiente y racha del usuario autenticado.
 * Devuelve { depositos, insignias_desbloqueadas, insignias_totales, racha: { actual, maxima }, siguiente, insignias: [...] }.
 */
export async function obtenerInsignias() {
  const { status, datos } = await llamar('/api/usuarios/me/insignias');
  if (status === 200) return datos.resumen;
  throw new Error(`No se pudieron cargar tus insignias (código ${status}). Inténtalo de nuevo.`);
}
