const pool = require('../config/db');

// Zona horaria con la que se cuenta el mes (igual que los desafíos).
const ZONA = 'America/Santiago';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const TAMANO_TOP = 10;

/**
 * Nombre que se muestra a los demás: primer nombre + inicial del siguiente ("Marcelo Araya Torres" -> "Marcelo A.").
 * Así el ranking no expone el nombre completo de nadie.
 */
function nombreCorto(nombreCompleto) {
  const partes = String(nombreCompleto || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'Reciclador';
  const primero = partes[0];
  return partes[1] ? `${primero} ${partes[1].charAt(0).toUpperCase()}.` : primero;
}

/**
 * Arma la respuesta a partir de las filas ya ordenadas (posicion, id_usuario, nombre, botellas).
 * Función pura (sin base de datos) para poder probarla.
 */
function armarRanking(filas, idUsuario, { mes, diasRestantes }) {
  const lista = filas.map((f) => ({
    posicion: Number(f.posicion),
    nombre: nombreCorto(f.nombre_completo),
    botellas: Number(f.botellas),
    yo: f.id_usuario === idUsuario,
  }));
  const miFila = lista.find((f) => f.yo) || null;
  return {
    titulo: `Ranking de ${MESES[(mes || 1) - 1]}`,
    dias_restantes: diasRestantes,
    participantes: lista.length,
    top: lista.slice(0, TAMANO_TOP),
    // Si el usuario no entra al top se informa aparte; si aún no recicla este mes es null.
    yo: miFila && miFila.posicion > TAMANO_TOP ? { posicion: miFila.posicion, nombre: miFila.nombre, botellas: miFila.botellas, yo: true } : null,
    en_ranking: Boolean(miFila),
  };
}

/** Ranking del mes por botellas recicladas (hora de Chile). Empata por depósitos y luego por antigüedad. */
async function resumenRanking(idAuth) {
  const { rows: u } = await pool.query('SELECT id_usuario FROM usuario WHERE id_auth = $1', [idAuth]);
  if (!u[0]) return null;

  const { rows } = await pool.query(
    `WITH x AS (SELECT (NOW() AT TIME ZONE '${ZONA}') AS ahora),
          mes AS (
            SELECT d.id_usuario, SUM(COALESCE(d.cantidad_premiada, 0))::int AS botellas, COUNT(*)::int AS depositos
              FROM deposito_residuo d, x
             WHERE date_trunc('month', d.fecha_escaneo_offline AT TIME ZONE 'UTC' AT TIME ZONE '${ZONA}') = date_trunc('month', x.ahora)
             GROUP BY d.id_usuario)
     SELECT ROW_NUMBER() OVER (ORDER BY m.botellas DESC, m.depositos DESC, m.id_usuario ASC)::int AS posicion,
            m.id_usuario, us.nombre_completo, m.botellas,
            EXTRACT(MONTH FROM x.ahora)::int AS mes,
            ((date_trunc('month', x.ahora) + interval '1 month')::date - x.ahora::date)::int AS dias_restantes
       FROM mes m JOIN usuario us ON us.id_usuario = m.id_usuario, x
      WHERE m.botellas > 0
      ORDER BY posicion`
  );

  let mesActual; let diasRestantes;
  if (rows[0]) { mesActual = rows[0].mes; diasRestantes = rows[0].dias_restantes; } else {
    const { rows: f } = await pool.query(
      `SELECT EXTRACT(MONTH FROM (NOW() AT TIME ZONE '${ZONA}'))::int AS mes,
              ((date_trunc('month', NOW() AT TIME ZONE '${ZONA}') + interval '1 month')::date - (NOW() AT TIME ZONE '${ZONA}')::date)::int AS dias`
    );
    mesActual = f[0].mes; diasRestantes = f[0].dias;
  }
  return armarRanking(rows, u[0].id_usuario, { mes: mesActual, diasRestantes });
}

module.exports = { nombreCorto, armarRanking, resumenRanking, TAMANO_TOP };
