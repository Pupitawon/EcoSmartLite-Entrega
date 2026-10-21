const { z } = require('zod');
const pool = require('../config/db');
const config = require('../config/config');
const bus = require('../events/bus');

const UTC_NOW = "(NOW() AT TIME ZONE 'UTC')";

// ---------------------------------------------------------------------------
// Validación de la lectura que envía el sensor (ESP32) o la app
// ---------------------------------------------------------------------------
const lecturaSchema = z
  .object({
    id_contenedor: z.number().int().positive(),
    porcentaje_llenado: z.number().min(0).max(100),
    // Opcional: cuándo se midió (ISO 8601). Si no viene, se usa la hora del servidor.
    fecha_lectura: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .refine((d) => !d.fecha_lectura || new Date(d.fecha_lectura).getTime() <= Date.now() + 5 * 60_000, {
    message: 'fecha_lectura no puede estar en el futuro',
    path: ['fecha_lectura'],
  });

// Mismos estados operativos que ya usaba el backend: disponible / atencion / critico.
function estadoOperativo(p) {
  if (p >= config.umbralAlerta) return 'critico';
  if (p >= 50) return 'atencion';
  return 'disponible';
}

// ---------------------------------------------------------------------------
// Lectura de contenedores y alertas
// ---------------------------------------------------------------------------
const SELECT_CONTENEDOR = `
  SELECT c.id_contenedor, c.id_material, m.nombre_material, c.latitud, c.longitud,
         c.porcentaje_llenado, c.fecha_ultima_lectura, c.estado_operativo,
         EXISTS (SELECT 1 FROM alerta_llenado a
                  WHERE a.id_contenedor = c.id_contenedor AND a.estado_alerta = 'pendiente') AS alerta_activa
    FROM contenedor c
    LEFT JOIN tipo_material m ON m.id_material = c.id_material`;

function aDTO(row) {
  const ult = row.fecha_ultima_lectura ? new Date(row.fecha_ultima_lectura) : null;
  const limiteMs = config.sinReporteHoras * 3_600_000;
  return {
    id_contenedor: row.id_contenedor,
    id_material: row.id_material,
    nombre_material: row.nombre_material,
    latitud: row.latitud === null ? null : Number(row.latitud),
    longitud: row.longitud === null ? null : Number(row.longitud),
    porcentaje_llenado: Number(row.porcentaje_llenado),
    fecha_ultima_lectura: ult ? ult.toISOString() : null,
    estado_operativo: row.estado_operativo,
    alerta_activa: Boolean(row.alerta_activa),
    // Señal "contenedor sin reporte": nunca reportó, o pasó más del límite sin lectura.
    sin_reporte: !ult || Date.now() - ult.getTime() > limiteMs,
  };
}

async function listarContenedores() {
  const { rows } = await pool.query(`${SELECT_CONTENEDOR} ORDER BY c.id_contenedor`);
  return rows.map(aDTO);
}

const ESTADOS_ALERTA = ['pendiente', 'resuelta', 'duplicada'];

async function listarAlertas(estado) {
  const filtro = ESTADOS_ALERTA.includes(estado) ? estado : null;
  const { rows } = await pool.query(
    `SELECT a.id_alerta, a.id_contenedor, a.fecha_generacion, a.estado_alerta,
            a.porcentaje_disparo, a.fecha_resolucion,
            c.porcentaje_llenado, c.latitud, c.longitud, m.nombre_material
       FROM alerta_llenado a
       JOIN contenedor c ON c.id_contenedor = a.id_contenedor
       LEFT JOIN tipo_material m ON m.id_material = c.id_material
      WHERE ($1::text IS NULL OR a.estado_alerta = $1)
      ORDER BY a.fecha_generacion DESC NULLS LAST, a.id_alerta DESC
      LIMIT 200`,
    [filtro]
  );
  return rows.map((r) => ({
    id_alerta: r.id_alerta,
    id_contenedor: r.id_contenedor,
    nombre_material: r.nombre_material,
    estado_alerta: r.estado_alerta,
    fecha_generacion: r.fecha_generacion ? new Date(r.fecha_generacion).toISOString() : null,
    fecha_resolucion: r.fecha_resolucion ? new Date(r.fecha_resolucion).toISOString() : null,
    porcentaje_disparo: r.porcentaje_disparo === null ? null : Number(r.porcentaje_disparo),
    porcentaje_llenado: Number(r.porcentaje_llenado),
    latitud: r.latitud === null ? null : Number(r.latitud),
    longitud: r.longitud === null ? null : Number(r.longitud),
  }));
}

// ---------------------------------------------------------------------------
// Registrar una lectura + regla de alerta (todo en UNA transacción)
//  - >= umbral: crea alerta 'pendiente' solo si no hay otra pendiente para ese contenedor.
//    La garantía "sin duplicados" es el índice único parcial de sql/01_migracion_lecturas.sql.
//  - <  umbral: la alerta pendiente pasa a 'resuelta'; si vuelve a subir, nace una nueva.
// ---------------------------------------------------------------------------
async function registrarLectura({ id_contenedor, porcentaje_llenado, fecha_lectura }) {
  const fecha = fecha_lectura ? new Date(fecha_lectura) : new Date();
  const client = await pool.connect();
  let resultado;
  try {
    await client.query('BEGIN');
    // Todos los TIMESTAMP de esta transacción se escriben en UTC.
    await client.query("SET LOCAL TIME ZONE 'UTC'");

    // FOR UPDATE serializa lecturas simultáneas del mismo contenedor.
    const { rows } = await client.query(
      'SELECT fecha_ultima_lectura FROM contenedor WHERE id_contenedor = $1 FOR UPDATE',
      [id_contenedor]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return { estado: 'no_encontrado' };
    }
    const previa = rows[0].fecha_ultima_lectura;
    if (previa && fecha < new Date(previa)) {
      // Llegó una lectura más antigua que la ya guardada (típico al sincronizar offline): se ignora.
      await client.query('ROLLBACK');
      return { estado: 'obsoleta' };
    }

    await client.query(
      `UPDATE contenedor
          SET porcentaje_llenado = $2,
              estado_operativo = $3,
              fecha_ultima_lectura = ($4::timestamptz AT TIME ZONE 'UTC')
        WHERE id_contenedor = $1`,
      [id_contenedor, porcentaje_llenado, estadoOperativo(porcentaje_llenado), fecha.toISOString()]
    );

    let alertaCreada = false;
    let alertaResuelta = false;
    if (porcentaje_llenado >= config.umbralAlerta) {
      const r = await client.query(
        `INSERT INTO alerta_llenado (id_contenedor, fecha_generacion, estado_alerta, porcentaje_disparo)
         VALUES ($1, ${UTC_NOW}, 'pendiente', $2)
         ON CONFLICT (id_contenedor) WHERE estado_alerta = 'pendiente' DO NOTHING`,
        [id_contenedor, porcentaje_llenado]
      );
      alertaCreada = r.rowCount === 1;
    } else {
      const r = await client.query(
        `UPDATE alerta_llenado SET estado_alerta = 'resuelta', fecha_resolucion = ${UTC_NOW}
          WHERE id_contenedor = $1 AND estado_alerta = 'pendiente'`,
        [id_contenedor]
      );
      alertaResuelta = r.rowCount > 0;
    }

    const { rows: fila } = await client.query(`${SELECT_CONTENEDOR} WHERE c.id_contenedor = $1`, [id_contenedor]);
    await client.query('COMMIT');
    resultado = { estado: 'ok', alertaCreada, alertaResuelta, contenedor: aDTO(fila[0]) };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  // Se avisa al panel solo cuando la transacción ya quedó confirmada.
  bus.emit('lectura', {
    contenedor: resultado.contenedor,
    alerta_creada: resultado.alertaCreada,
    alerta_resuelta: resultado.alertaResuelta,
  });
  return resultado;
}

module.exports = { lecturaSchema, registrarLectura, listarContenedores, listarAlertas, aDTO };
