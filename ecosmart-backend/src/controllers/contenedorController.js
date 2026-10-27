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

module.exports = { getContenedores, updateNivelLlenado };
