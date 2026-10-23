const pool = require('../src/config/db');

async function consultarTodasLasTablasSQL() {
  console.log('Consultando todas las tablas usando solo Node.js (pg)...\n');

  const tablas = [
    'usuario',
    'insignia',
    'logro_usuario',
    'tipo_material',
    'contenedor',
    'alerta_llenado',
    'deposito_residuo',
    'retiro_historial',
    'reporte_anomalia'
  ];

  try {
    for (const tabla of tablas) {
      const resultado = await pool.query(`SELECT * FROM ${tabla};`);
      console.log(`Tabla [${tabla}] (${resultado.rowCount} registros obtenidos):`);
      console.table(resultado.rows);
    }
  } catch (error) {
    console.error('Error ejecutando consultas SQL:', error.message);
  } finally {
    await pool.end();
  }
}

consultarTodasLasTablasSQL();