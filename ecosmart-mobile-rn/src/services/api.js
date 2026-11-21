import { API_URL } from '../config';
import { auth } from '../firebase';
import { direccionDesdeOSM, urlNominatim } from '../utils/ubicacion';

const TIMEOUT_MS = 10000;

// fetch con tiempo máximo de espera: evita que la app quede cargando indefinidamente.
async function pedir(url, opciones = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opciones, signal: ctrl.signal });
  } catch (e) {
    throw new Error(
      e.name === 'AbortError' ? 'El servidor tardó demasiado en responder.' : 'Sin conexión con el servidor.'
    );
  } finally {
    clearTimeout(id);
  }
}

async function getJSON(ruta) {
  const res = await pedir(`${API_URL}${ruta}`);
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return res.json();
}

export const getContenedores = () => getJSON('/api/contenedores');

// Panel de administración (lectura pública).
export const getConfig = () => getJSON('/api/config');
export const getAlertas = () => getJSON('/api/alertas');
export const getReportes = () => getJSON('/api/reportes');

// Llamadas que exigen sesión: agregan el token de Firebase.
export async function llamar(ruta, opciones = {}) {
  if (!auth?.currentUser) throw new Error('Debes iniciar sesión.');
  const token = await auth.currentUser.getIdToken();
  const res = await pedir(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const datos = await res.json().catch(() => ({}));
  return { status: res.status, datos };
}

// Llamada pública (sin sesión), para endpoints que no exigen token, como recuperar contraseña.
export async function llamarPublico(ruta, opciones = {}) {
  const res = await pedir(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json' },
  });
  const datos = await res.json().catch(() => ({}));
  return { status: res.status, datos };
}

/**
 * Nueva ubicación y dirección de un contenedor (solo administradores). Devuelve el contenedor actualizado.
 * direccion: texto libre; '' la borra; undefined no la cambia.
 */
export async function moverContenedor(id, latitud, longitud, direccion) {
  const { status, datos } = await llamar(`/api/contenedores/${id}/ubicacion`, {
    method: 'PATCH',
    body: JSON.stringify({ latitud, longitud, ...(direccion !== undefined ? { direccion } : {}) }),
  });
  if (status === 200) return datos.contenedor;
  throw new Error(
    status === 403 ? 'Tu cuenta no es de administrador.'
      : status === 404 ? 'El contenedor ya no existe.'
      : status === 422 ? (datos?.detalles?.[0]?.mensaje || 'La ubicación no es válida.')
      : `El servidor respondió ${status}.`
  );
}

/**
 * Dirección sugerida para un punto, con el buscador gratuito de OpenStreetMap. Puede ser aproximada:
 * el admin la revisa antes de guardar. Devuelve el texto o lanza un Error con el motivo.
 */
export async function sugerirDireccion(lat, lng) {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(urlNominatim(lat, lng), { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`OpenStreetMap respondió ${res.status}.`);
    const texto = direccionDesdeOSM(await res.json());
    if (!texto) throw new Error('OpenStreetMap no encontró una dirección para ese punto. Escríbela a mano.');
    return texto;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('OpenStreetMap tardó demasiado. Escribe la dirección a mano.');
    throw e;
  } finally {
    clearTimeout(reloj);
  }
}

/** Cambia el estado de revisión de un reporte ciudadano. Solo administradores. */
export async function actualizarReporte(id, estado_revision) {
  const { status, datos } = await llamar(`/api/reportes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado_revision }),
  });
  if (status === 200) return datos.reporte;
  throw new Error(
    status === 403 ? 'Tu cuenta no es de administrador.'
      : status === 404 ? 'El reporte ya no existe.'
      : `El servidor respondió ${status}.`
  );
}

// Órdenes de trabajo del panel de administración. Solo administradores (ADMIN_UIDS en el backend).
function errorOrden(status) {
  return new Error(
    status === 401 ? 'Debes iniciar sesión.'
      : status === 403 ? 'Tu cuenta no es de administrador.'
      : status === 404 ? 'La orden o el contenedor ya no existe.'
      : status === 409 ? 'La orden ya está cerrada.'
      : status === 422 ? 'Datos de la orden no válidos.'
      : `El servidor respondió ${status}.`
  );
}

export async function getOrdenes() {
  const { status, datos } = await llamar('/api/ordenes');
  if (status === 200) return datos;
  throw errorOrden(status);
}

export async function crearOrden(orden) {
  const { status, datos } = await llamar('/api/ordenes', { method: 'POST', body: JSON.stringify(orden) });
  if (status === 201) return datos.orden;
  throw errorOrden(status);
}

export async function avanzarOrden(idOrden) {
  const { status, datos } = await llamar(`/api/ordenes/${idOrden}/avanzar`, { method: 'PATCH' });
  if (status === 200) return datos.orden;
  throw errorOrden(status);
}

export async function eliminarOrden(idOrden) {
  const { status } = await llamar(`/api/ordenes/${idOrden}`, { method: 'DELETE' });
  if (status === 204 || status === 404) return; // 404: otro administrador ya la eliminó
  throw errorOrden(status);
}
