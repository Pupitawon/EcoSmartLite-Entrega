const { randomInt } = require('node:crypto');
const config = require('../config/config');

/**
 * API REST de Firebase Authentication con la clave web (FIREBASE_WEB_API_KEY).
 * El backend no tiene Admin SDK: con esta API puede crear cuentas y enviar el correo de restablecimiento,
 * pero no buscar usuarios. En los tests FIREBASE_AUTH_URL apunta a un servidor local que la simula.
 */

function errorFirebase(codigo, mensaje) {
  const e = new Error(mensaje);
  e.codigo = codigo;
  return e;
}

async function llamar(metodo, cuerpo, extraHeaders = {}) {
  if (!config.firebaseWebApiKey) throw errorFirebase('FIREBASE', 'Falta FIREBASE_WEB_API_KEY');
  let resp;
  try {
    resp = await fetch(`${config.firebaseAuthUrl}/accounts:${metodo}?key=${config.firebaseWebApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify(cuerpo),
    });
  } catch (err) {
    throw errorFirebase('FIREBASE', `Firebase no responde: ${err.message}`);
  }
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = String(datos?.error?.message || resp.status);
    // Firebase responde, por ejemplo, "EMAIL_EXISTS" o "WEAK_PASSWORD : Password should be…"
    throw errorFirebase(msg.startsWith('EMAIL_EXISTS') ? 'EMAIL_EXISTS' : 'FIREBASE', `Firebase: ${msg}`);
  }
  return datos;
}

/**
 * Crea una cuenta de correo y contraseña. Devuelve el UID y el token de esa cuenta recién creada
 * (sirve para borrarla si después falla guardar el administrador). Lanza .codigo = 'EMAIL_EXISTS' | 'FIREBASE'.
 */
async function crearCuenta(correo, clave) {
  const datos = await llamar('signUp', { email: correo, password: clave, returnSecureToken: true });
  if (!datos.localId) throw errorFirebase('FIREBASE', 'Firebase no devolvió el UID');
  return { uid: datos.localId, idToken: datos.idToken };
}

/** Borra la cuenta recién creada con su propio token. Se usa para no dejar cuentas huérfanas; nunca lanza. */
async function borrarCuenta(idToken) {
  if (!idToken) return;
  try {
    await llamar('delete', { idToken });
  } catch (err) {
    console.error('No se pudo borrar la cuenta de Firebase recién creada:', err.message);
  }
}

/** Envía el correo de Firebase para (re)definir la contraseña. Lanza .codigo = 'FIREBASE'. */
async function enviarCorreoClave(correo) {
  await llamar('sendOobCode', { requestType: 'PASSWORD_RESET', email: correo }, { 'X-Firebase-Locale': 'es' });
}

const MAYUS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUS = 'abcdefghijkmnopqrstuvwxyz';
const NUMS = '23456789';
const ESPECIALES = '!@#$%&*?';
const TODOS = MAYUS + MINUS + NUMS + ESPECIALES;
const azar = (s) => s[randomInt(s.length)];

/**
 * Contraseña aleatoria de 16 caracteres que cumple las 5 reglas de la app (ecosmart-mobile-rn/src/utils/clave.js):
 * al menos una mayúscula, una minúscula, un número y un carácter especial. Sin caracteres ambiguos (0/O, 1/l/I).
 */
function generarClave() {
  const c = [azar(MAYUS), azar(MINUS), azar(NUMS), azar(ESPECIALES)];
  while (c.length < 16) c.push(azar(TODOS));
  for (let i = c.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.join('');
}

module.exports = { crearCuenta, borrarCuenta, enviarCorreoClave, generarClave };
