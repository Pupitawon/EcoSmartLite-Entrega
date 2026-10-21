import React, { useEffect, useState } from "react";
import { History, Truck, AlertTriangle, QrCode } from "lucide-react";
import { PICKUP_HISTORY, depositHistory, ANOMALY_TYPES } from "../data/mockData.js";
import { getReportes } from "../services/api.js";

/**
 * AdminHistorialScreen — Módulo Histórico y Trazabilidad (RF-03).
 * Consulta el historial de retiros, y los eventos ciudadanos que
 * alimentan la trazabilidad: depósitos validados (RF-06) y reportes
 * de anomalías (RF-05).
 */
export default function AdminHistorialScreen({ darkMode = true }) {
  const pickups = [...PICKUP_HISTORY].sort((a, b) => (a.date < b.date ? 1 : -1));
  // Reportes ciudadanos pendientes, desde el backend (ya vienen del más nuevo al más antiguo).
  const [pendingReports, setPendingReports] = useState([]);
  const [reportsError, setReportsError] = useState(null);
  useEffect(() => {
    let vivo = true;
    getReportes("pendiente")
      .then((r) => vivo && setPendingReports(r))
      .catch((e) => vivo && setReportsError(e.message));
    return () => { vivo = false; };
  }, []);

  return (
    <div className={`flex-1 flex flex-col gap-4 pb-24 transition-colors ${darkMode ? "text-white" : "text-zinc-900"}`}>
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-700/40 mt-1">
        <History className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold text-base">Histórico y Trazabilidad</h2>
      </div>

      {/* RF-03: historial de retiros por contenedor */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" />
          Retiros realizados
        </h3>
        <div className="space-y-2">
          {pickups.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl p-3 border flex items-center justify-between gap-3 ${
                darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-stone-200 bg-white"
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{p.stationName}</p>
                <p className={`text-[11px] ${darkMode ? "text-zinc-500" : "text-stone-400"}`}>
                  {p.date} · {p.emptiedBy}
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-amber-500">
                {p.fillAtPickup}% al retiro
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RF-05: reportes ciudadanos de anomalías, para intervención del equipo */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Reportes ciudadanos ({pendingReports.length})
        </h3>
        {pendingReports.length === 0 ? (
          <div
            className={`text-xs rounded-xl p-3 border ${
              darkMode ? "border-zinc-800 bg-zinc-900/60 text-zinc-400" : "border-stone-200 bg-white text-stone-500"
            }`}
          >
            {reportsError ? `No se pudieron cargar los reportes (${reportsError}).` : "No hay reportes ciudadanos pendientes."}
          </div>
        ) : (
          <div className="space-y-2">
            {pendingReports.map((r) => {
              const typeLabel = ANOMALY_TYPES.find((t) => t.id === r.tipo_anomalia)?.label ?? r.tipo_anomalia;
              return (
                <div
                  key={r.id_reporte}
                  className="rounded-xl p-3 border border-red-500/40 bg-red-500/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold truncate">
                      Contenedor #{r.id_contenedor}{r.nombre_material ? ` · ${r.nombre_material}` : ""}
                    </p>
                    <span className="shrink-0 text-[10px] text-zinc-400">
                      {new Date(r.fecha_reporte).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-red-500 mt-0.5">{typeLabel}</p>
                  {r.descripcion && (
                    <p className={`text-[11px] mt-1 ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
                      {r.descripcion}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RF-06: depósitos validados vía QR, como respaldo del incentivo ciudadano */}
      <div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          <QrCode className="w-3.5 h-3.5" />
          Depósitos validados ({depositHistory.length})
        </h3>
        {depositHistory.length === 0 ? (
          <div
            className={`text-xs rounded-xl p-3 border ${
              darkMode ? "border-zinc-800 bg-zinc-900/60 text-zinc-400" : "border-stone-200 bg-white text-stone-500"
            }`}
          >
            Aún no se registran depósitos validados en esta sesión.
          </div>
        ) : (
          <div className="space-y-2">
            {[...depositHistory].reverse().map((d) => (
              <div
                key={d.id}
                className={`rounded-xl p-3 border flex items-center justify-between gap-3 ${
                  darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-stone-200 bg-white"
                }`}
              >
                <p className="text-xs font-semibold truncate">{d.stationName}</p>
                <span className="shrink-0 text-[11px] font-bold text-emerald-500">
                  +{d.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
