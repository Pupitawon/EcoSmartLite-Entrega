import { Text, View } from 'react-native';
import { AlertTriangle, ClipboardPlus, Eye, History, WifiOff } from 'lucide-react-native';
import { temaDe } from '../../tema';
import { useAdminData } from '../../admin/AdminData';
import { Boton, EstadoCarga, Etiqueta, PantallaAdmin, Seccion, Tarjeta, Vacio } from '../../admin/ui';
import { COLOR, hace, material, suave } from '../../admin/utils';

/** Alertas (RF-02): contenedores llenos y sensores sin reporte, más el historial de alertas (RF-03). */
export default function AlertasScreen() {
  const { contenedores, alertas, cr, cargado, ahora, config, darkMode, abrirDetalle, abrirNuevaOrden } = useAdminData();
  const t = temaDe(darkMode);

  const llenos = contenedores.filter(cr.enAlerta);
  const sinReporte = contenedores.filter((c) => (cr.sinReporte(c) || cr.sinConexion(c)) && !cr.enAlerta(c));
  const alertaPendiente = (id) => alertas.find((a) => a.id_contenedor === id && a.estado_alerta === 'pendiente');
  const historial = alertas.filter((a) => a.estado_alerta !== 'duplicada').slice(0, 30);

  const acciones = (id) => (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
      <Boton icono={Eye} onPress={() => abrirDetalle(id)}>Ver</Boton>
      <Boton variante="primario" icono={ClipboardPlus} onPress={() => abrirNuevaOrden(id)}>Crear orden</Boton>
    </View>
  );
  const resaltada = (color) => ({ borderColor: suave(color, '66'), backgroundColor: suave(color, '1a') });

  return (
    <PantallaAdmin icono={AlertTriangle} titulo="Alertas">
      <EstadoCarga />
      {cargado && (
        <>
          <Seccion titulo={`Contenedores llenos (≥ ${config.umbral_alerta}%) · ${llenos.length}`} color={COLOR.rojo} icono={AlertTriangle}>
            {llenos.length === 0 ? (
              <Vacio>Sin alertas de llenado. Todos los contenedores están bajo el {config.umbral_alerta}%.</Vacio>
            ) : (
              llenos.map((c) => {
                const a = alertaPendiente(c.id_contenedor);
                return (
                  <Tarjeta key={c.id_contenedor} style={resaltada(COLOR.rojo)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: t.texto }}>Contenedor #{c.id_contenedor}</Text>
                        <Text numberOfLines={1} style={{ fontSize: 11, color: t.textoSuave }}>
                          {material(c)}{a?.fecha_generacion ? ` · alerta ${hace(a.fecha_generacion, ahora)}` : ''}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: COLOR.rojo }}>{Math.round(c.porcentaje_llenado)}%</Text>
                    </View>
                    {acciones(c.id_contenedor)}
                  </Tarjeta>
                );
              })
            )}
          </Seccion>

          <Seccion titulo={`Sensores sin reporte o sin conexión · ${sinReporte.length}`} color={COLOR.ambar} icono={WifiOff}>
            {sinReporte.length === 0 ? (
              <Vacio>Todos los sensores están reportando.</Vacio>
            ) : (
              sinReporte.map((c) => (
                <Tarjeta key={c.id_contenedor} style={resaltada(COLOR.ambar)}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: t.texto }}>Contenedor #{c.id_contenedor}</Text>
                  <Text numberOfLines={2} style={{ fontSize: 11, color: t.textoSuave }}>
                    {material(c)} ·{' '}
                    {cr.sinLectura(c)
                      ? 'el sensor nunca ha enviado lecturas'
                      : `última lectura ${hace(c.fecha_ultima_lectura, ahora)} · ${Math.round(c.porcentaje_llenado)}%`}
                  </Text>
                  {acciones(c.id_contenedor)}
                </Tarjeta>
              ))
            )}
          </Seccion>

          <Seccion titulo="Historial de alertas" color={t.textoSuave} icono={History}>
            {historial.length === 0 ? (
              <Vacio>Aún no se han generado alertas.</Vacio>
            ) : (
              <View style={{ borderWidth: 1, borderRadius: 12, borderColor: t.borde, backgroundColor: t.superficie }}>
                {historial.map((a) => {
                  const activa = a.estado_alerta === 'pendiente';
                  return (
                    <View
                      key={a.id_alerta}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.borde }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: t.texto }}>
                          Contenedor #{a.id_contenedor} · {a.nombre_material || 'Sin material'}
                        </Text>
                        <Text style={{ fontSize: 10, color: t.textoSuave }}>
                          {a.porcentaje_disparo != null ? `${Math.round(a.porcentaje_disparo)}% · ` : ''}
                          {hace(a.fecha_generacion, ahora)}
                          {a.fecha_resolucion ? ` · resuelta ${hace(a.fecha_resolucion, ahora)}` : ''}
                        </Text>
                      </View>
                      <Etiqueta texto={activa ? 'Activa' : 'Resuelta'} color={activa ? COLOR.rojo : COLOR.verde} />
                    </View>
                  );
                })}
              </View>
            )}
          </Seccion>
        </>
      )}
    </PantallaAdmin>
  );
}
