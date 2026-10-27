const { z } = require('zod');
const pool = require('../config/db');


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
    const r = await pool.query(`SELECT ${COLUMNAS} FROM usuario WHERE id_auth = $1`, [req.user.uid]);
    if (!r.rows[0]) return res.status(404).json({ error: 'perfil_no_encontrado' });
    res.json({ usuario: r.rows[0] });
  } catch (err) {
    console.error('Error al leer perfil:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Registrar depósito de residuo y abonar EcoPoints
const ECOPOINTS_POR_DEPOSITO = 10;

const depositoSchema = z.object({
  id_contenedor: z.number().int().positive(),
  codigo_qr_escaneado: z.string().trim().min(1).max(200),
});

const registrarDeposito = async (req, res) => {
  const parsed = depositoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'datos_invalidos',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  const { id_contenedor, codigo_qr_escaneado } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query('SELECT id_usuario FROM usuario WHERE id_auth = $1 FOR UPDATE', [req.user.uid]);
    if (!u.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'perfil_no_encontrado' });
    }
    const idUsuario = u.rows[0].id_usuario;
    const dep = await client.query(
      `INSERT INTO deposito_residuo (id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [idUsuario, id_contenedor, codigo_qr_escaneado, ECOPOINTS_POR_DEPOSITO]
    );
    const usr = await client.query(
      `UPDATE usuario SET saldo_ecopoints = saldo_ecopoints + $1
        WHERE id_usuario = $2 RETURNING id_usuario, nombre_completo, saldo_ecopoints`,
      [ECOPOINTS_POR_DEPOSITO, idUsuario]
    );
    await client.query('COMMIT');
    res.json({ mensaje: '¡Depósito registrado con éxito!', deposito: dep.rows[0], usuario: usr.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23503') return res.status(404).json({ error: 'contenedor_no_existe' });
    console.error('Error al registrar depósito:', err.message);
    res.status(500).json({ error: 'error_interno' });
  } finally {
    client.release();
  }
};

module.exports = { registrarDeposito, registrarUsuario, miPerfil, rutValido, normalizarRut };