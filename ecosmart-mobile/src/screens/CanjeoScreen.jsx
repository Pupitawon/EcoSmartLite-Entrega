import React, { useState } from "react";
import { ChevronLeft, Search, Sparkles, CheckCircle2, ShoppingBag } from "lucide-react";
import PointsCard from "../components/PointsCard.jsx";
import { CANJEO_CATALOGO } from "../data/mockData.js";

/**
 * CanjeoScreen
 * Muestra el catálogo de canjes organizado por categorías con opción
 * de búsqueda, vista detallada del cupón y confirmación de canje.
 */
export default function CanjeoScreen({ points, userName, darkMode = true }) {
  const [selected, setSelected] = useState(null);
  const [redeemed, setRedeemed] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Vista de detalle cuando el usuario selecciona una marca/beneficio
  if (selected) {
    const isDone = redeemed[selected.id];
    const canAfford = points >= (selected.pts || 0);

    return (
      <div className={`flex-1 p-5 overflow-y-auto min-h-screen transition-colors ${
        darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-zinc-900"
      }`}>
        {/* Botón Volver */}
        <button
          onClick={() => setSelected(null)}
          className={`text-xs font-bold flex items-center gap-1.5 mb-5 px-3 py-1.5 rounded-xl border transition-all ${
            darkMode 
              ? "text-zinc-300 border-zinc-800 bg-zinc-900 hover:border-zinc-700" 
              : "text-stone-600 border-stone-200 bg-white hover:bg-stone-100"
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Volver al catálogo
        </button>

        {/* Tarjeta de Detalle del Beneficio */}
        <div className={`rounded-2xl p-6 shadow-xl border relative overflow-hidden transition-all ${
          selected.bg && selected.bg !== "bg-white"
            ? `${selected.bg} text-white border-transparent`
            : darkMode
              ? "bg-zinc-900 border-zinc-800 text-white"
              : "bg-white border-stone-200 text-zinc-900 shadow-stone-200/50"
        }`}>
          {/* Header del Item */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-md border ${
                selected.bg === "bg-white" || !selected.bg 
                  ? "bg-emerald-500 text-zinc-950 border-emerald-400" 
                  : "bg-white/20 text-white border-white/30 backdrop-blur-md"
              }`}>
                {selected.label ? selected.label.slice(0, 3).toUpperCase() : "ECO"}
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">{selected.label}</h3>
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
                  {selected.category || "Beneficio Exclusivo"}
                </span>
              </div>
            </div>

            {selected.pts && (
              <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {selected.pts} Pts
              </span>
            )}
          </div>

          {/* Descripción */}
          <p className="text-xs leading-relaxed opacity-90 mb-6 bg-black/10 p-3 rounded-xl border border-white/10">
            {selected.desc || "Utiliza tus ECO-Puntos acumulados para canjear este beneficio exclusivo en tiendas asociadas."}
          </p>

          {/* Botón de Acción Principal */}
          <button
            onClick={() => {
              if (canAfford) {
                setRedeemed((prev) => ({ ...prev, [selected.id]: true }));
              }
            }}
            disabled={isDone || !canAfford}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              isDone
                ? "bg-emerald-500 text-zinc-950 cursor-default"
                : !canAfford
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 active:scale-95 shadow-emerald-500/20"
            }`}
          >
            {isDone ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> ¡Canje Realizado!
              </>
            ) : !canAfford ? (
              `Te faltan ${(selected.pts || 0) - points} Pts`
            ) : (
              "Confirmar y Canjear"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Vista Principal de Lista de Categorías
  return (
    <div className={`flex-1 overflow-y-auto pb-8 min-h-screen transition-colors ${
      darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-zinc-900"
    }`}>
      {/* Saludo e Información del Usuario */}
      <div className="px-5 pt-4">
        <h2 className="text-xl font-black tracking-tight">Catálogo de Canjes</h2>
        <p className={`text-xs ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          ¡Hola {userName}! Descubre dónde usar tus puntos
        </p>
      </div>

      {/* Tarjeta de Saldo */}
      <div className="px-5 my-3">
        <PointsCard points={points} darkMode={darkMode} />
      </div>

      {/* Barra de Búsqueda */}
      <div className="px-5 mb-4">
        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
          darkMode ? "bg-zinc-900 border-zinc-800 focus-within:border-emerald-500/50" : "bg-white border-stone-200"
        }`}>
          <Search className={`w-4 h-4 ${darkMode ? "text-zinc-500" : "text-stone-400"}`} />
          <input
            type="text"
            placeholder="Buscar comercios o marcas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Secciones por Categoría */}
      <div className="space-y-4 px-5">
        {Object.entries(CANJEO_CATALOGO || {}).map(([category, list]) => {
          // Filtrado por búsqueda
          const filteredList = list.filter((item) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredList.length === 0) return null;

          return (
            <div
              key={category}
              className={`rounded-2xl border p-4 transition-all shadow-sm ${
                darkMode
                  ? "bg-zinc-900/90 border-zinc-800"
                  : "bg-white border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black uppercase tracking-wider ${
                  darkMode ? "text-zinc-300" : "text-zinc-800"
                }`}>
                  {category}
                </span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {filteredList.length} disponibles
                </span>
              </div>

              {/* Grid o Carousel Horizontal de Opciones */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
                {filteredList.map((item) => {
                  const isRedeemed = redeemed[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelected({ ...item, category })}
                      className={`snap-start shrink-0 min-w-[100px] p-3 rounded-xl border flex flex-col items-center text-center transition-all hover:scale-105 active:scale-95 relative ${
                        darkMode 
                          ? "bg-zinc-950 border-zinc-800 hover:border-emerald-500/50 text-white" 
                          : "bg-stone-50 border-stone-200 hover:border-emerald-500/50 text-zinc-900"
                      }`}
                    >
                      {/* Avatar Marca */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs mb-2 shadow-sm ${
                        item.bg && item.bg !== "bg-white" 
                          ? `${item.bg} ${item.text || "text-white"}` 
                          : "bg-emerald-500 text-zinc-950"
                      }`}>
                        {item.label.slice(0, 3).toUpperCase()}
                      </div>

                      {/* Nombre y Puntos */}
                      <span className="text-[11px] font-bold line-clamp-1 w-full">
                        {item.label}
                      </span> 

                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 border border-amber-500/20">
                        {item.pts ? `${item.pts} pts` : "Ver canje"}
                      </span>

                      {/* Indicador de Canjeado */}
                      {isRedeemed && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}