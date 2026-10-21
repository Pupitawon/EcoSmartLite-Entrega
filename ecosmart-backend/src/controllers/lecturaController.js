const { lecturaSchema, registrarLectura } = require('../services/lecturaService');

/**
 * Valida y guarda una lectura. Lo comparten:
 *  - POST /api/lecturas             (contrato nuevo, responde 201)
 *  - PUT  /api/contenedores/:id/nivel (ruta antigua del ESP32/simulación, responde 200)
 */
async function aplicarLectura(input, res, next, { okStatus = 201, conMensaje = false } = {}) {
  const parsed = lecturaSchema.safeParse(input);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'validacion',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  try {
    const r = await registrarLectura(parsed.data);
    if (r.estado === 'no_encontrado') return res.status(404).json({ error: 'contenedor_no_encontrado' });
    if (r.estado === 'obsoleta') {
      return res.status(200).json({ recibida: false, motivo: 'lectura_mas_antigua_que_la_registrada' });
    }
    return res.status(okStatus).json({
      ...(conMensaje ? { mensaje: 'Lectura actualizada' } : {}),
      recibida: true,
      alerta_creada: r.alertaCreada,
      alerta_resuelta: r.alertaResuelta,
      contenedor: r.contenedor,
    });
  } catch (err) {
    return next(err);
  }
}

const crearLectura = (req, res, next) => aplicarLectura(req.body, res, next);

module.exports = { aplicarLectura, crearLectura };
