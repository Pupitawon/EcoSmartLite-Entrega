import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

// TEMPORAL: diagnóstico de ubicación en el navegador. Borrar cuando se resuelva.
export default function DebugUbicacion({ estado, detalle }) {
  const [permiso, setPermiso] = useState('?');
  const [prueba, setPrueba] = useState('sin probar');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((r) => setPermiso(r.state))
        .catch((err) => setPermiso('error: ' + err.message));
    } else {
      setPermiso('sin Permissions API');
    }
  }, []);

  if (Platform.OS !== 'web') return null;

  // Pide la posición directo desde un toque del usuario, sin pasar por el hook.
  const probar = () => {
    setPrueba('pidiendo…');
    navigator.geolocation.getCurrentPosition(
      (p) => setPrueba(`OK ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} (±${Math.round(p.coords.accuracy)} m)`),
      (err) => setPrueba(`ERROR código ${err.code}: ${err.message}`),
      { enableHighAccuracy: false, timeout: 15000 }
    );
  };

  return (
    <View style={{ position: 'absolute', top: 8, left: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 8, zIndex: 9999 }}>
      <Text style={{ color: '#fff', fontSize: 11 }}>hook: {estado} {detalle ? `| ${detalle}` : ''}</Text>
      <Text style={{ color: '#fff', fontSize: 11 }}>contexto seguro: {String(window.isSecureContext)} | permiso: {permiso}</Text>
      <Text style={{ color: '#fff', fontSize: 11 }}>geolocation: {String(!!navigator.geolocation)}</Text>
      <Pressable onPress={probar} style={{ backgroundColor: '#10b981', padding: 6, borderRadius: 6, marginTop: 6 }}>
        <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontWeight: '700' }}>Probar ubicación (toque directo)</Text>
      </Pressable>
      <Text style={{ color: '#fde68a', fontSize: 11, marginTop: 4 }}>prueba: {prueba}</Text>
    </View>
  );
}