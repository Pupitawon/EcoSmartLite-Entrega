const { reporteSchema, revisionSchema, crearReporte, listarReportes, cambiarEstado } = require('../services/reporteService');

const detalles = (error) => error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));

// Ciudadano autenticado reporta una anomalía en un contenedor (RF-05).
const postReporte = async (req, res) => {
  const parsed = reporteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'datos_invalidos', detalles: detalles(parsed.error) });
  try {
    const r = await crearReporte(req.user.uid, parsed.data);
    if (r.estado === 'perfil_no_encontrado') return res.status(404).json({ error: 'perfil_no_encontrado' });
    if (r.estado === 'contenedor_no_existe') return res.status(404).json({ error: 'contenedor_no_existe' });
    res.status(201).json({ reporte: r.reporte });
  } catch (err) {
    console.error('Error al crear reporte:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

// Reportes de cualquier estado (?estado=pendiente|en_revision|resuelto|descartado).
const getReportes = async (req, res) => {
  try {
    res.json(await listarReportes(req.query.estado));
  } catch (err) {
    console.error('Error al obtener reportes:', err.message);
    res.status(500).json({ error: 'Error en la consulta' });
  }
};

// El panel cambia el estado de revisión de un reporte.
const patchReporte = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(422).json({ error: 'id_invalido' });
  const parsed = revisionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'datos_invalidos', detalles: detalles(parsed.error) });
  try {
    const reporte = await cambiarEstado(id, parsed.data.estado_revision);
    if (!reporte) return res.status(404).json({ error: 'reporte_no_encontrado' });
    res.json({ reporte });
  } catch (err) {
    console.error('Error al actualizar reporte:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

module.exports = { postReporte, getReportes, patchReporte };
