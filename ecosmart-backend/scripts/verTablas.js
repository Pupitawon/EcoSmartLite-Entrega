const pool = require('../src/config/db');

// Lee el nombre de la tabla que pases desde la terminal
const tablaIngresada = process.argv[2];

// Lista de tablas válidas en tu proyecto
const tablasValidas = [
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

async function consultarTablaIndividual() {
  // Si no pasaste ningún parámetro, muestra las opciones disponibles
  if (!tablaIngresada) {
    console.log('Debes especificar el nombre de una tabla.\n');
    console.log('Ejemplo de uso: node scripts/verTabla.js contenedor\n');
    console.log('Tablas disponibles:', tablasValidas.join(', '));
    process.exit(1);
  }

  // Verifica que la tabla exista
  if (!tablasValidas.includes(tablaIngresada.toLowerCase())) {
    console.log(`La tabla "${tablaIngresada}" no existe en el proyecto.`);
    console.log('Tablas disponibles:', tablasValidas.join(', '));
    process.exit(1);
  }

  try {
    const resultado = await pool.query(`SELECT * FROM ${tablaIngresada};`);
    console.log(`\n Tabla [${tablaIngresada}] (${resultado.rowCount} registros encontrados):`);
    console.table(resultado.rows);
  } catch (error) {
    console.error(`Error al consultar la tabla ${tablaIngresada}:`, error.message);
  } finally {
    await pool.end();
  }
}

consultarTablaIndividual();