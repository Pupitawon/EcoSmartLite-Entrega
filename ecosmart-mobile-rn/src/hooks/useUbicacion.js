import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Posición actual del usuario, mientras `activo` sea true.
 * estado: 'pidiendo' | 'concedido' | 'denegado' | 'error'
 * Solo pide permiso en primer plano y deja de seguir la posición al desmontarse.
 */
export default function useUbicacion({ activo = true } = {}) {
  const [posicion, setPosicion] = useState(null); // { lat, lng, precision }
  const [estado, setEstado] = useState('pidiendo');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!activo) return undefined;
    let cancelado = false;
    let suscripcion = null;

    (async () => {
      try {
        setEstado('pidiendo');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelado) return;
        if (status !== 'granted') {
          setEstado('denegado');
          return;
        }
        suscripcion = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
          ({ coords }) => {
            if (cancelado) return;
            setPosicion({ lat: coords.latitude, lng: coords.longitude, precision: coords.accuracy });
            setEstado('concedido');
          }
        );
        if (cancelado) suscripcion.remove(); // se desmontó mientras se iniciaba
      } catch {
        if (!cancelado) setEstado('error');
      }
    })();

    return () => {
      cancelado = true;
      suscripcion?.remove();
    };
  }, [activo, intento]);

  return { posicion, estado, reintentar: () => setIntento((n) => n + 1) };
}