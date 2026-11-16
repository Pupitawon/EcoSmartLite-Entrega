import { llamar } from './api';

/**
 * Ranking del mes por botellas recicladas.
 * Devuelve { titulo, dias_restantes, participantes, en_ranking,
 *            top: [{ posicion, nombre, botellas, yo }], yo: { posicion, nombre, botellas } | null }.
 * `yo` solo viene cuando el usuario recicló este mes pero quedó fuera del top.
 */
export async function obtenerRanking() {
  const { status, datos } = await llamar('/api/usuarios/me/ranking');
  if (status === 200) return datos.ranking;
  throw new Error(`No se pudo cargar el ranking. Inténtalo de nuevo. (código ${status})`);
}
