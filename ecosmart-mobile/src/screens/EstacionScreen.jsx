import React, { useState } from "react";
import { ChevronLeft, Recycle, QrCode, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { STATUS_META, getFillStatus, ANOMALY_TYPES, submitAnomalyReport } from "../data/mockData.js";

/**
 * EstacionScreen (image_4.png)
 * Ilustración custom del contenedor/estación de reciclaje, con nivel y
 * capacidad simulados. Se accede desde el popover de un pin en el Mapa.
 * Incluye el flujo de reporte ciudadano de anomalías (RF-05).
 */
export default function EstacionScreen({ station, onBack, darkMode }) {
  const fill = station?.fill ?? 20;
  const meta = STATUS_META[getFillStatus(fill)];
  const name = station?.name ?? "Estación de reciclaje";

  const [reportOpen, setReportOpen] = useState(false);
  const [typeId, setTypeId] = useState(ANOMALY_TYPES[0].id);
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmitReport = (e) => {
    e.preventDefault();
    submitAnomalyReport({
      stationId: station?.id,
      stationName: name,
      typeId,
      description,
    });
    setSent(true);
  };

  const closeReport = () => {
    setReportOpen(false);
    setSent(false);
    setTypeId(ANOMALY_TYPES[0].id);
    setDescription("");
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-4 relative">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-stone-500 mb-2 self-start hover:text-stone-700"
      >
        <ChevronLeft className="w-4 h-4" /> Volver al mapa
      </button>

      <p className="text-center text-sm font-semibold text-stone-800 mb-2">
        {name}
      </p>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-52 h-52 flex items-center justify-center">
          <Recycle className="w-full h-full text-amber-500 opacity-90" />
          <div className="absolute w-20 h-32 bg-stone-700 rounded-md flex flex-col items-center justify-between p-2">
            <div className="w-10 h-6 bg-stone-500 rounded-sm" />
            <QrCode className="w-8 h-8 text-white" />
            <div
              className="w-8 h-3 rounded-sm"
              style={{ backgroundColor: meta.color }}
            />
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-3 bg-white rounded-2xl shadow-md shadow-stone-200/60 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-stone-700">Nivel</span>
          <span className="font-bold" style={{ color: meta.color }}>
            {fill}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${fill}%`, backgroundColor: meta.color }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-stone-700">Estado</span>
          <span className="font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* RF-05: botón para reportar contenedor dañado o con residuos incorrectos */}
      <button
        onClick={() => setReportOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-amber-500 text-amber-600 font-bold text-xs py-2.5 rounded-xl hover:bg-amber-50 transition-all active:scale-[0.99]"
      >
        <AlertTriangle className="w-4 h-4" />
        Reportar anomalía
      </button>

      {reportOpen && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full sm:max-w-xs rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl relative ${
              darkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
            }`}
          >
            <button
              onClick={closeReport}
              className={`absolute top-3 right-3 p-1 rounded-lg ${
                darkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-stone-400 hover:bg-stone-100"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {sent ? (
              <div className="py-4 flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="font-bold text-sm">¡Reporte enviado!</p>
                <p className="text-xs text-stone-500">
                  Gracias por avisar. El equipo de Innova Recicla revisará
                  este punto a la brevedad.
                </p>
                <button
                  onClick={closeReport}
                  className="mt-2 w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-500 transition-all"
                >
                  Listo
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm">Reportar anomalía</h3>
                </div>
                <p className="text-[11px] text-stone-500">{name}</p>

                <div className="space-y-1.5">
                  {ANOMALY_TYPES.map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-center gap-2 text-xs p-2 rounded-lg border cursor-pointer ${
                        typeId === t.id
                          ? "border-amber-500 bg-amber-500/10"
                          : darkMode
                          ? "border-zinc-800"
                          : "border-stone-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="anomaly-type"
                        value={t.id}
                        checked={typeId === t.id}
                        onChange={() => setTypeId(t.id)}
                        className="accent-amber-500"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe brevemente el problema (opcional)"
                  rows={3}
                  className={`w-full p-2.5 text-xs rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    darkMode
                      ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
                      : "bg-white border-stone-200 text-zinc-900 placeholder-zinc-400"
                  }`}
                />

                <button
                  type="submit"
                  className="w-full bg-amber-500 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-amber-400 transition-all active:scale-[0.99]"
                >
                  Enviar reporte
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}