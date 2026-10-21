import React, { useState } from "react";
import { Crown, Recycle, Lock, Medal, Calendar, Zap, ChevronRight, Award } from "lucide-react";
import { INSIGNIAS, RANKING } from "../data/mockData.js";

export default function LogrosScreen({ 
  weeklyGoal = 1000, 
  weeklyProgress = 500, 
  onNavigateToInsignias,
  darkMode = false 
}) {
  const [activeTab, setActiveTab] = useState("semanales");

  const misionesDiarias = [
    { id: 1, title: "Primer Escaneo", desc: "Escanea 1 contenedor hoy", pts: 50, current: 1, total: 1 },
    { id: 2, title: "Reciclador Constante", desc: "Escanea 3 códigos QR", pts: 100, current: 2, total: 3 },
  ];

  const pct = Math.min(Math.round((weeklyProgress / weeklyGoal) * 100), 100);
  const preview = INSIGNIAS.slice(0, 5);

  // Helper para bordes y fondos del ranking con alto contraste
  const getRankCardStyle = (index) => {
    switch (index) {
      case 0: // 1er Lugar (Oro)
        return darkMode
          ? "bg-amber-950/30 border-amber-500/50 shadow-amber-950/20"
          : "bg-amber-50/90 border-amber-300 shadow-amber-100/50";
      case 1: // 2do Lugar (Plata)
        return darkMode
          ? "bg-slate-900/80 border-slate-700/80"
          : "bg-slate-100/90 border-slate-300 shadow-slate-100/50";
      case 2: // 3er Lugar (Bronce)
        return darkMode
          ? "bg-orange-950/20 border-orange-800/40"
          : "bg-orange-50/70 border-orange-200 shadow-orange-100/50";
      default: // Resto de posiciones
        return darkMode
          ? "bg-zinc-900 border-zinc-800"
          : "bg-white border-stone-200 shadow-stone-100/50";
    }
  };

  // Helper para los íconos/avatares del podio con manejo de error en imágenes
  const renderRankBadge = (index, avatar, name) => {
    const [imgError, setImgError] = useState(false);

    if (avatar && !imgError) {
      return (
        <img 
          src={avatar} 
          alt={name} 
          onError={() => setImgError(true)}
          className="w-7 h-7 rounded-full object-cover border border-white/20 shadow-sm shrink-0" 
        />
      );
    }

    switch (index) {
      case 0:
        return (
          <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md shadow-amber-400/30 shrink-0">
            <Crown className="w-4 h-4 fill-amber-950/20" />
          </span>
        );
      case 1:
        return (
          <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center shadow-sm shrink-0">
            <Medal className="w-3.5 h-3.5" />
          </span>
        );
      case 2:
        return (
          <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center shadow-sm shrink-0">
            <Award className="w-3.5 h-3.5" />
          </span>
        );
      default:
        return (
          <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            darkMode 
              ? "bg-zinc-800 text-emerald-400" 
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}>
            <Recycle className="w-3.5 h-3.5" />
          </span>
        );
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto pb-24 transition-colors duration-200 ${
      darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-stone-900"
    }`}>
      
      {/* 1. SELECTOR SEMANALES / DIARIAS */}
      <div className={`mx-5 mt-4 p-1 rounded-2xl flex gap-1 ${
        darkMode ? "bg-zinc-900 border border-zinc-800" : "bg-stone-200/70"
      }`}>
        <button
          onClick={() => setActiveTab("semanales")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "semanales"
              ? "bg-emerald-600 text-white shadow-sm"
              : darkMode ? "text-zinc-400 hover:text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Semanales
        </button>
        <button
          onClick={() => setActiveTab("diarias")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "diarias"
              ? "bg-emerald-600 text-white shadow-sm"
              : darkMode ? "text-zinc-400 hover:text-white" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Diarias
        </button>
      </div>

      {/* 2. TARJETA PRINCIPAL DE LOGROS */}
      <div className={`mx-5 mt-4 rounded-2xl overflow-hidden text-white shadow-lg transition-colors ${
        darkMode 
          ? "bg-gradient-to-br from-emerald-900 to-zinc-900 border border-emerald-800/50" 
          : "bg-emerald-700 shadow-emerald-900/10"
      }`}>
        <p className="text-center text-xs font-bold uppercase tracking-wider py-2.5 bg-black/20">
          {activeTab === "semanales" ? "Logros semanales" : "Logros diarios"}
        </p>

        {activeTab === "semanales" ? (
          <div className="px-5 pb-5 pt-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-emerald-400 rounded-full flex items-center pl-2 text-[10px] font-black text-emerald-950 transition-all duration-500 shadow-sm"
                  style={{ width: `${pct}%` }}
                >
                  {weeklyProgress} pts
                </div>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-white text-emerald-800 text-xs font-black flex items-center justify-center shadow-md shrink-0">
              {pct}%
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {misionesDiarias.map((m) => {
              const dPct = Math.round((m.current / m.total) * 100);
              return (
                <div key={m.id} className="bg-black/20 p-2.5 rounded-xl border border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{m.title}</span>
                    <span className="text-emerald-300">+{m.pts} pts</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${dPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SECCIÓN INSIGNIAS */}
      <div className={`mx-5 mt-5 rounded-2xl p-4 transition-colors ${
        darkMode 
          ? "bg-zinc-900 border border-zinc-800 shadow-sm" 
          : "bg-white border border-stone-100 shadow-sm"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onNavigateToInsignias}
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
              darkMode ? "text-zinc-200 hover:text-emerald-400" : "text-stone-800 hover:text-emerald-600"
            }`}
          >
            Insignias
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
          <span 
            onClick={onNavigateToInsignias}
            className="text-[11px] text-stone-400 font-medium cursor-pointer hover:underline"
          >
            Ver todas
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {preview.map((b) => (
            <button
              key={b.id}
              onClick={onNavigateToInsignias}
              title={b.label}
              className={`relative w-11 h-11 rounded-xl border-2 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm overflow-hidden p-1 ${
                b.unlocked
                  ? darkMode 
                    ? "border-emerald-500/80 bg-emerald-500/10 text-emerald-400"
                    : "border-emerald-500 bg-emerald-50/60 text-emerald-600"
                  : darkMode
                    ? "border-zinc-800 bg-zinc-950 text-zinc-600"
                    : "border-stone-200 bg-stone-100 text-stone-400 opacity-60"
              }`}
            >
              {b.image ? (
                <img 
                  src={b.image} 
                  alt={b.label} 
                  className={`w-full h-full object-contain transition-all ${
                    b.unlocked ? "opacity-100" : "opacity-40 grayscale"
                  }`}
                />
              ) : b.unlocked ? (
                <Recycle className="w-5 h-5" />
              ) : (
                <Lock className="w-4 h-4 text-stone-500" />
              )}

              {!b.unlocked && b.image && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px]">
                  <Lock className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. RANKING */}
      <div className="mx-5 mt-5">
        <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-3 ${
          darkMode ? "text-zinc-200" : "text-stone-800"
        }`}>
          <span className="text-emerald-500 font-black">@</span> Ranking
        </p>

        <ul className="space-y-2">
          {(RANKING || []).map((r, i) => {
            const cardStyle = getRankCardStyle(i);

            return (
              <li
                key={r.id || r.name}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 border shadow-sm transition-all ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  {renderRankBadge(i, r.avatar, r.name)}

                  <span
                    className={`text-xs ${
                      i === 0 
                        ? darkMode ? "font-extrabold text-amber-400 text-sm" : "font-extrabold text-amber-600 text-sm"
                        : i === 1 
                          ? darkMode ? "font-extrabold text-slate-200 text-sm" : "font-extrabold text-slate-800 text-sm"
                          : i === 2 
                            ? darkMode ? "font-extrabold text-orange-300 text-sm" : "font-extrabold text-orange-800 text-sm"
                            : darkMode ? "font-bold text-zinc-100" : "font-bold text-stone-900"
                    }`}
                  >
                    {i + 1}. {r.name}
                  </span>
                </div>

                <span
                  className={`text-xs tabular-nums ${
                    i === 0 
                      ? darkMode ? "font-black text-amber-400 text-sm" : "font-black text-amber-600 text-sm"
                      : i === 1
                        ? darkMode ? "font-black text-slate-200 text-sm" : "font-black text-slate-800 text-sm"
                        : i === 2
                          ? darkMode ? "font-black text-orange-300 text-sm" : "font-black text-orange-800 text-sm"
                          : darkMode ? "font-bold text-zinc-100" : "font-bold text-stone-900"
                  }`}
                >
                  {r.pts} pts
                </span>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}