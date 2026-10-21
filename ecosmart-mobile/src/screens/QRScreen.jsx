import React, { useState } from "react";
import { Camera, QrCode, Keyboard, AlertCircle, Flashlight, FlashlightOff, CheckCircle2, Sparkles } from "lucide-react";
import { findStationByQrCode, registerDeposit, POINTS_PER_DEPOSIT } from "../data/mockData.js";

export default function QRScreen({ points, onScanned, darkMode = true }) {
  const [mode, setMode] = useState("scan"); // scan | manual | done
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [flashOn, setFlashOn] = useState(false);
  const [validatedStation, setValidatedStation] = useState(null);
  const [scannedCodes, setScannedCodes] = useState([]); // evita doble validación del mismo código en la sesión
  const EARNED = POINTS_PER_DEPOSIT;

  const handleValidateManual = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("Por favor, ingresa un código.");
      return;
    }

    // RF-06: el código debe corresponder a un contenedor real del piloto,
    // no solo cumplir un formato genérico.
    const station = findStationByQrCode(cleanCode);

    if (!station) {
      setError("Código no reconocido. Verifica el código impreso en el contenedor (ej: ECO-BIN-XXXX).");
      return;
    }

    if (scannedCodes.includes(cleanCode)) {
      setError("Este código ya fue validado en esta sesión.");
      return;
    }

    setError("");
    registerDeposit(station); // queda registrado para el histórico (RF-03)
    setScannedCodes((prev) => [...prev, cleanCode]);
    setValidatedStation(station);
    onScanned?.(EARNED);
    setMode("done");
  };

  // 1. MODO MANUAL
  if (mode === "manual") {
    return (
      <div className={`flex-1 flex flex-col justify-between px-6 pt-6 pb-28 transition-colors ${
        darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-stone-900"
      }`}>
        <div>
          <h2 className={`text-base font-bold mb-1 ${darkMode ? "text-white" : "text-stone-800"}`}>
            Ingresar código manualmente
          </h2>
          <p className={`text-xs mb-6 ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
            Formato exacto:{" "}
            <span className="font-mono font-bold text-emerald-500">
              ECO-BIN-XXXX
            </span>{" "}
            (mínimo 3 caracteres alfanuméricos)
          </p>

          <form onSubmit={handleValidateManual} className="space-y-4">
            <div
              className={`flex items-center gap-3 border rounded-2xl px-4 py-3.5 shadow-sm transition-all ${
                error
                  ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
                  : darkMode
                  ? "border-zinc-800 bg-zinc-900 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
                  : "border-stone-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
              }`}
            >
              <Keyboard className="w-5 h-5 text-emerald-500 shrink-0" />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Ej: ECO-BIN-MLZ1"
                className={`w-full text-sm font-mono uppercase bg-transparent outline-none tracking-wider ${
                  darkMode ? "text-white placeholder:text-zinc-600" : "text-stone-900 placeholder:text-stone-400"
                }`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-medium px-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-md transition-all active:scale-95"
            >
              Validar e Ingresar
            </button>
          </form>
        </div>

        <button
          onClick={() => {
            setMode("scan");
            setError("");
            setCode("");
          }}
          className={`text-xs text-center font-semibold transition-colors py-2 ${
            darkMode ? "text-zinc-400 hover:text-white" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          ← Volver a la cámara
        </button>
      </div>
    );
  }

  // 2. MODO EXITOSO
  if (mode === "done") {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center px-6 pb-20 text-center transition-colors ${
        darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-stone-900"
      }`}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <p className={`text-xs uppercase tracking-widest font-bold ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          ¡Registro Exitoso!
        </p>

        {validatedStation && (
          <p className={`text-xs mt-1 ${darkMode ? "text-zinc-300" : "text-stone-600"}`}>
            Depósito validado en{" "}
            <strong className={darkMode ? "text-white" : "text-stone-800"}>
              {validatedStation.name}
            </strong>
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-1 mb-6"></div>

        <div className="flex items-center gap-1.5 mt-1 mb-6">
          <span className="text-emerald-500 font-black text-2xl tracking-wide">ECO</span>
          <span className={`font-black text-2xl tracking-wide ${darkMode ? "text-white" : "text-stone-800"}`}>
            SMART
          </span>
        </div>

        <div className={`w-full max-w-[260px] rounded-2xl p-5 border shadow-lg ${
          darkMode ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-stone-200"
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-500 font-bold uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Puntos Ganados</span>
          </div>
          <p className="text-3xl font-black text-emerald-500 mb-3">+{EARNED} pts</p>

          {validatedStation && (
            <p className={`text-xs font-medium mb-3 ${darkMode ? "text-zinc-300" : "text-stone-600"}`}>
              {validatedStation.name}
            </p>
          )}

          <div className={`pt-3 border-t text-xs ${
            darkMode ? "border-zinc-800 text-zinc-400" : "border-stone-100 text-stone-500"
          }`}>
            Total acumulado: <strong className={darkMode ? "text-white" : "text-stone-800"}>{points} pts</strong>
          </div>
        </div>

        <button
          onClick={() => {
            setMode("scan");
            setCode("");
            setError("");
            setValidatedStation(null);
          }}
          className="mt-8 text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider py-2 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 transition-all active:scale-95"
        >
          Escanear otro código
        </button>
      </div>
    );
  }

  // 3. MODO SCANNER
  return (
    <div className={`flex-1 flex flex-col items-center justify-between px-6 pt-6 pb-28 transition-colors ${
      darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-stone-900"
    }`}>
      {/* Texto superior */}
      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
          Escáner Activo
        </p>
        <p className={`text-xs ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          Apunta al código QR del contenedor para sumar puntos
        </p>
      </div>

      {/* Visor central del QR */}
      <div className="relative w-full max-w-[280px] aspect-square my-auto flex items-center justify-center">
        
        {/* Marco y cámara de fondo ficticia */}
        <div className={`absolute inset-0 rounded-3xl border overflow-hidden flex flex-col items-center justify-center ${
          darkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-stone-200/50 border-stone-300"
        }`}>
          <div className="flex flex-col items-center gap-3 opacity-30">
            <QrCode className="w-16 h-16 text-emerald-500" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
              Buscando código...
            </span>
          </div>

          {/* Línea de láser animada */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[scan_2.5s_infinite_ease-in-out]" />
        </div>

        {/* Esquinas tácticas del visor */}
        <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
            <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
          </div>
          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
            <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
          </div>
        </div>

        {/* Botón de linterna */}
        <button
          onClick={() => setFlashOn(!flashOn)}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-all shadow-md ${
            flashOn 
              ? "bg-emerald-500 text-zinc-950 shadow-emerald-500/20" 
              : "bg-black/40 text-white hover:bg-black/60 border border-white/10"
          }`}
          title={flashOn ? "Apagar linterna" : "Encender linterna"}
        >
          {flashOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Botón de ingreso manual */}
      <button
        onClick={() => setMode("manual")}
        className={`w-full max-w-[280px] py-3.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 ${
          darkMode
            ? "bg-zinc-900 border border-zinc-800 text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-400"
            : "bg-white border border-stone-200 text-stone-700 hover:border-emerald-600 hover:text-emerald-600"
        }`}
      >
        <Keyboard className="w-4 h-4 text-emerald-500" />
        Ingresar código manualmente
      </button>

      {/* Estilo keyframes para la animación del láser */}
      <style>{`
        @keyframes scan {
          0% { top: 5%; opacity: 0.2; }
          50% { top: 90%; opacity: 1; }
          100% { top: 5%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}