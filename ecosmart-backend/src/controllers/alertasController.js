const { listarAlertas } = require('../services/lecturaService');

// Obtener alertas pendientes para Innova Recicla
const getAlertasPendientes = async (req, res) => {
  try {
    res.json(await listarAlertas('pendiente'));
  } catch (err) {
    console.error('Error al obtener alertas:', err.message);
    res.status(500).json({ error: 'Error en la consulta' });
  }
};

// Alertas de cualquier estado (el panel muestra pendientes + historial reciente).
const getAlertas = async (req, res) => {
  try {
    res.json(await listarAlertas(req.query.estado));
  } catch (err) {
    console.error('Error al obtener alertas:', err.message);
    res.status(500).json({ error: 'Error en la consulta' });
  }
};

module.exports = { getAlertasPendientes, getAlertas };
