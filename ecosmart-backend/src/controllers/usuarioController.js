const { z } = require('zod');
const { rolDe } = require('../services/rolService');
const pool = require('../config/db');
const config = require('../config/config');
const { resumenInsignias } = require('../services/insigniaService');
const { resumenDesafios } = require('../services/desafioService');
const { resumenRanking } = require('../services/rankingService');
const { enviarCorreoClave } = require('../services/firebaseAuth');
const { normalizarRut, rutValido } = require('../utils/rut');

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
    // Carrera: otra cuenta registró el mismo RUT (o correo) entre la verificación y el INSERT.
    if (err.code === '23505') {
      if (err.constraint === 'uq_usuario_correo') {
        return res.status(409).json({ error: 'correo_en_uso', mensaje: 'Ese correo ya está registrado' });
      }
      return res.status(409).json({ error: 'rut_en_uso', mensaje: 'Ese RUT ya está registrado' });
    }
    console.error('Error al registrar usuario:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Rol que la app necesita para decidir qué vista mostrar.
const marcasRol = (rol) => ({ es_admin: rol.esAdmin, es_super: rol.esSuper, debe_cambiar_clave: rol.debeCambiarClave });

/**
 * Perfil del usuario autenticado.
 * - Ciudadano: su fila de `usuario` + el rol (un admin desactivado con perfil de ciudadano entra como ciudadano).
 * - Admin sin perfil de ciudadano: sus datos de `administrador` (o "Administrador" si viene de SUPER_UIDS / ADMIN_UIDS).
 * - Admin desactivado sin perfil: 403 admin_desactivado.
 * - Nadie: 404 (se creó en Firebase pero aún no completó el registro).
 */
const miPerfil = async (req, res) => {
  try {
    const rol = await rolDe(req.user.uid);
    const r = await pool.query(`SELECT ${COLUMNAS} FROM usuario WHERE id_auth = $1`, [req.user.uid]);
    if (r.rows[0]) return res.json({ usuario: { ...r.rows[0], ...marcasRol(rol) } });
    if (rol.esAdmin) {
      const a = rol.admin;
      return res.json({
        usuario: {
          nombre_completo: a?.nombre_completo || 'Administrador',
          correo: a?.correo || req.user.email,
          telefono: a?.telefono || null,
          rut: a?.rut || null,
          ...marcasRol(rol),
        },
      });
    }
    if (rol.desactivado) return res.status(403).json({ error: 'admin_desactivado' });
    return res.status(404).json({ error: 'perfil_no_encontrado' });
  } catch (err) {
    console.error('Error al leer perfil:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Preferencias que el ciudadano puede cambiar desde Configuración. Por ahora solo las notificaciones.
const preferenciasSchema = z.object({ recibe_notificaciones: z.boolean() }).strict();

const actualizarPreferencias = async (req, res) => {
  const parsed = preferenciasSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'datos_invalidos',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  try {
    const r = await pool.query(
      `UPDATE usuario SET recibe_notificaciones = $2 WHERE id_auth = $1 RETURNING ${COLUMNAS}`,
      [req.user.uid, parsed.data.recibe_notificaciones]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'perfil_no_encontrado' });
    res.json({ usuario: { ...r.rows[0], ...marcasRol(await rolDe(req.user.uid)) } });
  } catch (err) {
    console.error('Error al actualizar preferencias:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

/**
 * El admin avisa que ya cambió su contraseña temporal (la app lo llama después de cambiarla en Firebase).
 * Sin Admin SDK el servidor no puede comprobar el cambio: confía en el aviso. Solo el súper usuario vio la temporal.
 */
const claveCambiada = async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE administrador SET debe_cambiar_clave = FALSE, fecha_actualizacion = (NOW() AT TIME ZONE 'UTC')
        WHERE id_auth = $1 RETURNING id_admin`,
      [req.user.uid]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'admin_no_encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al marcar la contraseña cambiada:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Insignias, avance y racha del usuario autenticado (pantalla Perfil de la app).
const misInsignias = async (req, res) => {
  try {
    const r = await resumenInsignias(req.user.uid);
    if (!r) return res.status(404).json({ error: 'perfil_no_encontrado' });
    res.json({ resumen: r });
  } catch (err) {
    console.error('Error al leer insignias:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Desafíos del día y del mes del usuario autenticado (pantalla Desafíos de la app).
const misDesafios = async (req, res) => {
  try {
    const r = await resumenDesafios(req.user.uid);
    if (!r) return res.status(404).json({ error: 'perfil_no_encontrado' });
    res.json({ desafios: r });
  } catch (err) {
    console.error('Error al leer desafíos:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Ranking del mes por botellas recicladas (pantalla Ranking de la app).
const miRanking = async (req, res) => {
  try {
    const r = await resumenRanking(req.user.uid);
    if (!r) return res.status(404).json({ error: 'perfil_no_encontrado' });
    res.json({ ranking: r });
  } catch (err) {
    console.error('Error al leer el ranking:', err.message);
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

    await enviarCorreoClave(correo);
  } catch (err) {
    console.error('Error en recuperar clave:', err.message);
  }
};

module.exports = { registrarUsuario, miPerfil, actualizarPreferencias, claveCambiada, misInsignias, misDesafios, miRanking, recuperarClave, rutValido, normalizarRut };