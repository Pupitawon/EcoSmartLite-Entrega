import { llamar } from './api';

// Gestión de administradores (solo súper usuario). Mismos códigos de error que el backend.
const MENSAJES = {
  solo_super_usuario: 'Solo el súper usuario puede gestionar administradores.',
  admin_existe: 'Ese correo ya es administrador.',
  correo_con_cuenta: 'Ese correo ya tiene una cuenta en EcoSmart; usa otro correo para el administrador.',
  admin_desactivado: 'Ese administrador está desactivado: reactívalo antes de reenviar el correo.',
  admin_no_encontrado: 'Ese administrador ya no existe.',
  firebase_error: 'Firebase no respondió. Inténtalo de nuevo.',
  demasiadas_solicitudes: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
};

function error(status, datos, porDefecto) {
  if (status === 422) {
    const campo = datos?.detalles?.[0];
    return new Error(campo ? `Revisa ${campo.campo.replace('_', ' ')}: ${campo.mensaje}` : 'Revisa los datos ingresados.');
  }
  return new Error(datos?.mensaje || MENSAJES[datos?.error] || porDefecto);
}

/** { administradores: [...], definidos_en_servidor: [{ uid, tipo }] } */
export async function listarAdministradores() {
  const { status, datos } = await llamar('/api/administradores');
  if (status === 200) return datos;
  throw error(status, datos, 'No se pudo cargar la lista de administradores.');
}

/**
 * Crea un administrador. datos = { nombre_completo, correo, telefono, rut?, modo: 'enlace' | 'temporal' }.
 * Devuelve { administrador, clave_temporal?, aviso? }. La clave temporal solo llega esta vez.
 */
export async function crearAdministrador(datosAdmin) {
  const cuerpo = { ...datosAdmin };
  if (!cuerpo.rut) delete cuerpo.rut;
  const { status, datos } = await llamar('/api/administradores', { method: 'POST', body: JSON.stringify(cuerpo) });
  if (status === 201) return datos;
  throw error(status, datos, 'No se pudo crear el administrador.');
}

export async function cambiarActivo(id, activo) {
  const { status, datos } = await llamar(`/api/administradores/${id}`, { method: 'PATCH', body: JSON.stringify({ activo }) });
  if (status === 200) return datos.administrador;
  throw error(status, datos, 'No se pudo cambiar el estado del administrador.');
}

export async function reenviarCorreo(id) {
  const { status, datos } = await llamar(`/api/administradores/${id}/reenviar`, { method: 'POST' });
  if (status === 200) return;
  throw error(status, datos, 'No se pudo reenviar el correo.');
}
