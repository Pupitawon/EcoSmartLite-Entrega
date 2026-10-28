import { API_URL } from '../config';
import { auth } from '../firebase';

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