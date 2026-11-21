const { z } = require('zod');
const pool = require('../config/db');
const { listarContenedores } = require('../services/lecturaService');
const { aplicarLectura } = require('./lecturaController');

// Obtener todos los contenedores con su tipo de material, último % de llenado,
// si tienen alerta pendiente (alerta_activa) y si están sin reporte (sin_reporte).
const getContenedores = async (req, res) => {
  try {
    res.json(await listarContenedores());
  } catch (err) {
    console.error('Error al obtener contenedores:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// Actualizar porcentaje de llenado (Para la lectura del ESP32 o Simulación).
// Misma lógica que POST /api/lecturas: valida, guarda la lectura y aplica la regla de alerta ≥ 80 %
// sin duplicados. La ruta exige credencial (ver contenedorRoutes.js).
const updateNivelLlenado = (req, res, next) =>
  aplicarLectura(
    {
      id_contenedor: Number(req.params.id),
      porcentaje_llenado: req.body?.porcentaje_llenado,
      fecha_lectura: req.body?.fecha_lectura,
    },
    res,
    next,
    { okStatus: 200, conMensaje: true }
  );

// Estado de conexión de cada sensor. Con ?solo_problemas=1 devuelve solo los retrasados o sin conexión.
const getEstadoConexion = async (req, res) => {
  try {
    const todos = await listarContenedores();
    const lista = todos
      .filter((c) => req.query.solo_problemas !== '1' || c.estado_conexion !== 'en_linea')
      .map((c) => ({
        id_contenedor: c.id_contenedor,
        nombre_material: c.nombre_material,
        fecha_ultima_lectura: c.fecha_ultima_lectura,
        minutos_sin_lectura: c.minutos_sin_lectura,
        estado_conexion: c.estado_conexion,
      }));
    res.json(lista);
  } catch (err) {
    console.error('Error al obtener el estado de conexión:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// Nueva posición de un contenedor (el admin lo trasladó o corrige su ubicación). (0, 0) se rechaza: es "sin ubicación".
const ubicacionSchema = z
  .object({
    latitud: z.number().min(-90).max(90),
    longitud: z.number().min(-180).max(180),
  })
  .strict()
  .refine((u) => !(u.latitud === 0 && u.longitud === 0), { message: 'Ubicación (0, 0) no válida', path: ['latitud'] });

const cambiarUbicacion = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(422).json({ error: 'id_invalido' });
  const parsed = ubicacionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'datos_invalidos',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  try {
    const r = await pool.query('UPDATE contenedor SET latitud = $2, longitud = $3 WHERE id_contenedor = $1', [
      id,
      parsed.data.latitud,
      parsed.data.longitud,
    ]);
    if (!r.rowCount) return res.status(404).json({ error: 'contenedor_no_encontrado' });
    const contenedor = (await listarContenedores()).find((c) => c.id_contenedor === id);
    res.json({ contenedor });
  } catch (err) {
    console.error('Error al cambiar la ubicación:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

module.exports = { getContenedores, updateNivelLlenado, getEstadoConexion, cambiarUbicacion };
