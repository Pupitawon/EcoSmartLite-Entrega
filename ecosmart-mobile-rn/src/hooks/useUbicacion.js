import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

/**
 * Posición actual del usuario, mientras `activo` sea true.
 * estado: 'pidiendo' | 'concedido' | 'denegado' | 'error'
 * detalle: texto del error cuando estado es 'error'.
 */
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

    const aplicar = ({ coords }) => {
      if (cancelado) return;
      clearTimeout(temporizador);
      setPosicion({ lat: coords.latitude, lng: coords.longitude, precision: coords.accuracy });
      setEstado('concedido');
      setDetalle('');
    };

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