// Comprueba que la API REST de Supabase NO entrega datos con la clave publica (anon).
// Requiere SUPABASE_URL y SUPABASE_ANON_KEY en .env.   Uso: node scripts/pruebaRLS.js
// Ojo: una tabla vacia tambien muestra 0 filas; la prueba solo es concluyente en tablas con datos.
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const tablas = ['usuario', 'lectura', 'alerta_llenado', 'contenedor', 'deposito_residuo', 'reporte_anomalia'];

(async () => {
  for (const t of tablas) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const cuerpo = await r.json().catch(() => null);
    const filas = Array.isArray(cuerpo) ? cuerpo.length : '-';
    const veredicto = filas === 0 ? 'PROTEGIDA' : filas > 0 ? 'EXPUESTA (habilita RLS)' : 'revisar';
    console.log(`${t.padEnd(20)} HTTP ${r.status}  filas visibles: ${filas}  ${veredicto}`);
  }
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});