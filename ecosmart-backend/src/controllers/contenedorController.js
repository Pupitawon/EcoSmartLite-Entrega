const pool = require('../config/db');

// Obtener todos los contenedores con su tipo de material
const getContenedores = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id_contenedor, 
        c.latitud, 
        c.longitud, 
        c.porcentaje_llenado, 
        c.estado_operativo, 
        c.fecha_ultima_lectura,
        m.nombre_material
      FROM contenedor c
      LEFT JOIN tipo_material m ON c.id_material = m.id_material
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener contenedores:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

// Actualizar porcentaje de llenado (Para la lectura del ESP32 o Simulación)
const updateNivelLlenado = async (req, res) => {
  const { id } = req.params;
  const { porcentaje_llenado } = req.body;

  try {
    let estado_operativo = 'disponible';
    if (porcentaje_llenado >= 80) estado_operativo = 'critico';
    else if (porcentaje_llenado >= 50) estado_operativo = 'atencion';

    const query = `
      UPDATE contenedor 
      SET porcentaje_llenado = $1, estado_operativo = $2, fecha_ultima_lectura = NOW() 
      WHERE id_contenedor = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [porcentaje_llenado, estado_operativo, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contenedor no encontrado' });
    }

    // Generar alerta de llenado si supera el 80%
    if (porcentaje_llenado >= 80) {
      await pool.query(
        'INSERT INTO alerta_llenado (id_contenedor, estado_alerta) VALUES ($1, $2)',
        [id, 'pendiente']
      );
    }

    res.json({ mensaje: 'Lectura actualizada', contenedor: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar llenado:', err.message);
    res.status(500).json({ error: 'Error al actualizar el contenedor' });
  }
};

module.exports = { getContenedores, updateNivelLlenado };