// Consultas de SOLO LECTURA a Supabase desde la terminal de VS Code.
// Uso: node scripts/consultar.js <comando> [argumentos]   (sin argumentos muestra la ayuda)
require('dotenv').config();
const pool = require('../src/config/db');

const TZ = 'America/Santiago';
const local = (d) => d.toLocaleString('sv-SE', { timeZone: TZ }); // 2026-10-27 05:15:41
const entero = (v, def) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : def);

const COMANDOS = {
  conexion: {
    uso: 'conexion',
    desc: 'Comprueba la conexion con la base de datos',
    consulta: () => ["SELECT current_database() AS base, current_user AS usuario, 'conexion OK' AS estado"],
  },
  hora: {
    uso: 'hora',
    desc: 'Hora de la BD en UTC y en Santiago',
    consulta: () => [
      `SELECT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS utc,
              to_char(NOW() AT TIME ZONE 'America/Santiago', 'YYYY-MM-DD HH24:MI:SS') AS santiago`,
    ],
  },
  tablas: {
    uso: 'tablas',
    desc: 'Tablas de public, RLS y filas aproximadas',
    consulta: () => [
      `SELECT c.relname AS tabla, c.relrowsecurity AS rls, c.reltuples::bigint AS filas_aprox
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname`,
    ],
  },
  contenedores: {
    uso: 'contenedores',
    desc: 'Estado actual de los contenedores',
    consulta: () => [
      `SELECT id_contenedor, porcentaje_llenado, estado_operativo, fecha_ultima_lectura
         FROM contenedor ORDER BY id_contenedor`,
    ],
  },
  lecturas: {
    uso: 'lecturas [id] [limite]',
    desc: 'Historial de lecturas de un contenedor (por defecto 1 y 10)',
    consulta: (id, limite) => [
      `SELECT id_lectura, id_contenedor, porcentaje_llenado, fecha_lectura, fecha_recepcion
         FROM lectura WHERE id_contenedor = $1 ORDER BY id_lectura DESC LIMIT $2`,
      [entero(id, 1), entero(limite, 10)],
    ],
  },
  alertas: {
    uso: 'alertas [pendiente|resuelta|duplicada]',
    desc: 'Alertas de llenado (todas si no indicas estado)',
    consulta: (estado) => [
      `SELECT id_alerta, id_contenedor, estado_alerta, porcentaje_disparo, fecha_generacion, fecha_resolucion
         FROM alerta_llenado WHERE ($1::text IS NULL OR estado_alerta = $1)
        ORDER BY id_alerta DESC LIMIT 20`,
      [estado || null],
    ],
  },
  reportes: {
    uso: 'reportes',
    desc: 'Ultimos reportes de anomalias',
    consulta: () => [
      `SELECT id_reporte, id_contenedor, tipo_anomalia, estado_revision, fecha_reporte
         FROM reporte_anomalia ORDER BY id_reporte DESC LIMIT 20`,
    ],
  },
  usuarios: {
    uso: 'usuarios',
    desc: 'Usuarios y saldo de EcoPoints (sin RUT ni correo)',
    consulta: () => [
      `SELECT id_usuario, nombre_completo, saldo_ecopoints, fecha_registro
         FROM usuario ORDER BY id_usuario LIMIT 20`,
    ],
  },
  sql: {
    uso: 'sql "SELECT ..."',
    desc: 'Consulta libre entre comillas (solo lectura)',
    consulta: (q) => [q],
  },
};

function ayuda() {
  console.log('Uso: node scripts/consultar.js <comando> [argumentos]');
  console.log('');
  for (const c of Object.values(COMANDOS)) console.log(`  ${c.uso.padEnd(40)} ${c.desc}`);
}

async function ejecutar(nombre, args) {
  const cmd = COMANDOS[nombre];
  if (!cmd) return ayuda();
  const [sql, params = []] = cmd.consulta(...args);
  if (!sql) return console.log('Falta la consulta SQL entre comillas.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY'); // desde este script es imposible modificar datos
    const res = await client.query(sql, params);
    await client.query('ROLLBACK');
    const r = Array.isArray(res) ? res[res.length - 1] : res;
    const filas = r.rows.map((f) =>
      Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v instanceof Date ? local(v) : v]))
    );
    console.table(filas);
    console.log(`${filas.length} fila(s). Fechas en hora de Santiago.`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

const [nombre, ...args] = process.argv.slice(2);
ejecutar(nombre, args)
  .catch((err) => {
    console.error('Error:', err.message);
    if (['ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'].includes(err.code)) {
      console.error('No se alcanzo el servidor. Usa la cadena "Session pooler" de Supabase (boton Connect) en DATABASE_URL.');
    }
    process.exitCode = 1;
  })
  .finally(() => pool.end());