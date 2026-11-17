import { llamar } from './api';

/**
 * Desafíos del día y del mes del usuario autenticado.
 * Devuelve { dia: { horas_restantes, desafios: [{ id, titulo, valor, meta, unidad, completado }] },
 *            mes: { titulo, dias_restantes, meta, valor, hitos: [{ valor, alcanzado }], completado } }.
 */
export async function obtenerDesafios() {
  const { status, datos } = await llamar('/api/usuarios/me/desafios');
  if (status === 200) return datos.desafios;
  throw new Error(`No se pudieron cargar tus desafíos. Inténtalo de nuevo. (código ${status})`);
}
