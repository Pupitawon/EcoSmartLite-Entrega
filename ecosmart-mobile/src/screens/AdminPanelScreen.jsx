import React from "react";
import { LayoutDashboard, AlertTriangle, Boxes, Gauge, MapPin } from "lucide-react";
import { MAP_PINS, STATUS_META, getFillStatus, getActiveAlerts } from "../data/mockData.js";

/**
 * AdminPanelScreen — Panel de Control Operativo (Innova Recicla)
 * RF-01 Monitoreo en Tiempo Real + RF-02 Alertas Preventivas de Llenado.
 */
export default function AdminPanelScreen({ darkMode = true }) {
  const alerts = getActiveAlerts(); // contenedores >= 80% (RF-02)
  const avgFill = Math.round(
    MAP_PINS.reduce((sum, p) => sum + p.fill, 0) / MAP_PINS.length
  );

  return (
    <div className={`flex-1 flex flex-col gap-4 pb-24 transition-colors ${darkMode ? "text-white" : "text-zinc-900"}`}>
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-700/40 mt-1">
        <LayoutDashboard className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold text-base">Panel de Control Operativo</h2>
      </div>

      {/* Tarjetas resumen (RF-01) */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          darkMode={darkMode}
          icon={Boxes}
          value={MAP_PINS.length}
          label="Contenedores"
          color="text-emerald-500"
        />
        <SummaryCard
          darkMode={darkMode}
          icon={AlertTriangle}
          value={alerts.length}
          label="En alerta"
          color="text-red-500"
        />
        <SummaryCard
          darkMode={darkMode}
          icon={Gauge}
          value={`${avgFill}%`}
          label="Llenado prom."
          color="text-amber-500"
        />
      </div>

      {/* RF-02: Alertas preventivas (>= 80% de capacidad) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Alertas activas (≥ 80%)
        </h3>

        {alerts.length === 0 ? (
          <div
            className={`text-xs rounded-xl p-3 border ${
              darkMode ? "border-zinc-800 bg-zinc-900/60 text-zinc-400" : "border-stone-200 bg-white text-stone-500"
            }`}
          >
            Sin alertas activas. Todos los contenedores están bajo el 80% de capacidad.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((pin) => (
              <div
                key={pin.id}
                className="rounded-xl p-3 border border-red-500/40 bg-red-500/10 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{pin.name}</p>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {pin.address}
                  </p>
                </div>
                <span className="shrink-0 text-red-500 font-black text-lg">{pin.fill}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RF-01: Monitoreo en tiempo real de todos los contenedores del piloto */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          Todos los contenedores
        </h3>
        <div className="space-y-2">
          {MAP_PINS.map((pin) => {
            const meta = STATUS_META[getFillStatus(pin.fill)];
            return (
              <div
                key={pin.id}
                className={`rounded-xl p-3 border flex items-center gap-3 ${
                  darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-stone-200 bg-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{pin.name}</p>
                  <p className={`text-[11px] truncate ${darkMode ? "text-zinc-500" : "text-stone-400"}`}>
                    {pin.category} · {pin.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: meta.color }}>
                    {pin.fill}%
                  </p>
                  <p className="text-[10px]" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ darkMode, icon: Icon, value, label, color }) {
  return (
    <div
      className={`rounded-xl p-3 border flex flex-col items-center text-center gap-1 ${
        darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-stone-200 bg-white"
      }`}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <p className="text-lg font-black leading-none">{value}</p>
      <p className={`text-[10px] ${darkMode ? "text-zinc-500" : "text-stone-400"}`}>{label}</p>
    </div>
  );
}
