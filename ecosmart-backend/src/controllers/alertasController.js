const pool = require('../config/db');

// Obtener alertas pendientes para Innova Recicla
const getAlertasPendientes = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id_alerta, 
        a.fecha_generacion, 
        a.estado_alerta,
        c.id_contenedor,
        c.porcentaje_llenado,
        c.latitud,
        c.longitud
      FROM alerta_llenado a
      JOIN contenedor c ON a.id_contenedor = c.id_contenedor
      WHERE a.estado_alerta = 'pendiente'
      ORDER BY a.fecha_generacion DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener alertas:', err.message);
    res.status(500).json({ error: 'Error en la consulta' });
  }
};

module.exports = { getAlertasPendientes };