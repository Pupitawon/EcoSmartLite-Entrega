import { Text, View } from 'react-native';
import { AlertTriangle, Boxes, ChartColumn, Gauge, WifiOff } from 'lucide-react-native';
import { temaDe } from '../../tema';
import { useAdminData } from '../../admin/AdminData';
import { Barra, EstadoCarga, Indicador, PantallaAdmin, Tarjeta } from '../../admin/ui';
import { COLOR, COLOR_REPORTE, ESTADO_REPORTE } from '../../admin/utils';

/** Indicadores operativos con los datos actuales (los 4 de arriba estaban antes en Panel). */
export default function IndicadoresScreen() {
  const { contenedores: l, alertas, reportes, ordenes, cr, cargado, config, darkMode } = useAdminData();
  const t = temaDe(darkMode);
  const total = l.length;
  const conLectura = l.filter((c) => !cr.sinLectura(c));
  const promedio = conLectura.length
    ? Math.round(conLectura.reduce((s, c) => s + c.porcentaje_llenado, 0) / conLectura.length)
    : null;
  const cuenta = (f) => l.filter(f).length;

  const normal = (c) => !cr.sinLectura(c) && !cr.enAlerta(c);
  const activas = alertas.filter((a) => a.estado_alerta === 'pendiente').length;
  const resueltas = alertas.filter((a) => a.estado_alerta === 'resuelta').length;
  const maxAl = Math.max(activas, resueltas, 1);
  const porEstado = Object.keys(ESTADO_REPORTE).map((k) => [k, reportes.filter((r) => r.estado_revision === k).length]);
  const maxRep = Math.max(...porEstado.map(([, n]) => n), 1);
  const porTecnico = {};
  ordenes.filter((o) => o.estado !== 'Cerrada').forEach((o) => {
    porTecnico[o.tecnico] = (porTecnico[o.tecnico] || 0) + 1;
  });
  const maxTec = Math.max(...Object.values(porTecnico), 1);

  const titulo = (txt) => <Text style={{ fontSize: 12, fontWeight: '700', marginBottom: 4, color: t.texto }}>{txt}</Text>;
  const nada = (txt) => <Text style={{ fontSize: 12, color: t.textoSuave }}>{txt}</Text>;
  const panel = { gap: 8 };

  return (
    <PantallaAdmin icono={ChartColumn} titulo="Indicadores">
      <EstadoCarga />
      {cargado && (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Indicador icono={Boxes} valor={total} etiqueta="Contenedores" color={COLOR.verde} />
            <Indicador icono={AlertTriangle} valor={cuenta(cr.enAlerta)} etiqueta={`En alerta ≥${config.umbral_alerta}%`} color={COLOR.rojo} />
            <Indicador icono={WifiOff} valor={cuenta(cr.sinConexion)} etiqueta="Sin conexión" color={COLOR.ambar} />
            <Indicador icono={Gauge} valor={promedio === null ? '—' : `${promedio}%`} etiqueta="Llenado prom." color={COLOR.azul} />
          </View>

          <Tarjeta style={panel}>
            {titulo('Estado de los contenedores')}
            {total ? (
              <>
                <Barra etiqueta="Disponible" n={l.filter((c) => normal(c) && c.porcentaje_llenado < 50).length} total={total} color={COLOR.verde} />
                <Barra etiqueta="Atención" n={l.filter((c) => normal(c) && c.porcentaje_llenado >= 50).length} total={total} color={COLOR.ambar} />
                <Barra etiqueta="En alerta" n={l.filter(cr.enAlerta).length} total={total} color={COLOR.rojo} />
                <Barra etiqueta="Sin reporte" n={l.filter(cr.sinReporte).length} total={total} color={COLOR.gris} />
                <Barra etiqueta="Sin conexión" n={l.filter(cr.sinConexion).length} total={total} color={COLOR.ambar} />
              </>
            ) : (
              nada('Sin datos todavía.')
            )}
          </Tarjeta>

          <Tarjeta style={panel}>
            {titulo('Alertas de llenado')}
            <Barra etiqueta="Activas" n={activas} total={maxAl} color={COLOR.rojo} />
            <Barra etiqueta="Resueltas" n={resueltas} total={maxAl} color={COLOR.verde} />
          </Tarjeta>

          <Tarjeta style={panel}>
            {titulo('Reportes ciudadanos')}
            {reportes.length
              ? porEstado.map(([k, n]) => <Barra key={k} etiqueta={ESTADO_REPORTE[k]} n={n} total={maxRep} color={COLOR_REPORTE[k]} />)
              : nada('Aún no hay reportes ciudadanos.')}
          </Tarjeta>
        </>
      )}

      <Tarjeta style={panel}>
        {titulo('Órdenes abiertas por técnico')}
        {Object.keys(porTecnico).length
          ? Object.entries(porTecnico).map(([k, n]) => <Barra key={k} etiqueta={k} n={n} total={maxTec} color={COLOR.azul} />)
          : nada('No hay órdenes abiertas.')}
      </Tarjeta>
    </PantallaAdmin>
  );
}
