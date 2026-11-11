const { z } = require('zod');
const pool = require('../config/db');

// El QR de cada contenedor es contenedor.codigo_qr: "ECO-" + 16 caracteres.
const depositoSchema = z
  .object({
    codigo_qr: z.string().trim().toUpperCase().regex(/^ECO-[A-Z0-9]{16}$/, 'codigo_qr inválido'),
    cantidad: z.number().int().min(1).max(50),
    id_escaneo: z.string().uuid(),
    // La app lo envía, pero por ahora se IGNORA: la fecha la fija el servidor.
    // Si se usara la del cliente, se podría "retroceder" el reloj para saltarse el límite diario.
    // Se tomará en cuenta (con tope) cuando exista la cola offline.
    fecha_escaneo: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

/**
 * Registra el depósito llamando a la función SQL registrar_deposito (una sola transacción:
 * depósito + puntos + insignias). El usuario sale del token de Firebase, nunca del cuerpo.
 */
async function registrarDepositoQR(idAuth, { codigo_qr, cantidad, id_escaneo }) {
  const { rows: usuarios } = await pool.query('SELECT id_usuario FROM usuario WHERE id_auth = $1', [idAuth]);
  if (!usuarios[0]) return { estado: 'perfil_no_encontrado' };

  try {
    const { rows } = await pool.query(
      `SELECT public.registrar_deposito($1::integer, $2::varchar, $3::integer, $4::uuid, (NOW() AT TIME ZONE 'UTC')) AS r`,
      [usuarios[0].id_usuario, codigo_qr, cantidad, id_escaneo]
    );
    const r = rows[0].r; // jsonb: pg lo entrega ya como objeto
    if (r.ok) return { estado: 'ok', deposito: r };
    return { estado: 'rechazado', error: String(r.error).toLowerCase() };
  } catch (err) {
    // Mismo id_escaneo usado por dos usuarios a la vez (la función ya cubre el caso normal).
    if (err.code === '23505') return { estado: 'rechazado', error: 'escaneo_ya_registrado' };
    throw err;
  }
}

/**
 * Resumen del día (hora de Chile) para que la app muestre el límite y calcule la vista previa de puntos.
 * Misma ventana de día que usa registrar_deposito.
 */
async function resumenDiario(idAuth) {
  const { rows: usuarios } = await pool.query('SELECT id_usuario FROM usuario WHERE id_auth = $1', [idAuth]);
  if (!usuarios[0]) return null;

  const { rows } = await pool.query(
    `WITH v AS (SELECT date_trunc('day', NOW() AT TIME ZONE 'America/Santiago') AS ini)
     SELECT
       COALESCE((SELECT valor FROM configuracion_sistema WHERE clave = 'max_botellas_por_dia'), 10) AS limite,
       COALESCE((SELECT valor FROM configuracion_sistema WHERE clave = 'ecopoints_por_botella'), 5) AS pts,
       (SELECT COALESCE(SUM(d.cantidad_premiada), 0)::int
          FROM deposito_residuo d, v
         WHERE d.id_usuario = $1
           AND d.fecha_escaneo_offline >= (v.ini AT TIME ZONE 'America/Santiago') AT TIME ZONE 'UTC'
           AND d.fecha_escaneo_offline <  ((v.ini + interval '1 day') AT TIME ZONE 'America/Santiago') AT TIME ZONE 'UTC'
       ) AS premiadas`,
    [usuarios[0].id_usuario]
  );
  const limite = Number(rows[0].limite);
  const premiadas = Number(rows[0].premiadas);
  return {
    limite_diario: limite,
    premiadas_hoy: premiadas,
    restantes_hoy: Math.max(limite - premiadas, 0),
    ecopoints_por_botella: Number(rows[0].pts),
  };
}

module.exports = { depositoSchema, registrarDepositoQR, resumenDiario };
