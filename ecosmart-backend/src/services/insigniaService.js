const pool = require('../config/db');

// Zona horaria con la que se cuentan los días (igual que el límite diario de depósitos).
const ZONA = 'America/Santiago';

/**
 * Racha: días seguidos con al menos un depósito. La racha sigue "viva" si el último depósito fue hoy o ayer.
 * Recibe los días (YYYY-MM-DD, hora de Chile) con depósitos, de más reciente a más antiguo, y el día de hoy.
 */
function calcularRacha(dias, hoy) {
  const dia = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const UNO = 24 * 60 * 60 * 1000;
  if (!dias.length) return { actual: 0, maxima: 0 };

  // Racha máxima: recorre de más antiguo a más reciente.
  const asc = [...dias].reverse();
  let maxima = 1, corrida = 1;
  for (let i = 1; i < asc.length; i++) {
    corrida = dia(asc[i]) - dia(asc[i - 1]) === UNO ? corrida + 1 : 1;
    if (corrida > maxima) maxima = corrida;
  }

  // Racha actual: parte del día más reciente, solo si es hoy o ayer.
  let actual = 0;
  if (dia(hoy) - dia(dias[0]) <= UNO) {
    actual = 1;
    for (let i = 1; i < dias.length; i++) {
      if (dia(dias[i - 1]) - dia(dias[i]) === UNO) actual++;
      else break;
    }
  }
  return { actual, maxima };
}

// Logros por niveles (estilo Duolingo). No dependen de las tablas insignia/logro_usuario: se calculan
// con los depósitos del usuario. `niveles` son los valores que hay que alcanzar para subir de nivel.
const LOGROS = [
  { id: 'depositante', icono: 'recycle', titulo: 'Reciclador constante', unidad: 'depósitos', niveles: [1, 5, 15, 30, 60] },
  { id: 'racha', icono: 'flame', titulo: 'Racha imparable', unidad: 'días seguidos', niveles: [3, 7, 14, 30] },
  { id: 'botellas', icono: 'botella', titulo: 'Botellas recicladas', unidad: 'botellas', niveles: [10, 50, 150, 300, 600] },
];

/** Nivel de cada logro según `valores` ({ depositante, racha, botellas }) y avance hacia el nivel siguiente. */
function calcularLogros(valores) {
  return LOGROS.map((l) => {
    const valor = Math.max(0, Number(valores[l.id]) || 0);
    const nivel = l.niveles.filter((n) => valor >= n).length;
    const meta = l.niveles[nivel] ?? null; // null: ya está en el nivel máximo
    const base = nivel > 0 ? l.niveles[nivel - 1] : 0;
    return {
      id: l.id, icono: l.icono, titulo: l.titulo, unidad: l.unidad,
      niveles: l.niveles.map((requerido, i) => ({ nivel: i + 1, requerido, alcanzado: valor >= requerido })),
      valor, nivel, niveles_totales: l.niveles.length, meta,
      avance: meta === null ? 1 : (valor - base) / (meta - base),
    };
  });
}

/** Insignias del usuario (todas, con las desbloqueadas marcadas), avance hacia la siguiente y racha. */
async function resumenInsignias(idAuth) {
  const { rows: u } = await pool.query('SELECT id_usuario FROM usuario WHERE id_auth = $1', [idAuth]);
  if (!u[0]) return null;
  const idUsuario = u[0].id_usuario;

  const [{ rows: ins }, { rows: dep }, { rows: dias }, { rows: hoy }, { rows: bot }] = await Promise.all([
    pool.query(
      `SELECT i.id_insignia, i.nombre_insignia, i.descripcion, i.umbral_depositos, l.fecha_desbloqueo
         FROM insignia i
         LEFT JOIN logro_usuario l ON l.id_insignia = i.id_insignia AND l.id_usuario = $1
        ORDER BY i.umbral_depositos, i.id_insignia`,
      [idUsuario]
    ),
    pool.query('SELECT COUNT(*)::int AS n FROM deposito_residuo WHERE id_usuario = $1', [idUsuario]),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS dia FROM (
         SELECT DISTINCT (fecha_escaneo_offline AT TIME ZONE 'UTC' AT TIME ZONE '${ZONA}')::date AS d
           FROM deposito_residuo WHERE id_usuario = $1
       ) x ORDER BY d DESC`,
      [idUsuario]
    ),
    pool.query(`SELECT to_char((NOW() AT TIME ZONE '${ZONA}')::date, 'YYYY-MM-DD') AS hoy`),
    pool.query('SELECT COALESCE(SUM(cantidad_premiada), 0)::int AS n FROM deposito_residuo WHERE id_usuario = $1', [idUsuario]),
  ]);

  const depositos = dep[0].n;
  const insignias = ins.map((i) => ({
    id_insignia: i.id_insignia,
    nombre: i.nombre_insignia,
    descripcion: i.descripcion,
    umbral_depositos: i.umbral_depositos,
    desbloqueada: Boolean(i.fecha_desbloqueo),
    fecha_desbloqueo: i.fecha_desbloqueo,
  }));
  const siguiente = insignias.find((i) => !i.desbloqueada && i.umbral_depositos > depositos) || null;

  const racha = calcularRacha(dias.map((d) => d.dia), hoy[0].hoy);
  return {
    depositos,
    botellas: bot[0].n,
    logros: calcularLogros({ depositante: depositos, racha: racha.maxima, botellas: bot[0].n }),
    insignias_desbloqueadas: insignias.filter((i) => i.desbloqueada).length,
    insignias_totales: insignias.length,
    racha,
    siguiente: siguiente && {
      nombre: siguiente.nombre,
      umbral_depositos: siguiente.umbral_depositos,
      faltan: siguiente.umbral_depositos - depositos,
    },
    insignias,
  };
}

module.exports = { resumenInsignias, calcularRacha, calcularLogros };
