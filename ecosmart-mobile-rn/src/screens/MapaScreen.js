//MapaScreen.js

import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, Recycle, RefreshCw, X } from 'lucide-react-native';
import MapaView from '../components/MapaView';
import useContenedores from '../hooks/useContenedores';
import { STATUS_META, getPinStatus, temaDe } from '../tema';

// Contenedor del backend -> pin del mapa. id_contenedor es lo que necesita el reporte ciudadano.
const aPin = (c) => ({
  id_contenedor: c.id_contenedor,
  name: `Contenedor #${c.id_contenedor}`,
  category: c.nombre_material || null,
  lat: c.latitud,
  lng: c.longitud,
  fill: Math.round(c.porcentaje_llenado),
  address: c.direccion || null,
  sinReporte: Boolean(c.sin_reporte),
});

export default function MapaScreen({ darkMode, onViewStation }) {
  const t = temaDe(darkMode);
  const { contenedores, cargando, error, recargar } = useContenedores();
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  const pins = useMemo(
    () => contenedores.filter((c) => c.latitud != null && c.longitud != null).map(aPin),
    [contenedores]
  );
  // Se busca por id para que la tarjeta se actualice sola cuando llega un % nuevo.
  const seleccionado = pins.find((p) => p.id_contenedor === seleccionadoId) || null;
    const meta = seleccionado ? STATUS_META[getPinStatus(seleccionado)] : null;

  return (
    <View style={e.pantalla}>
      <View style={e.titulo}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.texto, flex: 1 }}>Puntos de reciclaje en Calama</Text>
        <Pressable onPress={recargar} accessibilityLabel="Actualizar" style={{ padding: 6 }}>
          <RefreshCw size={16} color={t.textoSuave} />
        </Pressable>
      </View>

      <View style={[e.mapa, { borderColor: t.borde }]}>
        <MapaView pins={pins} darkMode={darkMode} seleccionado={seleccionado} onSelect={(p) => setSeleccionadoId(p.id_contenedor)} />

        {cargando && (
          <View style={e.aviso}>
            <ActivityIndicator color="#10b981" />
          </View>
        )}
        {!cargando && error && (
          <View style={[e.banner, { backgroundColor: darkMode ? '#3f1d1d' : '#fee2e2' }]}>
            <Text style={{ color: darkMode ? '#fca5a5' : '#b91c1c', fontSize: 12 }}>
              No se pudo conectar con el servidor. Reintentando…
            </Text>
          </View>
        )}
        {!cargando && !error && pins.length === 0 && (
          <View style={[e.banner, { backgroundColor: t.superficie }]}>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>No hay contenedores con ubicación para mostrar.</Text>
          </View>
        )}

        {!seleccionado && (
          <View style={[e.leyenda, { backgroundColor: darkMode ? 'rgba(9,9,11,0.85)' : 'rgba(255,255,255,0.92)', borderColor: t.borde }]}>
            {['low', 'medium', 'full', 'unknown'].map((k, i) => (
              <View key={k} style={e.leyendaFila}>
                <View style={[e.punto, { backgroundColor: STATUS_META[k].color }]} />
                <Text style={{ fontSize: 10, fontWeight: '500', color: t.textoCampo }}>
                  {['Verde', 'Amarillo', 'Rojo', 'Gris'][i]} · {STATUS_META[k].label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {seleccionado && (
          <View style={[e.tarjeta, { backgroundColor: darkMode ? 'rgba(24,24,27,0.97)' : 'rgba(255,255,255,0.97)', borderColor: t.borde }]}>
            <Pressable onPress={() => setSeleccionadoId(null)} style={e.cerrar} accessibilityLabel="Cerrar">
              <X size={16} color={t.textoSuave} />
            </Pressable>

            <View style={{ paddingRight: 24 }}>
              {!!seleccionado.category && (
                <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: '#10b981', textTransform: 'uppercase', marginBottom: 2 }}>
                  {seleccionado.category}
                </Text>
              )}
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.texto }}>{seleccionado.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                <MapPin size={12} color={t.textoSuave} />
                <Text style={{ fontSize: 11, color: t.textoSuave, flexShrink: 1 }}>
                  {seleccionado.address || 'Dirección no disponible'}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={e.filaEntre}>
                <Text style={{ fontSize: 12, color: t.textoSuave }}>Capacidad</Text>
                <Text style={{ fontSize: 12 }}>
                  <Text style={{ fontWeight: '600', color: meta.color }}>{meta.label}  </Text>
                  <Text style={{ fontWeight: '700', color: t.texto }}>{seleccionado.sinReporte ? 'último dato ' : ''}{seleccionado.fill}%</Text>
                </Text>
              </View>
              <View style={[e.barra, { backgroundColor: darkMode ? '#27272a' : '#e7e5e4' }]}>
                <View style={{ width: `${seleccionado.fill}%`, height: '100%', borderRadius: 999, backgroundColor: meta.color }} />
              </View>
            </View>

            {!!seleccionado.category && (
              <View style={[e.materiales, { borderTopColor: t.borde }]}>
                <Recycle size={14} color="#10b981" />
                <View style={[e.chip, { backgroundColor: darkMode ? '#27272a' : '#f5f5f4' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '500', color: t.textoCampo }}>{seleccionado.category}</Text>
                </View>
              </View>
            )}

            <Pressable onPress={() => onViewStation(seleccionado)} style={e.boton}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Ver estación en detalle</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  pantalla: { flex: 1, padding: 16 },
  titulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mapa: { flex: 1, borderWidth: 1, borderRadius: 16, overflow: 'hidden', minHeight: 320 },
  aviso: { zIndex: 10, position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: 8 },
  banner: { zIndex: 10, position: 'absolute', top: 12, left: 12, right: 12, borderRadius: 12, padding: 10 },
  leyenda: { zIndex: 10, position: 'absolute', left: 12, bottom: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  leyendaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  tarjeta: { zIndex: 10, position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  cerrar: { position: 'absolute', top: 10, right: 10, padding: 4, zIndex: 2 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  barra: { height: 8, borderRadius: 999, overflow: 'hidden' },
  materiales: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  boton: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
});