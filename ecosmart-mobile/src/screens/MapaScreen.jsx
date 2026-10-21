import React, { useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { X, Recycle, MapPin } from "lucide-react";
import { MAP_PINS, STATUS_META, getFillStatus } from "../data/mockData.js";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Configuración por defecto para iconos de Leaflet
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Función para crear marcadores SVG personalizados según el estado y modo oscuro
const createCustomPinIcon = (color, isDark) => {
  const strokeColor = isDark ? "#18181b" : "#ffffff";
  
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        width: 32px; 
        height: 32px; 
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
      "
      onmouseover="this.style.transform='scale(1.2)'"
      onmouseout="this.style.transform='scale(1)'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3" fill="${strokeColor}"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

export default function MapaScreen({ darkMode = true, onViewStation }) {
  const [selectedPin, setSelectedPin] = useState(null);

  // URLs de mapa gratuitas (CartoDB) que se adaptan a modo claro / oscuro
  const tileLayerUrl = darkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <h2
        className={`text-base font-bold mb-3 transition-colors ${
          darkMode ? "text-zinc-100" : "text-zinc-800"
        }`}
      >
        Puntos de reciclaje en Calama
      </h2>

      <div className="flex-1 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-lg min-h-[400px] z-0">
        {/* Componente principal de Leaflet */}
        <MapContainer
          center={[-22.4589, -68.9285]} // [Latitud, Longitud] de Calama
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%", minHeight: "400px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url={tileLayerUrl}
          />

          {/* Renderizado de Marcadores */}
          {MAP_PINS?.map((pin) => {
            const meta = STATUS_META[getFillStatus(pin.fill)];
            const customIcon = createCustomPinIcon(meta.color, darkMode);

            return (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={customIcon}
                eventHandlers={{
                  click: () => setSelectedPin(pin),
                }}
              />
            );
          })}
        </MapContainer>

        {/* Leyenda de estado */}
        <div
          className={`absolute bottom-3 left-3 rounded-xl px-3 py-2 text-[10px] space-y-1 shadow-lg backdrop-blur-md border transition-colors z-[1000] ${
            darkMode
              ? "bg-zinc-950/80 border-zinc-800 text-zinc-300"
              : "bg-white/90 border-stone-200 text-stone-700"
          }`}
        >
          <LegendRow color={STATUS_META.low.color} label={`Verde · ${STATUS_META.low.label}`} />
          <LegendRow color={STATUS_META.medium.color} label={`Amarillo · ${STATUS_META.medium.label}`} />
          <LegendRow color={STATUS_META.full.color} label={`Rojo · ${STATUS_META.full.label}`} />
        </div>

        {/* Tarjeta desplegable al seleccionar un punto */}
        {selectedPin && (
          <div
            className={`absolute inset-x-3 bottom-3 rounded-2xl shadow-2xl border p-4 z-[1000] transition-colors ${
              darkMode
                ? "bg-zinc-900/95 border-zinc-800 text-white backdrop-blur-md"
                : "bg-white/95 border-stone-200 text-zinc-900 backdrop-blur-md"
            }`}
          >
            <button
              onClick={() => setSelectedPin(null)}
              className={`absolute top-3 right-3 p-1 rounded-lg transition-colors ${
                darkMode
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pr-6">
              {selectedPin.category && (
                <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-500 block mb-0.5">
                  {selectedPin.category}
                </span>
              )}
              <h3 className="text-sm font-bold leading-snug">{selectedPin.name}</h3>
              {selectedPin.address && (
                <p
                  className={`text-[11px] flex items-center gap-1 mt-1 ${
                    darkMode ? "text-zinc-400" : "text-stone-500"
                  }`}
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  {selectedPin.address}
                </p>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={darkMode ? "text-zinc-400" : "text-stone-500"}>
                  Capacidad
                </span>
                <span className="flex items-center gap-1.5">
                 <span
                    className="font-semibold"
                    style={{ color: STATUS_META[getFillStatus(selectedPin.fill)].color }}
                  >
                    {STATUS_META[getFillStatus(selectedPin.fill)].label}
                  </span>
                  <span className="font-bold">{selectedPin.fill}%</span>
                </span>
              </div>
              <div
                className={`w-full h-2 rounded-full overflow-hidden ${
                  darkMode ? "bg-zinc-800" : "bg-stone-200"
                }`}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${selectedPin.fill}%`,
                    backgroundColor:
                      STATUS_META[getFillStatus(selectedPin.fill)].color
                  }}
                />
              </div>
            </div>

            {selectedPin.acceptedMaterials && (
              <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center gap-1.5 flex-wrap">
                <Recycle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {selectedPin.acceptedMaterials.map((mat, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      darkMode
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {mat}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onViewStation?.(selectedPin)}
              className="w-full mt-3 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl shadow-md hover:bg-emerald-500 transition-all active:scale-[0.99]"
            >
              Ver estación en detalle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendRow({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="font-medium">{label}</span>
    </div>
  );
}