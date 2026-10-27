// Consulta a Supabase con el SDK (API REST). Usa SUPABASE_SERVICE_ROLE_KEY, que se salta el RLS.
require('dotenv').config();
const supabase = require('../src/config/supabase');

(async () => {
  const { data, error } = await supabase
    .from('contenedor')
    .select('id_contenedor, porcentaje_llenado, estado_operativo, fecha_ultima_lectura')
    .order('id_contenedor')
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  // Los TIMESTAMP sin zona llegan como texto en UTC (sin "Z"): se agrega la Z para convertir bien.
  const filas = data.map((f) => ({
    ...f,
    fecha_ultima_lectura: f.fecha_ultima_lectura
      ? new Date(f.fecha_ultima_lectura + 'Z').toLocaleString('sv-SE', { timeZone: 'America/Santiago' })
      : null,
  }));
  console.table(filas);
  console.log(`${filas.length} fila(s). Fechas en hora de Santiago.`);
})();