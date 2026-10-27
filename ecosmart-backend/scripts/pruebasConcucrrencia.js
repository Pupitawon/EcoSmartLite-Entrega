// Envia N lecturas de 90 % al mismo tiempo; debe quedar como maximo UNA alerta pendiente.
// Uso: node scripts/pruebaConcurrencia.js [id_contenedor=2] [cantidad=20]
// Lee INGEST_API_KEY desde .env (no hace falta pasar la clave por la terminal).
require('dotenv').config();

const base = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
const id = Number(process.argv[2] || 2);
const total = Number(process.argv[3] || 20);
const key = process.env.INGEST_API_KEY;

if (!key) {
  console.error('Falta INGEST_API_KEY en .env');
  process.exit(1);
}

async function enviar() {
  const r = await fetch(`${base}/api/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ id_contenedor: id, porcentaje_llenado: 90 }),
  });
  const cuerpo = await r.json().catch(() => ({}));
  return { status: r.status, creada: cuerpo.alerta_creada === true };
}

(async () => {
  const resultados = await Promise.all(Array.from({ length: total }, enviar));
  const codigos = {};
  for (const r of resultados) codigos[r.status] = (codigos[r.status] || 0) + 1;
  console.log('Codigos HTTP:', codigos);
  console.log('Alertas creadas en esta rafaga:', resultados.filter((r) => r.creada).length, '(debe ser 0 o 1)');
  console.log('Verifica en Supabase: SELECT count(*) FROM alerta_llenado WHERE id_contenedor = ' + id + " AND estado_alerta = 'pendiente';  -- debe dar 1");
})().catch((e) => {
  console.error('Error:', e.message, '(esta corriendo el servidor?)');
  process.exit(1);
});