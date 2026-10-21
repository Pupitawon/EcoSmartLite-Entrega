import React from "react";
import { Sparkles, Leaf } from "lucide-react";

/**
 * PointsCard - Tarjeta esmeralda que muestra el balance de ECO-Puntos.
 * Reutilizada en Inicio y Canjeo.
 */
export default function PointsCard({ points = 0, darkMode = true }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 shadow-lg border transition-all ${
        darkMode
          ? "bg-gradient-to-br from-emerald-900 via-emerald-950 to-zinc-900 border-emerald-800/40"
          : "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-emerald-900/20 border-emerald-500/30"
      }`}
    >
      {/* Etiqueta Superior */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          ECO-Puntos
        </span>
        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Disponibles
        </span>
      </div>

      {/* Valor en Puntos */}
      <div className="flex items-baseline gap-2 my-1">
        <Leaf className="w-6 h-6 text-emerald-400 fill-emerald-400/20 shrink-0 self-center" />
        <span className="text-3xl font-black tracking-tight text-white">
          {points}
        </span>
        <span className="text-xs font-bold text-emerald-300">pts</span>
      </div>

      <p className="text-[11px] text-emerald-200/70 mt-1">
        Canjéalos por cupones y beneficios exclusivos
      </p>

      {/* Resplandor decorativo */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}