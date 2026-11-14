import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Posición actual del usuario, mientras `activo` sea true.
 * estado: 'pidiendo' | 'concedido' | 'denegado' | 'error'
 * detalle: texto del error cuando estado es 'error'.
 */
const MENSAJES_WEB = {
  2: 'El teléfono no pudo determinar la posición. Activa el GPS o prueba al aire libre.',
  3: 'La ubicación tardó demasiado en responder.',
};

export default function useUbicacion({ activo = true } = {}) {
  const [posicion, setPosicion] = useState(null); // { lat, lng, precision }
  const [estado, setEstado] = useState('pidiendo');
  const [detalle, setDetalle] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!activo) return undefined;
    let cancelado = false;
    let suscripcion = null;
    let temporizador = null;
    let watchId = null;

    const aplicar = ({ coords }) => {
      if (cancelado) return;
      clearTimeout(temporizador);
      setPosicion({ lat: coords.latitude, lng: coords.longitude, precision: coords.accuracy });
      setEstado('concedido');
      setDetalle('');
    };

    // Navegador: se usa la API nativa para recibir el motivo real del error.
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setEstado('error');
        setDetalle('Este navegador no permite obtener la ubicación.');
        return undefined;
      }
      setEstado('pidiendo');
      setDetalle('');

      const iniciar = (alta) => {
        watchId = navigator.geolocation.watchPosition(
          aplicar,
          (err) => {
            if (cancelado) return;
            if (err.code === 1) {
              setEstado('denegado');
              return;
            }
            if (alta) {
              // Sin señal GPS: se reintenta con precisión normal (Wi-Fi y antenas).
              navigator.geolocation.clearWatch(watchId);
              iniciar(false);
              return;
            }
            setEstado('error');
            setDetalle(MENSAJES_WEB[err.code] || err.message || 'Error desconocido.');
          },
          { enableHighAccuracy: alta, timeout: 15000, maximumAge: 10000 }
        );
      };
      iniciar(true);

      return () => {
        cancelado = true;
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
      };
    }

    // App nativa (Expo Go o ejecutable).
    (async () => {
      try {
        setEstado('pidiendo');
        setDetalle('');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelado) return;
        if (status !== 'granted') {
          setEstado('denegado');
          return;
        }

        // Si en 30 segundos no llega ninguna posición, se avisa en vez de quedar en silencio
        temporizador = setTimeout(() => {
          if (cancelado) return;
          setEstado('error');
          setDetalle((d) => d || 'El teléfono no entregó la posición en 30 segundos.');
        }, 30000);

        suscripcion = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          aplicar
        );
        if (cancelado) suscripcion.remove(); // se desmontó mientras se iniciaba
      } catch (err) {
        if (!cancelado) {
          clearTimeout(temporizador);
          setEstado('error');
          setDetalle(String(err?.message || err));
        }
      }
    })();

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      suscripcion?.remove();
    };
  }, [activo, intento]);

  return { posicion, estado, detalle, reintentar: () => setIntento((n) => n + 1) };
}