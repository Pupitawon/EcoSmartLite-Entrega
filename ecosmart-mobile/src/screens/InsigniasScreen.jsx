import React from "react";
import { 
  ChevronLeft, 
  Bike, 
  Droplet, 
  Zap, 
  Users, 
  Sprout, 
  Globe, 
  Trash2, 
  Home, 
  MapPin, 
  Lock, 
  ShieldCheck, 
  Leaf 
} from "lucide-react";
import { INSIGNIAS } from "../data/mockData.js";

// Mapeo dinámico de íconos según la imagen disponible o el label de cada insignia
const getBadgeIcon = (badge) => {
  const { label, unlocked, image } = badge;
  const iconProps = { className: "w-6 h-6" };

  // Si tiene imagen asociada, la renderiza
  if (image) {
    return (
      <img 
        src={image} 
        alt={label} 
        className={`w-full h-full object-contain p-1 transition-all ${
          unlocked ? "opacity-100" : "opacity-40 grayscale"
        }`} 
      />
    );
  }

  // Fallback si la insignia está bloqueada y no hay imagen
  if (!unlocked) {
    return <Lock className="w-5 h-5 text-amber-800/60 dark:text-amber-500/80" />;
  }

  // Fallback por íconos de Lucide
  switch (label) {
    case "Movilidad Verde":
      return <Bike {...iconProps} />;
    case "Gota a Gota":
      return <Droplet {...iconProps} />;
    case "Mente Eficiente":
      return <Zap {...iconProps} />;
    case "Poder de Grupo":
      return <Users {...iconProps} />;
    case "Ciclo de Vida":
      return <Sprout {...iconProps} />;
    case "Cielo de Vida":
      return <Globe {...iconProps} />;
    case "Reciclador Activo":
      return <Trash2 {...iconProps} />;
    case "Hogar Eficiente":
      return <Home {...iconProps} />;
    case "Ruta Sostenible":
      return <MapPin {...iconProps} />;
    case "Patria Local":
      return <MapPin {...iconProps} />;
    case "Pionero Verde":
      return <Leaf {...iconProps} />;
    case "Guardián Tierra":
      return <ShieldCheck {...iconProps} />;
    default:
      return <Sprout {...iconProps} />;
  }
};

/**
 * InsigniasScreen
 * Soporta modo claro/oscuro dinámico y renderiza iconos o imágenes temáticas por cada insignia.
 */
export default function InsigniasScreen({ onBack, darkMode = false }) {
  return (
    <div className={`flex-1 overflow-y-auto pb-24 transition-colors duration-200 ${
      darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-stone-900"
    }`}>
      {/* Botón Volver y Título */}
      <div className="flex items-center gap-2 mx-5 mt-4 mb-4">
        <button
          onClick={onBack}
          aria-label="Volver a Logros"
          className={`p-1.5 rounded-xl transition-colors ${
            darkMode 
              ? "text-zinc-400 hover:text-white hover:bg-zinc-900" 
              : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/60"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className={`text-sm font-extrabold tracking-wide ${
          darkMode ? "text-zinc-100" : "text-stone-800"
        }`}>
          Insignias:
        </p>
      </div>

      {/* Grid de 3 columnas para Insignias */}
      <div className="mx-5 grid grid-cols-3 gap-3">
        {INSIGNIAS.map((b) => (
          <div key={b.id} className="flex flex-col items-center gap-1.5">
            <div
              className={`relative w-full aspect-square rounded-2xl border-2 flex items-center justify-center shadow-sm transition-transform active:scale-95 hover:scale-105 overflow-hidden ${
                b.unlocked
                  ? darkMode
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-emerald-950/30"
                    : "border-emerald-500 bg-emerald-50/80 text-emerald-600 shadow-emerald-100"
                  : darkMode
                    ? "border-amber-700/60 bg-amber-950/20 text-amber-500"
                    : "border-amber-700/80 bg-amber-500/5 text-amber-900"
              }`}
            >
              {getBadgeIcon(b)}

              {/* Candado superpuesto para imágenes bloqueadas */}
              {!b.unlocked && b.image && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                  <Lock className="w-5 h-5 text-amber-800/80 dark:text-amber-500/90 drop-shadow" />
                </div>
              )}
            </div>

            <span className={`text-[10px] text-center font-bold leading-tight ${
              b.unlocked
                ? darkMode ? "text-emerald-400" : "text-emerald-950"
                : darkMode ? "text-amber-500/80" : "text-amber-900/80"
            }`}>
              {b.label}
              {!b.unlocked && (
                <span className="block text-[8px] font-medium opacity-75">
                  (Bloqueado)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}