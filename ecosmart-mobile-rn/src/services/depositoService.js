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

module.exports = { depositoSchema, registrarDepositoQR };
