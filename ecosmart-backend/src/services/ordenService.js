const { z } = require('zod');
const pool = require('../config/db');

const UTC_NOW = "(NOW() AT TIME ZONE 'UTC')";

// Mismos valores que COLUMNAS_OT, TIPOS_OT y PRIORIDADES en la app móvil (src/admin/utils.js).
const ESTADOS_OT = ['Pendiente', 'Asignada', 'En terreno', 'Ejecutada', 'Verificada', 'Cerrada'];
const TIPOS_OT = [
  'Vaciado',
  'Inspección',
  'Revisión de conectividad',
  'Reemplazo de sensor',
  'Limpieza',
  'Recalibración',
  'Reparación',
];
const PRIORIDADES = ['Alta', 'Media', 'Baja'];

const ordenSchema = z
  .object({
    id_contenedor: z.number().int().positive(),
    tipo: z.enum(TIPOS_OT),
    prioridad: z.enum(PRIORIDADES),
    tecnico: z.string().trim().min(1).max(60),
  })
  .strict();

const COLUMNAS = 'id_orden, id_contenedor, tipo, prioridad, tecnico, estado, fecha_creacion, fecha_actualizacion';

function aDTO(row) {
  return {
    id: `OT-${row.id_orden}`,
    id_orden: row.id_orden,
    contenedor: row.id_contenedor,
    tipo: row.tipo,
    prioridad: row.prioridad,
    tecnico: row.tecnico,
    estado: row.estado,
    creada: new Date(row.fecha_creacion).toISOString(),
    actualizada: new Date(row.fecha_actualizacion).toISOString(),
  };
}

async function listarOrdenes() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM orden_trabajo ORDER BY id_orden DESC LIMIT 500`);
  return rows.map(aDTO);
}

async function crearOrden(uid, datos) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO orden_trabajo (id_contenedor, tipo, prioridad, tecnico, estado, creada_por, fecha_creacion, fecha_actualizacion)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5, ${UTC_NOW}, ${UTC_NOW})
       RETURNING ${COLUMNAS}`,
      [datos.id_contenedor, datos.tipo, datos.prioridad, datos.tecnico, uid]
    );
    return { estado: 'creada', orden: aDTO(rows[0]) };
  } catch (err) {
    if (err.code === '23503') return { estado: 'contenedor_no_existe' };
    throw err;
  }
}

/** Pasa la orden al siguiente estado en una sola sentencia (dos administradores a la vez no se saltan pasos). */
async function avanzarOrden(id) {
  const { rows } = await pool.query(
    `UPDATE orden_trabajo
        SET estado = ($2::text[])[array_position($2::text[], estado::text) + 1],
            fecha_actualizacion = ${UTC_NOW}
      WHERE id_orden = $1 AND estado <> 'Cerrada'
      RETURNING ${COLUMNAS}`,
    [id, ESTADOS_OT]
  );
  if (rows[0]) return { estado: 'avanzada', orden: aDTO(rows[0]) };
  const existe = await pool.query('SELECT 1 FROM orden_trabajo WHERE id_orden = $1', [id]);
  return { estado: existe.rowCount ? 'ya_cerrada' : 'no_encontrada' };
}

async function eliminarOrden(id) {
  const { rowCount } = await pool.query('DELETE FROM orden_trabajo WHERE id_orden = $1', [id]);
  return rowCount > 0;
}

module.exports = { ordenSchema, listarOrdenes, crearOrden, avanzarOrden, eliminarOrden, ESTADOS_OT, TIPOS_OT, PRIORIDADES };
