import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { llamar, llamarPublico } from './api';

const MENSAJES = {
  'auth/email-already-in-use': 'Ese correo ya está registrado. Inicia sesión.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/missing-email': 'Ingresa tu correo.',
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

/**
 * Envía el correo de restablecimiento de contraseña (Firebase).
 * Por seguridad no revela si el correo existe: si la cuenta no existe, también se muestra éxito.
 */
/**
 * Pide el correo de restablecimiento de contraseña. El backend valida que correo y RUT sean de la misma cuenta.
 * Por seguridad responde siempre lo mismo, coincidan o no los datos.
 */
export async function recuperarClave(correo, rut) {
  const { status } = await llamarPublico('/api/usuarios/recuperar-clave', {
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim(), rut }),
  });
  if (status === 200) return;
  throw new Error(
    status === 422 ? 'Revisa tu correo y tu RUT (formato 12345678-5).'
      : status === 429 ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
      : 'No se pudo enviar el correo. Inténtalo de nuevo.'
  );
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
