const { ordenSchema, listarOrdenes, crearOrden, avanzarOrden, eliminarOrden } = require('../services/ordenService');

const detalles = (error) => error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
const idValido = (v) => {
  const id = Number(v);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Todas estas rutas son solo para administradores (ver ordenRoutes.js).
const getOrdenes = async (req, res) => {
  try {
    res.json(await listarOrdenes());
  } catch (err) {
    console.error('Error al obtener órdenes:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

const postOrden = async (req, res) => {
  const parsed = ordenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'datos_invalidos', detalles: detalles(parsed.error) });
  try {
    const r = await crearOrden(req.user.uid, parsed.data);
    if (r.estado === 'contenedor_no_existe') return res.status(404).json({ error: 'contenedor_no_existe' });
    res.status(201).json({ orden: r.orden });
  } catch (err) {
    console.error('Error al crear orden:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

const patchAvanzar = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(422).json({ error: 'id_invalido' });
  try {
    const r = await avanzarOrden(id);
    if (r.estado === 'no_encontrada') return res.status(404).json({ error: 'orden_no_encontrada' });
    if (r.estado === 'ya_cerrada') return res.status(409).json({ error: 'orden_cerrada' });
    res.json({ orden: r.orden });
  } catch (err) {
    console.error('Error al avanzar orden:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

const deleteOrden = async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(422).json({ error: 'id_invalido' });
  try {
    if (!(await eliminarOrden(id))) return res.status(404).json({ error: 'orden_no_encontrada' });
    res.status(204).end();
  } catch (err) {
    console.error('Error al eliminar orden:', err.message);
    res.status(500).json({ error: 'error_interno' });
  }
};

module.exports = { getOrdenes, postOrden, patchAvanzar, deleteOrden };
