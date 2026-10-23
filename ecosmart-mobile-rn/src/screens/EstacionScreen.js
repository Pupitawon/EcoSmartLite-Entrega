import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AlertTriangle, CheckCircle2, ChevronLeft, QrCode, Recycle, X } from 'lucide-react-native';
import { enviarReporte } from '../services/auth';
import { ANOMALY_TYPES, STATUS_META, getPinStatus, temaDe } from '../tema';

/**
 * Detalle de la estación (se llega desde la tarjeta de un pin del mapa) con el flujo de
 * reporte ciudadano de anomalías (HU-06 / RF-05), igual que la app de Jeremy.
 */
export default function EstacionScreen({ station, darkMode, onBack }) {
  const t = temaDe(darkMode);
  const fill = station?.fill ?? 0;
  const meta = STATUS_META[getPinStatus(station ?? { fill: 0 })];

  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState(ANOMALY_TYPES[0].id);
  const [descripcion, setDescripcion] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar() {
    if (enviando) return;
    if (!descripcion.trim()) {
      setError('Escribe un comentario para enviar el reporte.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await enviarReporte({ id_contenedor: station.id_contenedor, tipo_anomalia: tipo, descripcion: descripcion.trim() });
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setAbierto(false);
    setEnviado(false);
    setError(null);
    setTipo(ANOMALY_TYPES[0].id);
    setDescripcion('');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }} style={{ backgroundColor: t.fondoApp }}>
      <Pressable onPress={onBack} style={e.volver}>
        <ChevronLeft size={16} color={t.textoSuave} />
        <Text style={{ fontSize: 14, color: t.textoSuave }}>Volver al mapa</Text>
      </Pressable>

      <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '600', color: t.texto, marginBottom: 8 }}>
        {station?.name ?? 'Estación de reciclaje'}
      </Text>

      <View style={e.ilustracion}>
        <Recycle size={200} color="#f59e0b" style={{ opacity: 0.9 }} />
        <View style={e.caja}>
          <View style={e.visor} />
          <QrCode size={32} color="#fff" />
          <View style={[e.indicador, { backgroundColor: meta.color }]} />
        </View>
      </View>

      <View style={[e.panel, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <View style={e.filaEntre}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: t.textoCampo }}>{station?.sinReporte ? 'Último nivel registrado' : 'Nivel'}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: meta.color }}>{fill}%</Text>
        </View>
        <View style={[e.barra, { backgroundColor: darkMode ? '#27272a' : '#f5f5f4' }]}>
          <View style={{ width: `${fill}%`, height: '100%', borderRadius: 999, backgroundColor: meta.color }} />
        </View>
        <View style={[e.filaEntre, { marginTop: 12 }]}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: t.textoCampo }}>Estado</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: meta.color }}>{meta.label}</Text>
        </View>
      </View>

      <Pressable onPress={() => setAbierto(true)} style={[e.reportar, { borderColor: '#f59e0b' }]}>
        <AlertTriangle size={16} color={t.ambar} />
        <Text style={{ color: t.ambar, fontWeight: '700', fontSize: 12, marginLeft: 8 }}>Reportar anomalía</Text>
      </Pressable>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={cerrar}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={e.fondoModal}>
          <View style={[e.hoja, { backgroundColor: darkMode ? '#18181b' : '#ffffff' }]}>
            <Pressable onPress={cerrar} style={e.cerrarModal} accessibilityLabel="Cerrar">
              <X size={16} color={t.textoSuave} />
            </Pressable>

            {enviado ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <CheckCircle2 size={40} color="#10b981" />
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.texto, marginTop: 8 }}>¡Reporte enviado!</Text>
                <Text style={{ fontSize: 12, color: t.textoSuave, textAlign: 'center', marginTop: 4 }}>
                  Gracias por avisar. El equipo de Innova Recicla revisará este punto a la brevedad.
                </Text>
                <Pressable onPress={cerrar} style={[e.enviar, { backgroundColor: '#059669', alignSelf: 'stretch' }]}>
                  <Text style={e.enviarTxt}>Listo</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color="#f59e0b" />
                  <Text style={{ fontWeight: '700', fontSize: 14, color: t.texto }}>Reportar anomalía</Text>
                </View>
                <Text style={{ fontSize: 11, color: t.textoSuave, marginTop: 4, marginBottom: 10 }}>{station?.name}</Text>

                {ANOMALY_TYPES.map((a) => {
                  const activo = tipo === a.id;
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => setTipo(a.id)}
                      style={[
                        e.opcion,
                        { borderColor: activo ? '#f59e0b' : t.borde, backgroundColor: activo ? 'rgba(245,158,11,0.1)' : 'transparent' },
                      ]}
                    >
                      <View style={[e.radio, { borderColor: activo ? '#f59e0b' : '#a1a1aa' }]}>
                        {activo && <View style={e.radioInterno} />}
                      </View>
                      <Text style={{ fontSize: 12, color: t.texto }}>{a.label}</Text>
                    </Pressable>
                  );
                })}

                <TextInput
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Describe brevemente el problema (obligatorio)"
                  placeholderTextColor="#71717a"
                  maxLength={500}
                  multiline
                  style={[
                    e.texto,
                    { backgroundColor: t.campo, borderColor: t.campoBorde, color: t.texto },
                  ]}
                />
                <Text style={{ fontSize: 10, color: t.textoSuave, textAlign: 'right', marginTop: 2 }}>{descripcion.length}/500</Text>

                {!!error && <Text style={{ fontSize: 11, color: t.error, marginTop: 4 }}>{error}</Text>}

                   <Pressable
                  onPress={enviar}
                  disabled={enviando || !descripcion.trim()}
                  style={[e.enviar, { backgroundColor: '#f59e0b', opacity: enviando || !descripcion.trim() ? 0.5 : 1 }]}
                >
                  {enviando ? <ActivityIndicator color="#fff" /> : <Text style={e.enviarTxt}>Enviar reporte</Text>}
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  volver: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 8 },
  ilustracion: { alignItems: 'center', justifyContent: 'center', height: 210, marginBottom: 12 },
  caja: { position: 'absolute', width: 80, height: 128, backgroundColor: '#44403c', borderRadius: 6, alignItems: 'center', justifyContent: 'space-between', padding: 8 },
  visor: { width: 40, height: 24, backgroundColor: '#78716c', borderRadius: 2 },
  indicador: { width: 32, height: 12, borderRadius: 2 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 12 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  barra: { height: 10, borderRadius: 999, overflow: 'hidden' },
  reportar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 12, paddingVertical: 10, marginBottom: 16 },
  fondoModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center' },
  hoja: { width: '100%', maxWidth: 440, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  cerrarModal: { position: 'absolute', top: 12, right: 12, padding: 4, zIndex: 2 },
  opcion: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  radioInterno: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  texto: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 12, height: 80, textAlignVertical: 'top', marginTop: 4 },
  enviar: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  enviarTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
