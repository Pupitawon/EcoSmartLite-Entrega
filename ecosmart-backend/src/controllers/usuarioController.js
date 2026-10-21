const pool = require('../config/db');

// Registrar depósito de residuo y abonar EcoPoints
const registrarDeposito = async (req, res) => {
  const { id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados } = req.body;

  try {
    // 1. Insertar en la tabla deposito_residuo
    const queryDeposito = `
      INSERT INTO deposito_residuo (id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const depositoResult = await pool.query(queryDeposito, [
      id_usuario, 
      id_contenedor, 
      codigo_qr_escaneado, 
      ecopoints_otorgados || 10
    ]);

    // 2. Sumar puntos al saldo del usuario
    const queryUsuario = `
      UPDATE usuario 
      SET saldo_ecopoints = saldo_ecopoints + $1 
      WHERE id_usuario = $2 
      RETURNING id_usuario, nombre_completo, saldo_ecopoints
    `;
    const usuarioResult = await pool.query(queryUsuario, [ecopoints_otorgados || 10, id_usuario]);

    res.json({
      mensaje: '¡Depósito registrado con éxito!',
      deposito: depositoResult.rows[0],
      usuario: usuarioResult.rows[0]
    });
  } catch (err) {
    console.error('Error al registrar depósito:', err.message);
    res.status(500).json({ error: 'Error en el registro del depósito' });
  }
};

module.exports = { registrarDeposito };