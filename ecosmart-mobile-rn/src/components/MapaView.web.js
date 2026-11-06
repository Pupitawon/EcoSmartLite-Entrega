import { useEffect } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CALAMA, STATUS_META, getPinStatus } from '../tema';

// En modo oscuro se oscurece el mapa base con un filtro CSS (OpenStreetMap no ofrece mapa oscuro).
// La clase va en el contenedor y no en TileLayer, porque Leaflet no actualiza className de una capa ya creada.
const CSS_OSCURO = '.eco-mapa-oscuro .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.95) contrast(.9)}';

function icono(color, darkMode, activo) {
  const tam = activo ? 34 : 26;
  const borde = darkMode ? '#18181b' : '#ffffff';
  return L.divIcon({
    className: '',
    html: `<div style="width:${tam}px;height:${tam}px;border-radius:50%;background:${color};border:${activo ? 4 : 3}px solid ${borde};box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer"></div>`,
    iconSize: [tam, tam],
    iconAnchor: [tam / 2, tam / 2],
  });
}

// Punto azul del usuario (igual que el de Google Maps).
const ICONO_USUARIO = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.3),0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Lleva el mapa al usuario cada vez que `centrar` (contador) cambia.
function Centrador({ posicion, centrar }) {
  const mapa = useMap();
  useEffect(() => {
    if (!centrar || !posicion) return;
    mapa.flyTo([posicion.lat, posicion.lng], 16);
  }, [centrar]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// posicion: { lat, lng, precision } del usuario (o null).
export default function MapaView({ pins, darkMode, seleccionado, onSelect, posicion, centrar }) {
  useEffect(() => {
    const estilo = document.createElement('style');
    estilo.textContent = CSS_OSCURO;
    document.head.appendChild(estilo);
    return () => estilo.remove();
  }, []);

  return (
    // zIndex 0 + isolation crean un contexto de apilamiento propio: los paneles de Leaflet (z-index 200 a 1000)
    // quedan encerrados aquí y la leyenda y la tarjeta del pin se dibujan por encima del mapa.
    <div className={darkMode ? 'eco-mapa-oscuro' : ''} style={{ position: 'absolute', inset: 0, zIndex: 0, isolation: 'isolate' }}>
      <MapContainer center={[CALAMA.latitude, CALAMA.longitude]} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Centrador posicion={posicion} centrar={centrar} />
        {posicion && (
          <>
            {posicion.precision != null && posicion.precision < 500 && (
              <Circle
                center={[posicion.lat, posicion.lng]}
                radius={posicion.precision}
                pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0.1 }}
              />
            )}
            <Marker position={[posicion.lat, posicion.lng]} icon={ICONO_USUARIO} zIndexOffset={-1000} interactive={false} />
          </>
        )}
        {pins.map((pin) => {
          const color = STATUS_META[getPinStatus(pin)].color;
          const activo = seleccionado?.id_contenedor === pin.id_contenedor;
          return (
            <Marker
              key={`${pin.id_contenedor}-${color}-${activo}-${darkMode}`}
              position={[pin.lat, pin.lng]}
              icon={icono(color, darkMode, activo)}
              eventHandlers={{ click: () => onSelect(pin) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}