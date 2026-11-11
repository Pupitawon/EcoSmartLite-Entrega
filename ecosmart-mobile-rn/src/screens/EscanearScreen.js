import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import { AlertTriangle, CheckCircle2, Keyboard, Minus, Plus, QrCode, Recycle, X, XCircle } from 'lucide-react-native';
import { obtenerResumen, registrarDeposito } from '../services/depositos';
import { temaDe } from '../tema';

const MIN = 1;
const MAX = 20;
// El QR de cada contenedor es solo su código: ECO- + 16 caracteres (contenedor.codigo_qr).
const FORMATO_QR = /^ECO-[A-Z0-9]{16}$/;

const botellas = (n) => `${n} ${n === 1 ? 'botella' : 'botellas'}`;

/**
 * Flujo: 1) escanear el QR del contenedor -> 2) indicar cuántas botellas -> 3) confirmar.
 * Los puntos y el límite diario los calcula y aplica el servidor; aquí solo se muestran.
 */
export default function EscanearScreen({ darkMode, saldo, onDeposito }) {
  const t = temaDe(darkMode);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [fase, setFase] = useState('inicio'); // inicio | camara | cantidad | enviando | resultado
  const [codigo, setCodigo] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [aviso, setAviso] = useState('');
  const [manual, setManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [resultado, setResultado] = useState(null);
  const [resumen, setResumen] = useState(null); // { limite_diario, premiadas_hoy, restantes_hoy, ecopoints_por_botella }

  const bloqueado = useRef(false); // evita procesar varias veces el mismo QR mientras la cámara sigue leyendo
  const idEscaneo = useRef(null);

  const cargarResumen = useCallback(async () => {
    try {
      setResumen(await obtenerResumen());
    } catch {
      /* sin resumen la pantalla funciona igual, solo sin vista previa de puntos */
    }
  }, []);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  async function enviar() {
    setFase('enviando');
    if (!idEscaneo.current) idEscaneo.current = Crypto.randomUUID(); // se conserva si hay que reintentar
    try {
      const deposito = await registrarDeposito({
        codigo_qr: codigo,
        cantidad,
        id_escaneo: idEscaneo.current,
        fecha_escaneo: new Date().toISOString(),
      });
      onDeposito?.(deposito);
      setResultado({ ok: true, deposito });
    } catch (err) {
      setResultado({ ok: false, mensaje: err.message, reintentable: Boolean(err.reintentable) });
    }
    setFase('resultado');
  }

  function alEscanear(dato) {
    if (bloqueado.current) return;
    const leido = String(dato || '').trim().toUpperCase();
    if (!FORMATO_QR.test(leido)) {
      setAviso('Ese QR no es de un contenedor EcoSmart.');
      return;
    }
    bloqueado.current = true;
    idEscaneo.current = null;
    setAviso('');
    setCodigo(leido);
    setCantidad(1);
    setFase('cantidad');
  }

  function reiniciar() {
    bloqueado.current = false;
    idEscaneo.current = null;
    setCodigo(null);
    setCantidad(1);
    setAviso('');
    setManual(false);
    setCodigoManual('');
    setResultado(null);
    setFase('inicio');
    cargarResumen();
  }

  // Vista previa de lo que se va a sumar (el servidor es quien decide al confirmar).
  const restantes = resumen?.restantes_hoy;
  const premiar = restantes != null ? Math.min(cantidad, restantes) : null;
  const puntos = premiar != null && resumen?.ecopoints_por_botella != null ? premiar * resumen.ecopoints_por_botella : null;

  // ---------- Cámara ----------
  if (fase === 'camara') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {permiso?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => alEscanear(data)}
          />
        ) : (
          <View style={e.centro}>
            {permiso ? (
              <>
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 14, marginBottom: 12 }}>
                  Necesitamos acceso a la cámara para escanear el QR del contenedor.
                </Text>
                <Pressable onPress={pedirPermiso} style={[e.boton, { backgroundColor: '#059669', alignSelf: 'center', paddingHorizontal: 24 }]}>
                  <Text style={e.botonTxt}>Permitir cámara</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator color="#10b981" />
            )}
          </View>
        )}

        <View style={[StyleSheet.absoluteFill, e.centro]} pointerEvents="none">
          <View style={e.marco} />
        </View>

        <Pressable onPress={reiniciar} accessibilityLabel="Cancelar" style={e.cerrarCamara}>
          <X size={20} color="#fff" />
        </Pressable>

        <View style={e.pieCamara} pointerEvents="none">
          <Text style={{ color: aviso ? '#fca5a5' : '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
            {aviso || 'Apunta al QR del contenedor'}
          </Text>
        </View>
      </View>
    );
  }

  // ---------- Enviando ----------
  if (fase === 'enviando') {
    return (
      <View style={[e.centro, { backgroundColor: t.fondoApp }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 12, fontSize: 13, color: t.textoSuave }}>Registrando tu reciclaje…</Text>
      </View>
    );
  }

  // ---------- Resultado ----------
  if (fase === 'resultado' && resultado) {
    if (resultado.ok) {
      const d = resultado.deposito;
      const sinPuntos = (d.cantidad ?? 0) - (d.cantidad_premiada ?? 0);
      const insignias = d.insignias_nuevas || [];
      return (
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} style={{ backgroundColor: t.fondoApp }}>
          <CheckCircle2 size={64} color="#10b981" style={{ marginTop: 16 }} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.texto, marginTop: 12 }}>
            {d.duplicado ? 'Ya estaba registrado' : `+${d.ecopoints_otorgados} ecopoints`}
          </Text>
          <Text style={{ fontSize: 13, color: t.textoSuave, marginTop: 4 }}>
            {botellas(d.cantidad)} · {d.cantidad_premiada} con puntos
          </Text>

          <View style={[e.panel, { backgroundColor: t.superficie, borderColor: t.borde }]}>
            <View style={e.filaEntre}>
              <Text style={{ fontSize: 13, color: t.textoCampo }}>Tu saldo</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981' }}>{d.saldo_ecopoints} ecopoints</Text>
            </View>
            {d.restantes_hoy != null && (
              <View style={[e.filaEntre, { marginTop: 8 }]}>
                <Text style={{ fontSize: 13, color: t.textoCampo }}>Botellas con puntos que te quedan hoy</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.texto }}>{d.restantes_hoy}</Text>
              </View>
            )}
          </View>

          {sinPuntos > 0 && !d.duplicado && (
            <View style={[e.nota, { borderColor: '#f59e0b' }]}>
              <AlertTriangle size={16} color={t.ambar} />
              <Text style={{ flex: 1, marginLeft: 8, fontSize: 12, color: t.ambar }}>
                Llegaste al límite diario: {botellas(sinPuntos)} no sumaron puntos, pero igual quedaron registradas.
              </Text>
            </View>
          )}

          {insignias.map((i) => (
            <View key={i.id_insignia} style={[e.nota, { borderColor: '#10b981' }]}>
              <Recycle size={16} color="#10b981" />
              <Text style={{ flex: 1, marginLeft: 8, fontSize: 12, fontWeight: '600', color: '#10b981' }}>
                ¡Nueva insignia desbloqueada: {i.nombre_insignia}!
              </Text>
            </View>
          ))}

          <Pressable onPress={reiniciar} style={[e.boton, { backgroundColor: '#059669', alignSelf: 'stretch', marginTop: 20 }]}>
            <Text style={e.botonTxt}>Listo</Text>
          </Pressable>
        </ScrollView>
      );
    }

    return (
      <View style={[e.centro, { backgroundColor: t.fondoApp, padding: 24 }]}>
        <XCircle size={64} color={t.error} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.texto, marginTop: 12, textAlign: 'center' }}>No se pudo registrar</Text>
        <Text style={{ fontSize: 13, color: t.textoSuave, marginTop: 6, textAlign: 'center' }}>{resultado.mensaje}</Text>

        {resultado.reintentable && (
          <Pressable onPress={enviar} style={[e.boton, { backgroundColor: '#059669', alignSelf: 'stretch', marginTop: 20 }]}>
            <Text style={e.botonTxt}>Reintentar</Text>
          </Pressable>
        )}
        <Pressable
          onPress={reiniciar}
          style={[e.boton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.borde, alignSelf: 'stretch', marginTop: 10 }]}
        >
          <Text style={[e.botonTxt, { color: t.texto }]}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  // ---------- Cantidad (después de escanear) ----------
  if (fase === 'cantidad') {
    const sinCupo = restantes === 0;
    const parcial = restantes != null && restantes > 0 && cantidad > restantes;
    return (
      <ScrollView contentContainerStyle={{ padding: 24 }} style={{ backgroundColor: t.fondoApp }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <CheckCircle2 size={48} color="#10b981" />
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.texto, marginTop: 8 }}>Contenedor escaneado</Text>
          <Text style={{ fontSize: 12, color: t.textoSuave, marginTop: 4, letterSpacing: 1 }}>{codigo}</Text>
        </View>

        <View style={[e.panel, { backgroundColor: t.superficie, borderColor: t.borde, alignItems: 'center', marginTop: 0 }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: t.textoCampo, marginBottom: 12 }}>¿Cuántas botellas vas a reciclar?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            <Pressable
              onPress={() => setCantidad((c) => Math.max(MIN, c - 1))}
              disabled={cantidad <= MIN}
              accessibilityLabel="Menos"
              style={[e.paso, { borderColor: t.borde, opacity: cantidad <= MIN ? 0.4 : 1 }]}
            >
              <Minus size={20} color={t.texto} />
            </Pressable>
            <Text style={{ fontSize: 40, fontWeight: '800', color: t.texto, minWidth: 64, textAlign: 'center' }}>{cantidad}</Text>
            <Pressable
              onPress={() => setCantidad((c) => Math.min(MAX, c + 1))}
              disabled={cantidad >= MAX}
              accessibilityLabel="Más"
              style={[e.paso, { borderColor: t.borde, opacity: cantidad >= MAX ? 0.4 : 1 }]}
            >
              <Plus size={20} color={t.texto} />
            </Pressable>
          </View>

          {puntos != null && (
            <Text style={{ fontSize: 16, fontWeight: '800', color: sinCupo ? t.textoSuave : '#10b981', marginTop: 16 }}>
              {sinCupo ? 'Sin puntos hoy' : `+${puntos} ecopoints`}
            </Text>
          )}
        </View>

        {sinCupo && (
          <View style={[e.nota, { borderColor: '#f59e0b' }]}>
            <AlertTriangle size={16} color={t.ambar} />
            <Text style={{ flex: 1, marginLeft: 8, fontSize: 12, color: t.ambar }}>
              Ya alcanzaste el límite de {resumen.limite_diario} botellas con puntos de hoy. Puedes reciclar igual, pero no sumarás puntos.
            </Text>
          </View>
        )}
        {parcial && (
          <View style={[e.nota, { borderColor: '#f59e0b' }]}>
            <AlertTriangle size={16} color={t.ambar} />
            <Text style={{ flex: 1, marginLeft: 8, fontSize: 12, color: t.ambar }}>
              Hoy solo te quedan {botellas(restantes)} con puntos: las otras {cantidad - restantes} se registran sin puntos.
            </Text>
          </View>
        )}

        <Pressable onPress={enviar} style={[e.boton, { backgroundColor: '#059669', marginTop: 16 }]}>
          <Text style={e.botonTxt}>Confirmar reciclaje</Text>
        </Pressable>
        <Pressable
          onPress={reiniciar}
          style={[e.boton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.borde, marginTop: 10 }]}
        >
          <Text style={[e.botonTxt, { color: t.texto }]}>Escanear otro QR</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- Inicio ----------
  const limite = resumen?.limite_diario ?? 0;
  const usadas = resumen?.premiadas_hoy ?? 0;
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: t.fondoApp }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Recycle size={56} color="#10b981" />
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.texto, marginTop: 8 }}>Registrar reciclaje</Text>
        <Text style={{ fontSize: 12, color: t.textoSuave, textAlign: 'center', marginTop: 4 }}>
          Escanea el QR del contenedor donde vas a depositar tus botellas.
        </Text>
      </View>

      {typeof saldo === 'number' && (
        <View style={[e.filaEntre, e.panel, { backgroundColor: t.superficie, borderColor: t.borde, marginTop: 0 }]}>
          <Text style={{ fontSize: 13, color: t.textoCampo }}>Tu saldo</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981' }}>{saldo} ecopoints</Text>
        </View>
      )}

      {resumen && (
        <View style={[e.panel, { backgroundColor: t.superficie, borderColor: t.borde }]}>
          <View style={e.filaEntre}>
            <Text style={{ fontSize: 13, color: t.textoCampo }}>Botellas con puntos hoy</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: t.texto }}>
              {usadas} / {limite}
            </Text>
          </View>
          <View style={[e.barra, { backgroundColor: darkMode ? '#27272a' : '#e7e5e4' }]}>
            <View
              style={{
                width: `${limite > 0 ? Math.min(100, (usadas / limite) * 100) : 0}%`,
                height: '100%',
                borderRadius: 999,
                backgroundColor: resumen.restantes_hoy > 0 ? '#10b981' : '#f59e0b',
              }}
            />
          </View>
          <Text style={{ fontSize: 11, color: t.textoSuave, marginTop: 6 }}>
            {resumen.restantes_hoy > 0
              ? `Te quedan ${botellas(resumen.restantes_hoy)} con puntos · ${resumen.ecopoints_por_botella} ecopoints cada una`
              : 'Alcanzaste el límite de hoy. Mañana podrás volver a sumar puntos.'}
          </Text>
        </View>
      )}

      <Pressable onPress={() => setFase('camara')} style={[e.boton, { backgroundColor: '#059669', flexDirection: 'row', justifyContent: 'center', marginTop: 16 }]}>
        <QrCode size={18} color="#fff" />
        <Text style={[e.botonTxt, { marginLeft: 8 }]}>Escanear QR</Text>
      </Pressable>

      <Pressable onPress={() => setManual((m) => !m)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
        <Keyboard size={14} color={t.textoSuave} />
        <Text style={{ fontSize: 12, color: t.textoSuave, marginLeft: 6 }}>Ingresar código manualmente</Text>
      </Pressable>

      {manual && (
        <View style={{ marginTop: 12 }}>
          <TextInput
            value={codigoManual}
            onChangeText={(v) => setCodigoManual(v.toUpperCase())}
            placeholder="ECO-XXXXXXXXXXXXXXXX"
            placeholderTextColor="#78716c"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            style={[e.input, { backgroundColor: t.campo, borderColor: t.campoBorde, color: t.texto }]}
          />
          {!!aviso && <Text style={{ fontSize: 11, color: t.error, marginTop: 6 }}>{aviso}</Text>}
          <Pressable
            onPress={() => alEscanear(codigoManual)}
            disabled={!codigoManual.trim()}
            style={[e.boton, { backgroundColor: '#f59e0b', marginTop: 10, opacity: codigoManual.trim() ? 1 : 0.5 }]}
          >
            <Text style={e.botonTxt}>Continuar</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  marco: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: '#10b981' },
  cerrarCamara: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: 8 },
  pieCamara: { position: 'absolute', left: 16, right: 16, bottom: 32, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 12 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 20, marginTop: 12, alignSelf: 'stretch' },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barra: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  nota: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 12, alignSelf: 'stretch' },
  paso: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  boton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  botonTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, letterSpacing: 1 },
});
