const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno para inicializar Supabase SDK');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

// --- CÓDIGO TEMPORAL DE PRUEBA ---
async function probarConsulta() {
  console.log('Conectando y consultando Supabase...');

  // Consulta los contenedores (o cambia 'contenedor' por el nombre de otra tabla)
  const { data, error } = await supabase
    .from('reporte_anomalia')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error en la consulta:', error.message);
  } else {
    console.log('Consulta exitosa! Resultado:');
    console.table(data); // Muestra la respuesta formateada como tabla
  }
}

// Ejecutar la prueba
probarConsulta();