//MapaScreen.js

import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LocateFixed, MapPin, Recycle, RefreshCw, X } from 'lucide-react-native';
import MapaView from '../components/MapaView';
import LeyendaMapa from '../components/LeyendaMapa';
import useContenedores from '../hooks/useContenedores';
import useUbicacion from '../hooks/useUbicacion';
import { distanciaMetros, textoDistancia } from '../utils/distancia';
import { STATUS_META, getPinStatus, horaLocal, temaDe } from '../tema';
import { pinesDe } from '../utils/pines';

export default function MapaScreen({ darkMode, onViewStation }) {
  const t = temaDe(darkMode);
  const { contenedores, cargando, error, recargar } = useContenedores();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const { posicion, estado: estadoUbicacion, detalle: detalleUbicacion, reintentar } = useUbicacion();
  const [centrar, setCentrar] = useState(0); // cada toque al botón lleva el mapa al usuario
  const irAMiUbicacion = () => (posicion ? setCentrar((n) => n + 1) : reintentar());

  const pins = useMemo(() => pinesDe(contenedores), [contenedores]);
  // Se busca por id para que la tarjeta se actualice sola cuando llega un % nuevo.
  const seleccionado = pins.find((p) => p.id_contenedor === seleccionadoId) || null;
  const meta = seleccionado ? STATUS_META[getPinStatus(seleccionado)] : null;
  const distancia = seleccionado && posicion
  ? textoDistancia(distanciaMetros(posicion, { lat: seleccionado.lat, lng: seleccionado.lng }))
  : null;

  return (
    <View style={e.pantalla}>
      <View style={e.titulo}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.texto, flex: 1 }}>Puntos de reciclaje en Calama</Text>
        <Pressable onPress={recargar} accessibilityLabel="Actualizar" style={{ padding: 6 }}>
          <RefreshCw size={16} color={t.textoSuave} />
        </Pressable>
      </View>

      <View style={[e.mapa, { borderColor: t.borde }]}>
        <MapaView pins={pins} darkMode={darkMode} seleccionado={seleccionado} onSelect={(p) => setSeleccionadoId(p.id_contenedor)} posicion={posicion} centrar={centrar} />

        <Pressable
          onPress={irAMiUbicacion}
          accessibilityLabel="Centrar en mi ubicación"
          style={[e.botonUbicacion, { backgroundColor: t.superficie, borderColor: t.borde }]}
        >
          <LocateFixed size={20} color={posicion ? '#3b82f6' : t.textoSuave} />
        </Pressable>
        {!error && estadoUbicacion === 'denegado' && (
          <View style={[e.banner, { backgroundColor: t.superficie }]}>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>
              Activa el permiso de ubicación para ver dónde estás en el mapa.
            </Text>
          </View>
        )}

        {!error && estadoUbicacion === 'error' && (
          <View style={[e.banner, { backgroundColor: t.superficie }]}>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>
              No se pudo obtener tu ubicación{detalleUbicacion ? `: ${detalleUbicacion}` : '.'}
            </Text>
          </View>
        )}

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

        {!seleccionado && <LeyendaMapa darkMode={darkMode} />}

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
                  {seleccionado.address || 'Dirección no disponible'}{distancia ? `  ·  a ${distancia}` : ''}
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
              <Text style={{ fontSize: 10, color: t.textoSuave, marginTop: 4 }}>
                Última lectura: {horaLocal(seleccionado.ultimaLectura)}
              </Text>
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
  botonUbicacion: { zIndex: 10, position: 'absolute', right: 12, top: 60, width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { zIndex: 10, position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  cerrar: { position: 'absolute', top: 10, right: 10, padding: 4, zIndex: 2 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  barra: { height: 8, borderRadius: 999, overflow: 'hidden' },
  materiales: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  boton: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
});