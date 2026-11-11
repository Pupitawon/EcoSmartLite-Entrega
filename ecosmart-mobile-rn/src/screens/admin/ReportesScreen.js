import { useState } from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2, ClipboardPlus, Eye, Hand, MessageSquareWarning, RotateCcw, XCircle } from 'lucide-react-native';
import { temaDe } from '../../tema';
import { useAdminData } from '../../admin/AdminData';
import { Boton, EstadoCarga, Etiqueta, Filtros, PantallaAdmin, Tarjeta, Vacio } from '../../admin/ui';
import { COLOR, COLOR_REPORTE, ESTADO_REPORTE, TIPO_REPORTE, hace } from '../../admin/utils';

/** Reportes ciudadanos (RF-05): el equipo los toma, resuelve o descarta. */
export default function ReportesScreen() {
  const { reportes, porId, ahora, cargado, darkMode, revisarReporte, abrirDetalle, abrirNuevaOrden } = useAdminData();
  const t = temaDe(darkMode);
  const [filtro, setFiltro] = useState('pendiente');

  const cuenta = (e) => reportes.filter((r) => r.estado_revision === e).length;
  const lista = reportes.filter((r) => filtro === 'todos' || r.estado_revision === filtro);

  return (
    <PantallaAdmin icono={MessageSquareWarning} titulo="Reportes ciudadanos">
      <EstadoCarga />
      {cargado && (
        <>
          <Filtros
            valor={filtro}
            onCambiar={setFiltro}
            opciones={[
              ...Object.keys(ESTADO_REPORTE).map((e) => ({ id: e, label: ESTADO_REPORTE[e], count: cuenta(e) })),
              { id: 'todos', label: 'Todos', count: reportes.length },
            ]}
          />

          {lista.length === 0 ? (
            <Vacio>No hay reportes {filtro === 'todos' ? 'ciudadanos' : `${ESTADO_REPORTE[filtro].toLowerCase()}s`}.</Vacio>
          ) : (
            <View style={{ gap: 8 }}>
              {lista.map((r) => {
                const existe = Boolean(porId[r.id_contenedor]);
                const abierto = r.estado_revision === 'pendiente' || r.estado_revision === 'en_revision';
                const color = COLOR_REPORTE[r.estado_revision] || COLOR.gris;
                return (
                  <Tarjeta key={r.id_reporte} borde={color}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: '700', color: t.texto }}>
                        {TIPO_REPORTE[r.tipo_anomalia] || r.tipo_anomalia || 'Reporte'}
                      </Text>
                      <Etiqueta texto={ESTADO_REPORTE[r.estado_revision] || r.estado_revision} color={color} />
                    </View>
                    <Text style={{ fontSize: 11, marginTop: 2, color: t.textoSuave }}>
                      #{r.id_contenedor} · {r.nombre_material || 'Sin material'} · reportado {hace(r.fecha_reporte, ahora)}
                      {r.fecha_revision ? ` · revisado ${hace(r.fecha_revision, ahora)}` : ''}
                    </Text>
                    {!!r.descripcion && <Text style={{ fontSize: 12, marginTop: 6, color: t.textoCampo }}>{r.descripcion}</Text>}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {existe && <Boton icono={Eye} onPress={() => abrirDetalle(r.id_contenedor)}>Ver</Boton>}
                      {r.estado_revision === 'pendiente' && (
                        <Boton icono={Hand} onPress={() => revisarReporte(r.id_reporte, 'en_revision')}>Tomar</Boton>
                      )}
                      {abierto ? (
                        <>
                          <Boton icono={CheckCircle2} onPress={() => revisarReporte(r.id_reporte, 'resuelto')}>Resolver</Boton>
                          <Boton variante="peligro" icono={XCircle} onPress={() => revisarReporte(r.id_reporte, 'descartado')}>Descartar</Boton>
                        </>
                      ) : (
                        <Boton icono={RotateCcw} onPress={() => revisarReporte(r.id_reporte, 'pendiente')}>Reabrir</Boton>
                      )}
                      {existe && abierto && (
                        <Boton variante="primario" icono={ClipboardPlus} onPress={() => abrirNuevaOrden(r.id_contenedor, r.tipo_anomalia)}>
                          Crear orden
                        </Boton>
                      )}
                    </View>
                  </Tarjeta>
                );
              })}
            </View>
          )}
        </>
      )}
    </PantallaAdmin>
  );
}
