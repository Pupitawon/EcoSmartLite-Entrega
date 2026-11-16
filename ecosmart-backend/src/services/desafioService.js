const pool = require('../config/db');

// Zona horaria con la que se cuentan el día y el mes (igual que el límite diario de depósitos).
const ZONA = 'America/Santiago';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Meta del desafío del mes: botellas recicladas, con hitos intermedios (como el desafío mensual de Duolingo).
const META_MES = 30;
const HITOS_MES = [10, 20, 30];
// Valor por defecto si no se puede leer `max_botellas_por_dia` de configuracion_sistema.
const LIMITE_DIARIO_POR_DEFECTO = 10;

/**
 * Arma los desafíos a partir de lo reciclado hoy y en el mes. Función pura (sin base de datos) para poder probarla.
 * - Diarios: 1 depósito, 5 botellas y llegar al límite diario de botellas.
 * - Mensual: META_MES botellas en el mes, con hitos.
 */
function calcularDesafios({ depositosHoy, botellasHoy, limiteDiario, botellasMes, mes, diasRestantesMes, horasRestantesDia }) {
  const limite = Math.max(Number(limiteDiario) || LIMITE_DIARIO_POR_DEFECTO, 1);
  const tope = (valor, meta) => Math.min(Math.max(Number(valor) || 0, 0), meta);
  const diario = (id, titulo, valor, meta, unidad) => ({
    id, titulo, unidad, meta, valor: tope(valor, meta), completado: Number(valor) >= meta,
  });
  const botellas = Math.max(Number(botellasMes) || 0, 0);
  return {
    dia: {
      horas_restantes: horasRestantesDia,
      desafios: [
        diario('primer_deposito', 'Haz tu primer depósito de hoy', depositosHoy, 1, 'depósitos'),
        diario('cinco_botellas', 'Recicla 5 botellas hoy', botellasHoy, 5, 'botellas'),
        diario('limite_diario', `Llega al límite diario de ${limite} botellas`, botellasHoy, limite, 'botellas'),
      ],
    },
    mes: {
      nombre: MESES[(mes || 1) - 1],
      titulo: `Desafío de ${MESES[(mes || 1) - 1]}`,
      dias_restantes: diasRestantesMes,
      meta: META_MES,
      valor: Math.min(botellas, META_MES),
      botellas,
      hitos: HITOS_MES.map((h) => ({ valor: h, alcanzado: botellas >= h })),
      completado: botellas >= META_MES,
    },
  };
}

/** Desafíos del día y del mes del usuario autenticado, calculados con sus depósitos (hora de Chile). */
async function resumenDesafios(idAuth) {
  const { rows: u } = await pool.query('SELECT id_usuario FROM usuario WHERE id_auth = $1', [idAuth]);
  if (!u[0]) return null;

  const { rows } = await pool.query(
    `WITH x AS (SELECT (NOW() AT TIME ZONE '${ZONA}') AS ahora),
          d AS (SELECT (fecha_escaneo_offline AT TIME ZONE 'UTC' AT TIME ZONE '${ZONA}') AS l,
                       COALESCE(cantidad_premiada, 0) AS cant
                  FROM deposito_residuo WHERE id_usuario = $1)
     SELECT
       COUNT(*) FILTER (WHERE d.l::date = x.ahora::date)::int AS depositos_hoy,
       COALESCE(SUM(d.cant) FILTER (WHERE d.l::date = x.ahora::date), 0)::int AS botellas_hoy,
       COALESCE(SUM(d.cant) FILTER (WHERE date_trunc('month', d.l) = date_trunc('month', x.ahora)), 0)::int AS botellas_mes,
       EXTRACT(MONTH FROM x.ahora)::int AS mes,
       ((date_trunc('month', x.ahora) + interval '1 month')::date - x.ahora::date)::int AS dias_restantes_mes,
       CEIL(EXTRACT(EPOCH FROM (date_trunc('day', x.ahora) + interval '1 day' - x.ahora)) / 3600)::int AS horas_restantes_dia
     FROM x LEFT JOIN d ON TRUE
     GROUP BY x.ahora`,
    [u[0].id_usuario]
  );
  const r = rows[0];

  // Límite diario de botellas: lo configura el sistema; si no se puede leer se usa el valor por defecto.
  let limiteDiario = LIMITE_DIARIO_POR_DEFECTO;
  try {
    const { rows: c } = await pool.query("SELECT valor FROM configuracion_sistema WHERE clave = 'max_botellas_por_dia'");
    if (c[0]) limiteDiario = Number(c[0].valor);
  } catch { /* tabla ausente (por ejemplo en la BD de pruebas): se usa el valor por defecto */ }

  return calcularDesafios({
    depositosHoy: r.depositos_hoy, botellasHoy: r.botellas_hoy, limiteDiario,
    botellasMes: r.botellas_mes, mes: r.mes, diasRestantesMes: r.dias_restantes_mes, horasRestantesDia: r.horas_restantes_dia,
  });
}

module.exports = { resumenDesafios, calcularDesafios };
