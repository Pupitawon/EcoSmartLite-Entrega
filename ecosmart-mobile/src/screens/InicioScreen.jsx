import React from "react";
import { Recycle, Leaf, Award, Sparkles } from "lucide-react";
import { CANJES } from "../data/mockData.js";

const IMPACT_METRICS = [
  {
    id: "envases",
    icon: Recycle,
    iconColorDark: "text-emerald-400",
    iconBgDark: "bg-emerald-950/80 border-emerald-800/50",
    iconColorLight: "text-emerald-600",
    iconBgLight: "bg-emerald-100 border-emerald-200",
    value: "15",
    unit: "uds",
    label: "Envases reciclados",
    trend: "+3 esta semana",
  },
  {
    id: "co2",
    icon: Leaf,
    iconColorDark: "text-teal-400",
    iconBgDark: "bg-teal-950/80 border-teal-800/50",
    iconColorLight: "text-teal-600",
    iconBgLight: "bg-teal-100 border-teal-200",
    value: "3.5",
    unit: "kg",
    label: "CO2 evitado",
    trend: "Equiv. a 2 árboles",
  },
  {
    id: "nivel",
    icon: Award,
    iconColorDark: "text-amber-400",
    iconBgDark: "bg-amber-950/80 border-amber-800/50",
    iconColorLight: "text-amber-600",
    iconBgLight: "bg-amber-100 border-amber-200",
    value: "Activo",
    unit: "Nivel 2",
    label: "Rango Reciclador",
    progress: 60, // 60% de avance
  },
];

export default function InicioScreen({
  userName,
  points,
  darkMode = true,
  onNavigateToCanjeo,
}) {
  const handleQuickRedeem = (item) => {
    alert(`Iniciando canje rápido con "${item.label || item.name}"...`);
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 1. Saludo Principal */}
      <div>
        <h2 className={`text-xl font-black tracking-tight transition-colors ${
          darkMode ? "text-white" : "text-zinc-900"
        }`}>
          ¡Hola{" "}
          <span className={darkMode ? "text-emerald-400" : "text-emerald-600"}>
            {userName}!
          </span>
        </h2>
        <p className={`text-xs ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          Sigue reciclando y sumando impacto
        </p>
      </div>

      {/* 2. Tarjeta ECO-Puntos */}
      <div className={`relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all ${
        darkMode 
          ? "bg-gradient-to-br from-emerald-900 via-emerald-950 to-zinc-900 border border-emerald-800/40" 
          : "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-emerald-900/20"
      }`}>
        <div className="flex justify-between items-start mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            ECO-Puntos
          </span>
          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Nivel Activo
          </span>
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <Leaf className="w-6 h-6 text-emerald-400 fill-emerald-400/20 shrink-0 self-center" />
          <span className="text-3xl font-black tracking-tight text-white">{points}</span>
          <span className="text-xs font-bold text-emerald-300">pts</span>
        </div>

        <p className="text-[11px] text-emerald-200/70 mt-1">
          Canjéalos por descuentos y beneficios
        </p>

        {/* Círculo de luz decorativo */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 3. Tarjeta de Canjes Rápidos Optimizada */}
      <div className={`p-4 rounded-2xl border transition-colors shadow-sm ${
        darkMode
          ? "bg-zinc-900/90 border-zinc-800 text-white"
          : "bg-white border-stone-200 text-zinc-900"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Canjes Rápidos</h3>
          </div>
          {onNavigateToCanjeo && (
            <button
              onClick={onNavigateToCanjeo}
              className="text-xs text-emerald-500 font-bold hover:underline"
            >
              Ver todos
            </button>
          )}
        </div>

        {/* Scroll Horizontal Nativo y Suave */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {CANJES && CANJES.length > 0 ? (
            CANJES.map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => handleQuickRedeem(item)}
                className={`snap-start shrink-0 min-w-[110px] p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all hover:scale-105 active:scale-95 ${
                  darkMode 
                    ? "bg-zinc-950 border-zinc-800 hover:border-emerald-500/50" 
                    : "bg-stone-50 border-stone-200 hover:border-emerald-500/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-black uppercase text-emerald-500 truncate max-w-[65px]">
                    {item.label || item.name}
                  </span>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
                    {item.pts || "200"}p
                  </span>
                </div>
                <span className={`text-[11px] font-bold line-clamp-1 ${
                  darkMode ? "text-zinc-200" : "text-zinc-800"
                }`}>
                  {item.discount || item.desc || "Descuento"}
                </span>
              </button>
            ))
          ) : (
            /* Fallback estático tipo Ticket */
            [
              { name: "Sodimac", desc: "15% OFF", pts: "300" },
              { name: "Aramco", desc: "2x1 Eco", pts: "200" },
              { name: "Fluxus", desc: "20% OFF", pts: "450" },
              { name: "Mall Plaza", desc: "$5.000", pts: "500" },
            ].map((coupon, i) => (
              <button
                key={i}
                onClick={() => alert(`Canje rápido: ${coupon.name}`)}
                className={`snap-start shrink-0 min-w-[105px] p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all active:scale-95 ${
                  darkMode 
                    ? "bg-zinc-950 border-zinc-800 hover:border-emerald-500/40" 
                    : "bg-stone-50 border-stone-200 hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-black uppercase text-emerald-500 truncate max-w-[65px]">
                    {coupon.name}
                  </span>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
                    {coupon.pts}p
                  </span>
                </div>
                <span className={`text-[11px] font-extrabold ${darkMode ? "text-white" : "text-zinc-900"}`}>
                  {coupon.desc}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 4. Tu Impacto Ambiental Rediseñado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-black uppercase tracking-wider ${
            darkMode ? "text-zinc-300" : "text-zinc-700"
          }`}>
            Tu Impacto Ambiental
          </h3>
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Este mes
          </span>
        </div>

        {/* Grid de Métricas con Micro-Interacciones */}
        <div className="grid grid-cols-3 gap-2.5">
          {IMPACT_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.id}
                className={`p-3 rounded-2xl border flex flex-col justify-between text-left transition-all hover:scale-[1.02] active:scale-95 shadow-sm relative overflow-hidden ${
                  darkMode
                    ? "bg-zinc-900/90 border-zinc-800 text-white hover:border-zinc-700"
                    : "bg-white border-stone-200 text-zinc-900 hover:border-stone-300"
                }`}
              >
                {/* Cabecera del Icono */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                    darkMode ? metric.iconBgDark : metric.iconBgLight
                  }`}>
                    <Icon className={`w-4 h-4 ${darkMode ? metric.iconColorDark : metric.iconColorLight}`} />
                  </div>
                </div>

                {/* Valor y Unidad */}
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black tracking-tight">{metric.value}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{metric.unit}</span>
                  </div>
                  <p className={`text-[10px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                    darkMode ? "text-zinc-400" : "text-stone-500"
                  }`}>
                    {metric.label}
                  </p>
                </div>

                {/* Barra de Progreso o Tendencia */}
                {metric.progress ? (
                  <div className="mt-2 w-full">
                    <div className="flex justify-between text-[8px] font-bold text-amber-500 mb-0.5">
                      <span>Progreso</span>
                      <span>{metric.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full" 
                        style={{ width: `${metric.progress}%` }} 
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] font-semibold text-emerald-500 mt-1 truncate">
                    {metric.trend}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}