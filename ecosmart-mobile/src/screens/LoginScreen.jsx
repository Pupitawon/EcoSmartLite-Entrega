import React, { useState } from "react";
import { User, Lock, Users, ShieldCheck } from "lucide-react";
import logoClaro from "../assets/logo-claro.png";
import logoOscuro from "../assets/logo-oscuro.png";

export default function LoginScreen({ darkMode = true, onLogin, onGoToRegister }) {
  const [role, setRole] = useState("ciudadano"); // ciudadano | admin
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const currentLogo = darkMode ? logoOscuro : logoClaro;
  const isAdmin = role === "admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Completa usuario y contraseña para continuar.");
      return;
    }
    setError("");
    onLogin?.(username, role);
  };

  return (
    <div className={`min-h-full flex-1 overflow-y-auto flex flex-col justify-center items-center px-6 py-10 transition-colors duration-300 ${darkMode ? "bg-zinc-950 text-white" : "bg-stone-50 text-zinc-900"}`}>
      <div className="flex flex-col items-center mb-6">
        <img src={currentLogo} alt="EcoSmart Logo" className="w-20 h-20 object-contain mb-3 rounded-2xl shadow-md" />
        <div className="flex items-center gap-1">
          <span className="text-emerald-500 font-extrabold text-2xl tracking-tight">ECO</span>
          <span className={`font-extrabold text-2xl tracking-tight ${darkMode ? "text-white" : "text-zinc-900"}`}>SMART</span>
        </div>
        <p className={`text-xs mt-1 ${darkMode ? "text-zinc-400" : "text-stone-500"}`}>
          {isAdmin ? "Panel operativo de Innova Recicla" : "Bienvenido de vuelta"}
        </p>
      </div>

      <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-xl transition-colors ${darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-stone-200 text-zinc-900"}`}>
        {/* Selector de rol */}
        <div className={`flex mb-5 p-1 rounded-xl border ${darkMode ? "bg-zinc-950 border-zinc-800" : "bg-stone-100 border-stone-200"}`}>
          <button
            type="button"
            onClick={() => { setRole("ciudadano"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${!isAdmin ? "bg-emerald-600 text-white shadow-md" : darkMode ? "text-zinc-400 hover:text-white" : "text-stone-500 hover:text-stone-800"}`}
          >
            <Users className="w-3.5 h-3.5" />
            Ciudadano
          </button>
          <button
            type="button"
            onClick={() => { setRole("admin"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${isAdmin ? "bg-zinc-700 text-white shadow-md" : darkMode ? "text-zinc-400 hover:text-white" : "text-stone-500 hover:text-stone-800"}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? "text-zinc-300" : "text-stone-700"}`}>Usuario</label>
            <div className={`flex items-center border rounded-xl px-3 transition-colors ${darkMode ? "bg-zinc-950 border-zinc-800 focus-within:border-emerald-500" : "bg-stone-50 border-stone-300 focus-within:border-emerald-600"}`}>
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isAdmin ? "Usuario operativo" : "Ingresa tu usuario"}
                className="w-full px-2 py-2.5 text-sm focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? "text-zinc-300" : "text-stone-700"}`}>Contraseña</label>
            <div className={`flex items-center border rounded-xl px-3 transition-colors ${darkMode ? "bg-zinc-950 border-zinc-800 focus-within:border-emerald-500" : "bg-stone-50 border-stone-300 focus-within:border-emerald-600"}`}>
              <Lock className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-2 py-2.5 text-sm focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] mt-2 ${isAdmin ? "bg-zinc-700 hover:bg-zinc-600" : "bg-emerald-600 hover:bg-emerald-500"}`}
          >
            {isAdmin ? "Ingresar al panel" : "Iniciar Sesión"}
          </button>
        </form>

        {!isAdmin && (
          <button
            type="button"
            onClick={onGoToRegister}
            className={`w-full text-center text-xs mt-4 transition-colors ${darkMode ? "text-zinc-400 hover:text-white" : "text-stone-500 hover:text-zinc-800"}`}
          >
            ¿No tienes cuenta? <span className="font-semibold text-emerald-500 hover:underline">Regístrate</span>
          </button>
        )}
      </div>
    </div>
  );
}