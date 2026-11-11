import { llamar } from './api';

// Mismos códigos que devuelve registrar_deposito (en minúsculas, como en /api/reportes).
const MENSAJES = {
  qr_invalido: 'Este código QR no corresponde a un contenedor EcoSmart.',
  contenedor_lleno: 'Este contenedor está lleno. Usa otro contenedor cercano.',
  cantidad_invalida: 'La cantidad de botellas no es válida.',
  fecha_invalida: 'La fecha del escaneo no es válida. Revisa la hora de tu teléfono.',
  usuario_no_encontrado: 'Completa tu registro antes de reciclar.',
  perfil_no_encontrado: 'Completa tu registro antes de reciclar.',
  escaneo_ya_registrado: 'Este escaneo ya fue registrado.',
};

/** Resumen del día del usuario: límite diario, botellas con puntos usadas/restantes y puntos por botella. */
export async function obtenerResumen() {
  const { status, datos } = await llamar('/api/depositos/resumen');
  if (status === 200) return datos.resumen;
  throw new Error('No se pudo cargar tu resumen del día.');
}

/**
 * Registra un depósito: cantidad de botellas + QR del contenedor.
 * id_escaneo (UUID) hace seguro reintentar: si la respuesta se pierde, el servidor no suma dos veces.
 * fecha_escaneo va en ISO (UTC).
 * Devuelve el objeto de la función SQL: { ecopoints_otorgados, cantidad, cantidad_premiada,
 * restantes_hoy, saldo_ecopoints, insignias_nuevas, duplicado, ... }
 * Los errores llevan .reintentable = true cuando tiene sentido volver a intentar el mismo envío.
 */
export async function registrarDeposito({ codigo_qr, cantidad, id_escaneo, fecha_escaneo }) {
  let respuesta;
  try {
    respuesta = await llamar('/api/depositos', {
      method: 'POST',
      body: JSON.stringify({ codigo_qr, cantidad, id_escaneo, fecha_escaneo }),
    });
  } catch (e) {
    const err = new Error(e.message || 'Sin conexión con el servidor.');
    err.reintentable = true;
    throw err;
  }

  const { status, datos } = respuesta;
  if (status === 200 || status === 201) return datos.deposito;

  const err = new Error(
    MENSAJES[String(datos?.error || '').toLowerCase()] || 'No se pudo registrar el reciclaje. Inténtalo de nuevo.'
  );
  err.reintentable = status >= 500;
  throw err;
}
