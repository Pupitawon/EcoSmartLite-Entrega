const { z } = require('zod');
const pool = require('../config/db');
const bus = require('../events/bus');

const UTC_NOW = "(NOW() AT TIME ZONE 'UTC')";

// Mismos ids que ANOMALY_TYPES en la app móvil.
const TIPOS_ANOMALIA = ['danado', 'residuos_incorrectos', 'otro'];
const ESTADOS_REVISION = ['pendiente', 'en_revision', 'resuelto', 'descartado'];

const reporteSchema = z
  .object({
    id_contenedor: z.number().int().positive(),
    tipo_anomalia: z.enum(TIPOS_ANOMALIA),
    descripcion: z.string().trim().max(500).optional().default(''),
  })
  .strict();

const revisionSchema = z.object({ estado_revision: z.enum(ESTADOS_REVISION) }).strict();

// Si un listener del bus falla, el reporte ya está guardado: no se debe responder 500 ni provocar reintentos.
function emitirSeguro(evento, datos) {
  try {
    bus.emit(evento, datos);
  } catch (e) {
    console.error(`Error en listener de ${evento}:`, e);
  }
}

// El panel es público: no se exponen nombre, RUT ni correo de quien reporta.
const SELECT_REPORTE = `
  SELECT r.id_reporte, r.id_contenedor, r.tipo_anomalia, r.descripcion_problema,
         r.fecha_reporte, r.estado_revision, r.fecha_revision, m.nombre_material
    FROM reporte_anomalia r
    JOIN contenedor c ON c.id_contenedor = r.id_contenedor
    LEFT JOIN tipo_material m ON m.id_material = c.id_material`;

function aDTO(row) {
  return {
    id_reporte: row.id_reporte,
    id_contenedor: row.id_contenedor,
    nombre_material: row.nombre_material ?? null,
    tipo_anomalia: row.tipo_anomalia,
    descripcion: row.descripcion_problema,
    fecha_reporte: row.fecha_reporte ? new Date(row.fecha_reporte).toISOString() : null,
    estado_revision: row.estado_revision,
    fecha_revision: row.fecha_revision ? new Date(row.fecha_revision).toISOString() : null,
  };
}

async function buscarReporte(id) {
  const { rows } = await pool.query(`${SELECT_REPORTE} WHERE r.id_reporte = $1`, [id]);
  return rows[0] ? aDTO(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Crear: el usuario sale del token de Firebase (id_auth), nunca del cuerpo.
// ---------------------------------------------------------------------------
async function crearReporte(idAuth, datos) {
  const { rows: usuarios } = await pool.query('SELECT id_usuario FROM usuario WHERE id_auth = $1', [idAuth]);
  if (!usuarios[0]) return { estado: 'perfil_no_encontrado' };

  let reporte;
  try {
    const { rows } = await pool.query(
      `INSERT INTO reporte_anomalia (id_usuario, id_contenedor, tipo_anomalia, descripcion_problema, fecha_reporte, estado_revision)
       VALUES ($1, $2, $3, $4, ${UTC_NOW}, 'pendiente')
       RETURNING id_reporte`,
      [usuarios[0].id_usuario, datos.id_contenedor, datos.tipo_anomalia, datos.descripcion]
    );
    reporte = await buscarReporte(rows[0].id_reporte);
  } catch (err) {
    if (err.code === '23503') return { estado: 'contenedor_no_existe' };
    throw err;
  }

  emitirSeguro('reporte', reporte); // el stream SSE lo reenvía al panel
  return { estado: 'creado', reporte };
}

async function listarReportes(estado) {
  const filtro = ESTADOS_REVISION.includes(estado) ? estado : null;
  const { rows } = await pool.query(
    `${SELECT_REPORTE}
      WHERE ($1::text IS NULL OR r.estado_revision = $1)
      ORDER BY r.fecha_reporte DESC
      LIMIT 200`,
    [filtro]
  );
  return rows.map(aDTO);
}

async function cambiarEstado(id, estadoRevision) {
  const { rowCount } = await pool.query(
    `UPDATE reporte_anomalia
        SET estado_revision = $1::text,
            fecha_revision = CASE WHEN $1::text = 'pendiente' THEN NULL ELSE ${UTC_NOW} END
      WHERE id_reporte = $2`,
    [estadoRevision, id]
  );

  if (!rowCount) return null;
  const reporte = await buscarReporte(id);
  emitirSeguro('reporte', reporte);
  return reporte;
}

module.exports = {
  reporteSchema,
  revisionSchema,
  crearReporte,
  listarReportes,
  cambiarEstado,
  TIPOS_ANOMALIA,
  ESTADOS_REVISION,
};