import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, firebaseConfigurado } from "./firebase.js";
import { apiUrl } from "./api.js";

const MENSAJES = {
  "auth/email-already-in-use": "Ese correo ya está registrado. Inicia sesión.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
};
export const mensajeError = (e) => MENSAJES[e?.code] || e?.message || "Ocurrió un error inesperado.";

function requerirFirebase() {
  if (!firebaseConfigurado) throw new Error("Firebase no está configurado (faltan las variables VITE_FIREBASE_* en .env).");
}

async function llamar(ruta, opciones = {}) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`${apiUrl}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const datos = await res.json().catch(() => ({}));
  return { status: res.status, datos };
}

/** Crea la cuenta en Firebase y luego el perfil en la base. Si el perfil falla, deshace la cuenta para poder reintentar. */
export async function registrar({ correo, clave, rut, nombre_completo, recibe_notificaciones = true }) {
  requerirFirebase();
  const cred = await createUserWithEmailAndPassword(auth, correo, clave);
  try {
    const { status, datos } = await llamar("/api/usuarios/registro", {
      method: "POST",
      body: JSON.stringify({ rut, nombre_completo, recibe_notificaciones }),
    });
    if (status === 201 || status === 200) return datos.usuario;
    throw new Error(
      status === 409 ? "Ese RUT ya está registrado."
        : status === 422 ? "Revisa el RUT y el nombre."
        : "No se pudo guardar tu perfil. Inténtalo de nuevo."
    );
  } catch (e) {
    await cred.user.delete().catch(() => {}); // evita una cuenta de Firebase sin perfil
    throw e;
  }
}

/** Inicia sesión y devuelve el perfil de la base (null si la cuenta no completó su registro). */
export async function iniciarSesion(correo, clave) {
  requerirFirebase();
  await signInWithEmailAndPassword(auth, correo, clave);
  const { status, datos } = await llamar("/api/usuarios/me");
  if (status === 200) return datos.usuario;
  if (status === 404) return null;
  throw new Error("No se pudo cargar tu perfil. Inténtalo de nuevo.");
}

/** Envía un reporte ciudadano de anomalía (RF-05). Llega en vivo al panel web de Innova Recicla. */
export async function enviarReporte({ id_contenedor, tipo_anomalia, descripcion }) {
  requerirFirebase();
  if (!auth.currentUser) throw new Error("Inicia sesión para enviar un reporte.");
  const { status, datos } = await llamar("/api/reportes", {
    method: "POST",
    body: JSON.stringify({ id_contenedor, tipo_anomalia, descripcion }),
  });
  if (status === 201) return datos.reporte;
  throw new Error(
    datos.error === "contenedor_no_existe" ? "Este contenedor ya no existe."
      : datos.error === "perfil_no_encontrado" ? "Completa tu registro antes de reportar."
      : status === 422 ? "Revisa el tipo de problema y la descripción (máx. 500 caracteres)."
      : "No se pudo enviar el reporte. Inténtalo de nuevo."
  );
}

export const cerrarSesion =() => (auth ? signOut(auth) : Promise.resolve());
export const recuperarClave = (correo) => { requerirFirebase(); return sendPasswordResetEmail(auth, correo); };
