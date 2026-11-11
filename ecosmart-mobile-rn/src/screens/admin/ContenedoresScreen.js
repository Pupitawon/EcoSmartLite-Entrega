import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AlertTriangle, Boxes, ChevronRight, Gauge, MessageSquareWarning, Search, WifiOff } from 'lucide-react-native';
import { temaDe } from '../../tema';
import { useAdminData } from '../../admin/AdminData';
import { EstadoCarga, Etiqueta, Filtros, Indicador, PantallaAdmin, Progreso, Tarjeta, Vacio } from '../../admin/ui';
import { COLOR, hace, material, ubicacion } from '../../admin/utils';

/**
 * Contenedores (RF-01 Monitoreo): resumen, búsqueda, filtros y detalle de cada contenedor.
 */
export default function ContenedoresScreen() {
  const { contenedores, cr, cargado, reportes, ahora, config, darkMode, abrirDetalle } = useAdminData();
  const t = temaDe(darkMode);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const conLectura = contenedores.filter((c) => !cr.sinLectura(c));
  const promedio = conLectura.length
    ? Math.round(conLectura.reduce((s, c) => s + c.porcentaje_llenado, 0) / conLectura.length)
    : null;
  const pendientesDe = (id) => reportes.filter((r) => r.id_contenedor === id && r.estado_revision === 'pendiente').length;
  const cuenta = (f) => contenedores.filter(f).length;

  const q = busqueda.toLowerCase().trim();
  const filas = contenedores.filter((c) => {
    if (filtro === 'alerta' && !cr.enAlerta(c)) return false;
    if (filtro === 'sinreporte' && !cr.sinReporte(c)) return false;
    if (filtro === 'sinconexion' && !cr.sinConexion(c)) return false;
    if (filtro === 'normal' && (cr.enAlerta(c) || cr.sinReporte(c) || cr.sinConexion(c))) return false;
    if (q && !(String(c.id_contenedor).includes(q) || material(c).toLowerCase().includes(q))) return false;
    return true;
  });

  return (
    <PantallaAdmin icono={Boxes} titulo="Contenedores">
      <EstadoCarga />
      {cargado && (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Indicador icono={Boxes} valor={contenedores.length} etiqueta="Contenedores" color={COLOR.verde} />
            <Indicador icono={AlertTriangle} valor={cuenta(cr.enAlerta)} etiqueta={`En alerta ≥${config.umbral_alerta}%`} color={COLOR.rojo} />
            <Indicador icono={WifiOff} valor={cuenta(cr.sinConexion)} etiqueta="Sin conexión" color={COLOR.ambar} />
            <Indicador icono={Gauge} valor={promedio === null ? '—' : `${promedio}%`} etiqueta="Llenado prom." color={COLOR.azul} />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 12,
              backgroundColor: t.campo,
              borderColor: t.campoBorde,
            }}
          >
            <Search size={16} color="#a8a29e" />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por número o material"
              placeholderTextColor="#78716c"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 10, fontSize: 14, color: t.texto, outlineStyle: 'none' }}
            />
          </View>

          <Filtros
            valor={filtro}
            onCambiar={setFiltro}
            opciones={[
              { id: 'todos', label: 'Todos', count: contenedores.length },
              { id: 'alerta', label: 'En alerta', count: cuenta(cr.enAlerta) },
              { id: 'sinreporte', label: 'Sin reporte', count: cuenta(cr.sinReporte) },
              { id: 'sinconexion', label: 'Sin conexión', count: cuenta(cr.sinConexion) },
              { id: 'normal', label: 'Normal' },
            ]}
          />

          {filas.length === 0 ? (
            <Vacio>{contenedores.length ? 'No hay contenedores que coincidan.' : 'Todavía no hay contenedores registrados.'}</Vacio>
          ) : (
            <View style={{ gap: 8 }}>
              {filas.map((c) => {
                const nunca = cr.sinLectura(c);
                const estado = cr.estadoDe(c);
                const pend = pendientesDe(c.id_contenedor);
                return (
                  <Tarjeta key={c.id_contenedor} onPress={() => abrirDetalle(c.id_contenedor)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: estado.color }} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: t.texto }}>Contenedor #{c.id_contenedor}</Text>
                        {cr.sinConexion(c) && <Etiqueta texto="Sin conexión" color={COLOR.ambar} icono={WifiOff} />}
                        {pend > 0 && <Etiqueta texto={String(pend)} color={COLOR.rojo} icono={MessageSquareWarning} />}
                      </View>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: cr.sinReporte(c) && !nunca ? COLOR.ambar : t.textoSuave }}>
                        {material(c)} · {hace(c.fecha_ultima_lectura, ahora)}
                      </Text>
                      <Text numberOfLines={1} style={{ fontSize: 10, color: t.textoSuave }}>{ubicacion(c)}</Text>
                      {!nunca && (
                        <View style={{ marginTop: 4 }}>
                          <Progreso pct={c.porcentaje_llenado} color={cr.colorLlenado(c.porcentaje_llenado)} />
                        </View>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: estado.color }}>
                        {nunca ? '—' : `${Math.round(c.porcentaje_llenado)}%`}
                      </Text>
                      <Text style={{ fontSize: 10, color: estado.color }}>{estado.txt}</Text>
                    </View>
                    <ChevronRight size={16} color={COLOR.gris} />
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
