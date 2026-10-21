const { z } = require('zod');
const pool = require('../config/db');

const UTC_NOW = "(NOW() AT TIME ZONE 'UTC')";

// ---------------------------------------------------------------------------
// RUT chileno: normaliza (sin puntos ni guion) y valida el dígito verificador (módulo 11).
// ---------------------------------------------------------------------------
function calcularDV(cuerpo) {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function normalizarRut(valor) {
  const limpio = String(valor).trim().toUpperCase().replace(/[^0-9K]/g, '');
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return { cuerpo, dv, normalizado: `${cuerpo}-${dv}` };
}

const rutSchema = z
  .string()
  .min(1, 'rut es requerido')
  .transform(normalizarRut)
  .refine(({ cuerpo, dv }) => /^\d{1,8}$/.test(cuerpo) && calcularDV(cuerpo) === dv, {
    message: 'rut inválido: el dígito verificador no coincide',
  })
  .transform(({ normalizado }) => normalizado);

const registroSchema = z
  .object({
    rut: rutSchema,
    nombre_completo: z.string().trim().min(1).max(100),
    correo: z.string().trim().toLowerCase().email().max(100),
    recibe_notificaciones: z.boolean(),
  })
  .strict();

function aDTO(row) {
  return {
    id_usuario: row.id_usuario,
    rut: row.rut,
    nombre_completo: row.nombre_completo,
    correo: row.correo,
    saldo_ecopoints: Number(row.saldo_ecopoints),
    recibe_notificaciones: row.recibe_notificaciones,
    fecha_registro: row.fecha_registro ? new Date(row.fecha_registro).toISOString() : null,
  };
}

const CAMPO_POR_CONSTRAINT = {
  uq_usuario_rut: 'rut',
  uq_usuario_correo: 'correo',
  uq_usuario_id_auth: 'id_auth',
};

const SELECT_USUARIO = 'SELECT id_usuario, rut, nombre_completo, correo, saldo_ecopoints, recibe_notificaciones, fecha_registro FROM usuario';

// ---------------------------------------------------------------------------
// Registro: el saldo (0) y la fecha (hora del servidor, UTC) los fija el backend, nunca el cliente.
// Si el id_auth ya tiene cuenta, se devuelve esa cuenta en vez de intentar crear otra.
// ---------------------------------------------------------------------------
async function registrarUsuario(idAuth, datos) {
  const { rows: previas } = await pool.query(`${SELECT_USUARIO} WHERE id_auth = $1`, [idAuth]);
  if (previas.length > 0) {
    return { estado: 'ya_registrado', usuario: aDTO(previas[0]) };
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO usuario (id_auth, rut, nombre_completo, correo, saldo_ecopoints, recibe_notificaciones, fecha_registro)
       VALUES ($1, $2, $3, $4, 0, $5, ${UTC_NOW})
       RETURNING id_usuario, rut, nombre_completo, correo, saldo_ecopoints, recibe_notificaciones, fecha_registro`,
      [idAuth, datos.rut, datos.nombre_completo, datos.correo, datos.recibe_notificaciones]
    );
    return { estado: 'creado', usuario: aDTO(rows[0]) };
  } catch (err) {
    if (err.code !== '23505') throw err;

    const campo = CAMPO_POR_CONSTRAINT[err.constraint];
    if (campo === 'id_auth') {
      // Dos solicitudes simultáneas con el mismo id_auth: la otra ganó la carrera, se devuelve su cuenta.
      const { rows } = await pool.query(`${SELECT_USUARIO} WHERE id_auth = $1`, [idAuth]);
      return { estado: 'ya_registrado', usuario: aDTO(rows[0]) };
    }
    return { estado: 'duplicado', campo: campo || 'rut' };
  }
}

module.exports = { registroSchema, registrarUsuario };
