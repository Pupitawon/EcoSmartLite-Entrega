import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { llamar } from './api';

const MENSAJES = {
  'auth/email-already-in-use': 'Ese correo ya está registrado. Inicia sesión.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
};
export const mensajeError = (e) => MENSAJES[e?.code] || e?.message || 'Ocurrió un error inesperado.';

/** Crea la cuenta en Firebase y luego el perfil en la base. Si el perfil falla, deshace la cuenta para poder reintentar. */
export async function registrar({ correo, clave, rut, nombre_completo, recibe_notificaciones = true }) {
  const cred = await createUserWithEmailAndPassword(auth, correo, clave);
  try {
    const { status, datos } = await llamar('/api/usuarios/registro', {
      method: 'POST',
      body: JSON.stringify({ rut, nombre_completo, recibe_notificaciones }),
    });
    if (status === 201 || status === 200) return datos.usuario;
    throw new Error(
      status === 409 ? 'Ese RUT ya está registrado.'
        : status === 422 ? 'RUT inválido.'
        : 'No se pudo guardar tu perfil. Inténtalo de nuevo.'
    );
  } catch (e) {
    await cred.user.delete().catch(() => {}); // evita una cuenta de Firebase sin perfil
    throw e;
  }
}

/** Devuelve el perfil de la base del usuario autenticado (null si no completó su registro). */
export async function obtenerPerfil() {
  const { status, datos } = await llamar('/api/usuarios/me');
  if (status === 200) return datos.usuario;
  if (status === 404) return null;
  throw new Error('No se pudo cargar tu perfil. Inténtalo de nuevo.');
}

/** Inicia sesión y devuelve el perfil (null si la cuenta no completó su registro). */
export async function iniciarSesion(correo, clave) {
  await signInWithEmailAndPassword(auth, correo, clave);
  return obtenerPerfil();
}

/** Envía un reporte ciudadano de anomalía (RF-05). Llega al panel web de Innova Recicla. */
export async function enviarReporte({ id_contenedor, tipo_anomalia, descripcion }) {
  const { status, datos } = await llamar('/api/reportes', {
    method: 'POST',
    body: JSON.stringify({ id_contenedor, tipo_anomalia, descripcion }),
  });
  if (status === 201) return datos.reporte;
  throw new Error(
    datos.error === 'contenedor_no_existe' ? 'Este contenedor ya no existe.'
      : datos.error === 'perfil_no_encontrado' ? 'Completa tu registro antes de reportar.'
      : status === 422 ? 'El comentario es obligatorio (máx. 500 caracteres).'
      : 'No se pudo enviar el reporte. Inténtalo de nuevo.'
  );
}

export const cerrarSesion = () => (auth ? signOut(auth) : Promise.resolve());
