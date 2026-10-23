import { API_URL } from '../config';
import { auth } from '../firebase';

async function getJSON(ruta) {
  const res = await fetch(`${API_URL}${ruta}`);
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return res.json();
}

export const getContenedores = () => getJSON('/api/contenedores');

// Llamadas que exigen sesión: agregan el token de Firebase.
export async function llamar(ruta, opciones = {}) {
  if (!auth?.currentUser) throw new Error('Debes iniciar sesión.');
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const datos = await res.json().catch(() => ({}));
  return { status: res.status, datos };
}
