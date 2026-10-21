import React, { useState } from "react";
import { User, Lock, Mail, CreditCard, ArrowLeft } from "lucide-react";
import { registrar, mensajeError } from "../services/auth.js";

const formatearRut = (v) => {
  const limpio = v.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  return limpio.length > 1 ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}` : limpio;
};

export default function RegisterScreen({ darkMode = true, onRegistered, onBack }) {
  const [f, setF] = useState({ nombre: "", rut: "", correo: "", clave: "", clave2: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: k === "rut" ? formatearRut(e.target.value) : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (f.nombre.trim().length < 2 || !f.rut || !f.correo.trim() || !f.clave) return setError("Completa todos los campos.");
    if (f.clave.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (f.clave !== f.clave2) return setError("Las contraseñas no coinciden.");
    setError("");
    setCargando(true);
    try {
      const perfil = await registrar({ correo: f.correo.trim(), clave: f.clave, rut: f.rut, nombre_completo: f.nombre.trim() });
      onRegistered?.(perfil);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const caja = `flex items-center border rounded-xl px-3 transition-colors ${darkMode ? "bg-zinc-950 border-zinc-800 focus-within:border-emerald-500" : "bg-stone-50 border-stone-300 focus-within:border-emerald-600"}`;
  const label = `block text-xs font-bold mb-1.5 ${darkMode ? "text-zinc-300" : "text-stone-700"}`;
  const campo = (Icon, etiqueta, k, props) => (
    <div>
      <label className={label}>{etiqueta}</label>
      <div className={caja}>
        <Icon className="w-4 h-4 text-stone-400 shrink-0" />
        <input value={f[k]} onChange={set(k)} className="w-full px-2 py-2.5 text-sm focus:outline-none bg-transparent" {...props} />
      </div>
    </div>
  );

  return (
    <div className={`min-h-full flex-1 overflow-y-auto flex flex-col items-center px-6 py-8 ${darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-zinc-900"}`}>
      <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-xl ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-stone-200"}`}>
        <button type="button" onClick={onBack} className={`flex items-center gap-1 text-xs mb-4 ${darkMode ? "text-zinc-400 hover:text-white" : "text-stone-500 hover:text-zinc-800"}`}>
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </button>
        <h2 className="text-lg font-extrabold mb-4">Crear cuenta</h2>
        <form onSubmit={submit} className="space-y-3.5">
          {campo(User, "Nombre completo", "nombre", { type: "text", autoComplete: "name", placeholder: "Ana Pérez" })}
          {campo(CreditCard, "RUT", "rut", { type: "text", inputMode: "text", placeholder: "12345678-5" })}
          {campo(Mail, "Correo", "correo", { type: "email", autoComplete: "email", placeholder: "tucorreo@ejemplo.cl" })}
          {campo(Lock, "Contraseña", "clave", { type: "password", autoComplete: "new-password", placeholder: "Mínimo 6 caracteres" })}
          {campo(Lock, "Repite la contraseña", "clave2", { type: "password", autoComplete: "new-password", placeholder: "••••••••" })}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button type="submit" disabled={cargando} className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 mt-1">
            {cargando ? "Creando cuenta…" : "Registrarme"}
          </button>
        </form>
      </div>
    </div>
  );
}
