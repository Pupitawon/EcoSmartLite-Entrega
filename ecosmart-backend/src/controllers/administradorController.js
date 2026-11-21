const { z } = require('zod');
const pool = require('../config/db');
const config = require('../config/config');
const { COLUMNAS_ADMIN } = require('../services/rolService');
const { adminSchema } = require('../services/adminValidacion');
const { crearCuenta, borrarCuenta, enviarCorreoClave, generarClave } = require('../services/firebaseAuth');

// Gestión de administradores. Todas las rutas son solo del súper usuario (ver administradorRoutes.js).

const UTC_NOW = "(NOW() AT TIME ZONE 'UTC')";
const detalles = (error) => error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
const MENSAJE_CORREO_CON_CUENTA = 'Ese correo ya tiene una cuenta en EcoSmart; usa otro correo para el administrador.';

function aDTO(row) {
  return {
    id_admin: row.id_admin,
    id_auth: row.id_auth,
    nombre_completo: row.nombre_completo,
    correo: row.correo,
    telefono: row.telefono,
    rut: row.rut,
    activo: row.activo,
    debe_cambiar_clave: row.debe_cambiar_clave,
    fecha_creacion: row.fecha_creacion ? new Date(row.fecha_creacion).toISOString() : null,
  };
}

const idDe = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Lista de la tabla + los definidos por variable de entorno (solo lectura en la app).
const listar = async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNAS_ADMIN} FROM administrador ORDER BY activo DESC, nombre_completo`);
    res.json({
      administradores: rows.map(aDTO),
      definidos_en_servidor: [
        ...config.superUids.map((uid) => ({ uid, tipo: 'super' })),
        ...config.adminUids.filter((uid) => !config.superUids.includes(uid)).map((uid) => ({ uid, tipo: 'admin' })),
      ],
    });
  } catch (err) {
    console.error('Error al listar administradores:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

/**
 * Crea un administrador: cuenta nueva en Firebase + fila en la tabla.
 * modo 'enlace': Firebase le envía "crea tu contraseña". modo 'temporal': se devuelve la contraseña UNA vez
 * (nunca se guarda ni se registra) y debe cambiarla al entrar.
 */
const crear = async (req, res) => {
  const parsed = adminSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'datos_invalidos', detalles: detalles(parsed.error) });
  const d = parsed.data;

  try {
    const previo = await pool.query('SELECT activo FROM administrador WHERE correo = $1', [d.correo]);
    if (previo.rows[0]) {
      return res.status(409).json({
        error: 'admin_existe',
        mensaje: previo.rows[0].activo
          ? 'Ese correo ya es administrador.'
          : 'Ese correo pertenece a un administrador desactivado: reactívalo desde la lista.',
      });
    }

    const clave = generarClave();
    let cuenta;
    try {
      cuenta = await crearCuenta(d.correo, clave);
    } catch (err) {
      if (err.codigo === 'EMAIL_EXISTS') return res.status(409).json({ error: 'correo_con_cuenta', mensaje: MENSAJE_CORREO_CON_CUENTA });
      console.error('Error de Firebase al crear administrador:', err.message);
      return res.status(502).json({ error: 'firebase_error', mensaje: 'Firebase no respondió. Inténtalo de nuevo.' });
    }

    let fila;
    try {
      const temporal = d.modo === 'temporal';
      const { rows } = await pool.query(
        `INSERT INTO administrador (id_auth, correo, nombre_completo, telefono, rut, debe_cambiar_clave, creado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COLUMNAS_ADMIN}`,
        [cuenta.uid, d.correo, d.nombre_completo, d.telefono, d.rut ?? null, temporal, req.user.uid]
      );
      fila = rows[0];
    } catch (err) {
      await borrarCuenta(cuenta.idToken); // no dejar una cuenta de Firebase sin administrador
      if (err.code === '23505') return res.status(409).json({ error: 'admin_existe', mensaje: 'Ese correo ya es administrador.' });
      throw err;
    }

    if (d.modo === 'temporal') {
      return res.status(201).json({ administrador: aDTO(fila), clave_temporal: clave });
    }
    let aviso;
    try {
      await enviarCorreoClave(d.correo);
    } catch (err) {
      console.error('No se envió el correo "crea tu contraseña":', err.message);
      aviso = 'El administrador quedó creado, pero el correo no se pudo enviar. Usa "Reenviar correo".';
    }
    return res.status(201).json({ administrador: aDTO(fila), ...(aviso ? { aviso } : {}) });
  } catch (err) {
    console.error('Error al crear administrador:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

const activoSchema = z.object({ activo: z.boolean() }).strict();

// Desactivar quita el acceso al instante (requireAdmin lee la tabla en cada solicitud). Reactivar lo devuelve.
const cambiarActivo = async (req, res) => {
  const id = idDe(req);
  if (!id) return res.status(422).json({ error: 'id_invalido' });
  const parsed = activoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'datos_invalidos', detalles: detalles(parsed.error) });
  try {
    const { rows } = await pool.query(
      `UPDATE administrador SET activo = $2, fecha_actualizacion = ${UTC_NOW} WHERE id_admin = $1 RETURNING ${COLUMNAS_ADMIN}`,
      [id, parsed.data.activo]
    );
    if (!rows[0]) return res.status(404).json({ error: 'admin_no_encontrado' });
    res.json({ administrador: aDTO(rows[0]) });
  } catch (err) {
    console.error('Error al cambiar el estado del administrador:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Vuelve a enviar "crea tu contraseña". Como con el enlace define su propia contraseña, ya no debe cambiar la temporal.
const reenviar = async (req, res) => {
  const id = idDe(req);
  if (!id) return res.status(422).json({ error: 'id_invalido' });
  try {
    const { rows } = await pool.query('SELECT correo, activo FROM administrador WHERE id_admin = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'admin_no_encontrado' });
    if (!rows[0].activo) return res.status(409).json({ error: 'admin_desactivado', mensaje: 'Reactívalo antes de reenviar el correo.' });
    try {
      await enviarCorreoClave(rows[0].correo);
    } catch (err) {
      console.error('Error de Firebase al reenviar el correo:', err.message);
      return res.status(502).json({ error: 'firebase_error', mensaje: 'Firebase no respondió. Inténtalo de nuevo.' });
    }
    await pool.query(
      `UPDATE administrador SET debe_cambiar_clave = FALSE, fecha_actualizacion = ${UTC_NOW} WHERE id_admin = $1`,
      [id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al reenviar el correo:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

module.exports = { listar, crear, cambiarActivo, reenviar };
