const { z } = require('zod');
const { esAdmin } = require('../middleware/adminAuth');
const pool = require('../config/db');
const config = require('../config/config');

// RUT chileno: 7-8 dígitos + dígito verificador (módulo 11). Se guarda como 12345678-K, sin puntos.
function normalizarRut(raw) {
  return String(raw).replace(/[.\s]/g, '').toUpperCase();
}
function rutValido(rut) {
  const m = /^(\d{7,8})-([\dK])$/.exec(rut);
  if (!m) return false;
  let suma = 0, mult = 2;
  for (let i = m[1].length - 1; i >= 0; i--) {
    suma += Number(m[1][i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (suma % 11);
  const dv = r === 11 ? '0' : r === 10 ? 'K' : String(r);
  return dv === m[2];
}

const registroSchema = z
  .object({
    rut: z.string().transform(normalizarRut).refine(rutValido, 'RUT inválido'),
    nombre_completo: z.string().trim().min(2).max(100),
    recibe_notificaciones: z.boolean().optional().default(true),
  })
  .strict();

const COLUMNAS = 'id_usuario, rut, nombre_completo, correo, saldo_ecopoints, recibe_notificaciones, fecha_registro';

// Crea el perfil en la base para la cuenta de Firebase autenticada. Es idempotente: si ya existe, lo devuelve (200).
const registrarUsuario = async (req, res) => {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'datos_invalidos',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  if (!req.user.email) {
    return res.status(422).json({ error: 'datos_invalidos', mensaje: 'La cuenta de Firebase no tiene correo' });
  }
  const { rut, nombre_completo, recibe_notificaciones } = parsed.data;
  try {
    const existente = await pool.query(`SELECT ${COLUMNAS} FROM usuario WHERE id_auth = $1`, [req.user.uid]);
    if (existente.rows[0]) return res.status(200).json({ usuario: existente.rows[0], creado: false });

    const rutUsado = await pool.query('SELECT 1 FROM usuario WHERE rut = $1', [rut]);
    if (rutUsado.rowCount) return res.status(409).json({ error: 'rut_en_uso', mensaje: 'Ese RUT ya está registrado' });

    const nuevo = await pool.query(
      `INSERT INTO usuario (id_auth, rut, nombre_completo, correo, saldo_ecopoints, recibe_notificaciones, fecha_registro)
       VALUES ($1, $2, $3, $4, 0, $5, NOW() AT TIME ZONE 'UTC')
       ON CONFLICT (id_auth) DO NOTHING
       RETURNING ${COLUMNAS}`,
      [req.user.uid, rut, nombre_completo, req.user.email, recibe_notificaciones]
    );
    if (nuevo.rows[0]) return res.status(201).json({ usuario: nuevo.rows[0], creado: true });
    // Carrera: otra solicitud lo creó justo antes
    const ya = await pool.query(`SELECT ${COLUMNAS} FROM usuario WHERE id_auth = $1`, [req.user.uid]);
    return res.status(200).json({ usuario: ya.rows[0], creado: false });
  } catch (err) {
    console.error('Error al registrar usuario:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Perfil del usuario autenticado (404 si se creó en Firebase pero aún no completó el registro).
const miPerfil = async (req, res) => {
  try {
    const admin = esAdmin(req.user.uid);
    const r = await pool.query(`SELECT ${COLUMNAS} FROM usuario WHERE id_auth = $1`, [req.user.uid]);
    if (!r.rows[0]) {
      // Un administrador puede no tener perfil de ciudadano (RUT, EcoPoints): igual puede entrar.
      if (admin) return res.json({ usuario: { nombre_completo: 'Administrador', correo: req.user.email, es_admin: true } });
      return res.status(404).json({ error: 'perfil_no_encontrado' });
    }
    res.json({ usuario: { ...r.rows[0], es_admin: admin } });
  } catch (err) {
    console.error('Error al leer perfil:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// ---- Recuperar contraseña: exige correo y RUT del mismo usuario ----
const recuperarSchema = z
  .object({
    correo: z.string().trim().toLowerCase().email().max(254),
    rut: z.string().transform(normalizarRut).refine(rutValido, 'RUT inválido'),
  })
  .strict();

const MENSAJE_RECUPERAR =
  'Si los datos coinciden con una cuenta, te enviamos un enlace para restablecer tu contraseña.';

// Endpoint público. Responde siempre lo mismo (coincidan o no los datos) y antes de consultar,
// para no revelar qué correos o RUT están registrados ni por el contenido ni por el tiempo de respuesta.
const recuperarClave = async (req, res) => {
  const parsed = recuperarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'datos_invalidos',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  if (!config.firebaseWebApiKey) {
    console.error('Falta FIREBASE_WEB_API_KEY: no se puede enviar el correo de recuperación');
    return res.status(503).json({ error: 'servicio_no_disponible' });
  }

  res.json({ ok: true, mensaje: MENSAJE_RECUPERAR });

  try {
    const { correo, rut } = parsed.data;
    const r = await pool.query('SELECT 1 FROM usuario WHERE rut = $1 AND LOWER(correo) = $2', [rut, correo]);
    if (!r.rowCount) return; // no coincide: no se envía nada

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${config.firebaseWebApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Firebase-Locale': 'es' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: correo }),
      }
    );
    if (!resp.ok) {
      const cuerpo = await resp.json().catch(() => ({}));
      console.error('Firebase no envió el correo de recuperación:', resp.status, cuerpo?.error?.message);
    }
  } catch (err) {
    console.error('Error en recuperar clave:', err.message);
  }
};

module.exports = { registrarUsuario, miPerfil, recuperarClave, rutValido, normalizarRut };