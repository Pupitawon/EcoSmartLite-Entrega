import React from "react";
import { LayoutDashboard, AlertTriangle, Boxes, Gauge, MapPin, WifiOff, RefreshCw } from "lucide-react";
import { STATUS_META, FILL_THRESHOLDS } from "../data/mockData.js";
import useContenedoresEnVivo, { estaSinReporte, hace } from "../hooks/useContenedoresEnVivo.js";
import { apiUrl } from "../services/api.js";

/**
 * AdminPanelScreen — Panel de Control Operativo (Innova Recicla)
 * RF-01 Monitoreo en Tiempo Real + RF-02 Alertas Preventivas de Llenado.
 *
 * Datos reales del backend (/api/contenedores, /api/alertas) y actualización automática por
 * Server-Sent Events: cuando llega una lectura nueva, la fila se actualiza sola.
 */
export default function AdminPanelScreen({ darkMode = true }) {
  const { contenedores, alertas, config, conexion, cargado, error, actualizados, ahora, recargar } =
    useContenedoresEnVivo();
  const umbral = config.umbral_alerta;

  // Estado de color según el % (el umbral de "Lleno" es el mismo de la alerta).
  const estadoDe = (pct) => (pct >= umbral ? "full" : pct >= FILL_THRESHOLDS.MEDIUM ? "medium" : "low");
  const sinLectura = (c) => !c.fecha_ultima_lectura;
  const sinReporte = (c) => estaSinReporte(c, ahora, config.sin_reporte_horas);

  // En alerta: alerta pendiente registrada, o último valor ya sobre el umbral.
  const enAlerta = contenedores.filter((c) => c.alerta_activa || (!sinLectura(c) && c.porcentaje_llenado >= umbral));
  const cantSinReporte = contenedores.filter(sinReporte).length;
  const conLectura = contenedores.filter((c) => !sinLectura(c));
  const avgFill = conLectura.length
    ? Math.round(conLectura.reduce((s, c) => s + c.porcentaje_llenado, 0) / conLectura.length)
    : null;
  const alertaDe = (id) => alertas.find((a) => a.id_contenedor === id && a.estado_alerta === "pendiente");

  const card = darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-stone-200 bg-white";
  const tenue = darkMode ? "text-zinc-500" : "text-stone-400";

  return (
    <div className={`flex-1 flex flex-col gap-4 pb-24 transition-colors ${darkMode ? "text-white" : "text-zinc-900"}`}>
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-700/40 mt-1">
        <LayoutDashboard className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold text-base">Panel de Control Operativo</h2>
        <EstadoConexion conexion={conexion} cargado={cargado} tenue={tenue} />
      </div>

      {/* Sin datos todavía: cargando o servidor inalcanzable */}
      {!cargado && !error && (
        <div className={`text-xs rounded-xl p-3 border ${card} ${tenue}`}>Cargando contenedores…</div>
      )}
      {!cargado && error && (
        <div className="rounded-xl p-3 border border-red-500/40 bg-red-500/10 text-xs flex items-start gap-2">
          <WifiOff className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold">No se pudo conectar con el servidor</p>
            <p className={`mt-0.5 break-words ${tenue}`}>{apiUrl} · {error}</p>
            <button
              onClick={recargar}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 text-white px-3 py-1.5 font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </button>
          </div>
        </div>
      )}

      {cargado && (
        <>
          {/* Tarjetas resumen (RF-01) */}
          <div className="grid grid-cols-4 gap-2">
            <SummaryCard darkMode={darkMode} icon={Boxes} value={contenedores.length} label="Contenedores" color="text-emerald-500" />
            <SummaryCard darkMode={darkMode} icon={AlertTriangle} value={enAlerta.length} label="En alerta" color="text-red-500" />
            <SummaryCard darkMode={darkMode} icon={WifiOff} value={cantSinReporte} label="Sin reporte" color="text-amber-500" />
            <SummaryCard darkMode={darkMode} icon={Gauge} value={avgFill === null ? "—" : `${avgFill}%`} label="Llenado prom." color="text-sky-500" />
          </div>

          {/* RF-02: Alertas preventivas (>= umbral de capacidad) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Alertas activas (≥ {umbral}%)
            </h3>

            {enAlerta.length === 0 ? (
              <div className={`text-xs rounded-xl p-3 border ${darkMode ? "text-zinc-400" : "text-stone-500"} ${card}`}>
                Sin alertas activas. Todos los contenedores están bajo el {umbral}% de capacidad.
              </div>
            ) : (
              <div className="space-y-2">
                {enAlerta.map((c) => {
                  const a = alertaDe(c.id_contenedor);
                  return (
                    <div
                      key={c.id_contenedor}
                      className="rounded-xl p-3 border border-red-500/40 bg-red-500/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">Contenedor #{c.id_contenedor}</p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {c.nombre_material ?? "Sin material"}
                          {a?.fecha_generacion ? ` · alerta ${hace(a.fecha_generacion, ahora)}` : ""}
                        </p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {c.latitud?.toFixed(4)}, {c.longitud?.toFixed(4)}
                        </p>
                      </div>
                      <span className="shrink-0 text-red-500 font-black text-lg">{Math.round(c.porcentaje_llenado)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RF-01: Monitoreo en tiempo real de todos los contenedores del piloto */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
              Todos los contenedores
            </h3>
            {contenedores.length === 0 ? (
              <div className={`text-xs rounded-xl p-3 border ${card} ${tenue}`}>Todavía no hay contenedores registrados.</div>
            ) : (
              <div className="space-y-2">
                {contenedores.map((c) => {
                  const nunca = sinLectura(c);
                  const stale = sinReporte(c);
                  const meta = nunca ? { color: "#71717a", label: "Sin lectura" } : STATUS_META[estadoDe(c.porcentaje_llenado)];
                  return (
                    <div
                      key={c.id_contenedor}
                      className={`rounded-xl p-3 border flex items-center gap-3 transition-shadow duration-500 ${card} ${
                        actualizados[c.id_contenedor] ? "ring-2 ring-emerald-500/60" : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate">Contenedor #{c.id_contenedor}</p>
                          {stale && (
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-500 px-1.5 py-0.5 text-[10px] font-bold">
                              <WifiOff className="w-2.5 h-2.5" />
                              Sin reporte
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate ${stale && !nunca ? "text-amber-500" : tenue}`}>
                          {c.nombre_material ?? "Sin material"} · {hace(c.fecha_ultima_lectura, ahora)}
                        </p>
                        {!nunca && (
                          <div className={`h-1 rounded-full mt-1.5 overflow-hidden ${darkMode ? "bg-zinc-800" : "bg-stone-200"}`}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, c.porcentaje_llenado)}%`, backgroundColor: meta.color }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold" style={{ color: meta.color }}>
                          {nunca ? "—" : `${Math.round(c.porcentaje_llenado)}%`}
                        </p>
                        <p className="text-[10px]" style={{ color: meta.color }}>
                          {meta.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EstadoConexion({ conexion, cargado, tenue }) {
  if (!cargado) return null;
  const enVivo = conexion === "en_vivo";
  return (
    <span className={`ml-auto inline-flex items-center gap-1.5 text-[11px] ${enVivo ? "text-emerald-500" : "text-amber-500"}`}>
      <span className={`w-2 h-2 rounded-full ${enVivo ? "bg-emerald-500" : "bg-amber-500"}`} />
      <span className={enVivo ? "" : tenue}>{enVivo ? "En vivo" : "Reconectando…"}</span>
    </span>
  );
}

function SummaryCard({ darkMode, icon: Icon, value, label, color }) {
  return (
    <div
      className={`rounded-xl p-2.5 border flex flex-col items-center text-center gap-1 ${
        darkMode ? "border-zinc-800 bg-zinc-900/60" : "border-stone-200 bg-white"
      }`}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <p className="text-lg font-black leading-none">{value}</p>
      <p className={`text-[10px] leading-tight ${darkMode ? "text-zinc-500" : "text-stone-400"}`}>{label}</p>
    </div>
  );
}
