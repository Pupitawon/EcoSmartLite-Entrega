import React from "react";
import { Bell, Sun, Moon } from "lucide-react";

// Importación de los dos logos según tus archivos
import logoClaro from "../assets/logo-ecosmart-claro.png";
import logoOscuro from "../assets/logo-ecosmart-oscuro.png";

export default function Header({ onProfileClick, darkMode, toggleDarkMode }) {
  const currentLogo = darkMode ? logoOscuro : logoClaro;

  return (
    <header
      className={`flex items-center justify-between px-5 py-4 shrink-0 transition-colors duration-300 relative z-10 border-b ${
        darkMode
          ? "bg-zinc-950 text-white border-zinc-800"
          : "bg-white text-stone-800 border-stone-200"
      }`}
    >
      {/* Logo dinámico por imagen o fallback a texto */}
      <div className="flex items-center gap-2">
        {currentLogo ? (
          <img
            src={currentLogo}
            alt="EcoSmart Logo"
            className="h-7 w-auto object-contain transition-all duration-300"
          />
        ) : (
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="text-emerald-500">ECO</span>
            <span className={darkMode ? "text-white" : "text-zinc-900"}>
              SMART
            </span>
          </h1>
        )}
      </div>

      {/* Controles del Header */}
      <div className="flex items-center gap-2">
        {/* Botón Switch Modo Oscuro / Claro */}
        <button
          onClick={toggleDarkMode}
          aria-label="Cambiar tema"
          className={`p-2 rounded-full transition-colors ${
            darkMode
              ? "text-amber-400 hover:bg-zinc-800"
              : "text-amber-600 hover:bg-stone-100"
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notificaciones */}
        <button
          aria-label="Notificaciones"
          className={`p-2 rounded-full transition-colors ${
            darkMode
              ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
              : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          }`}
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar de Perfil */}
        <button
          aria-label="Perfil"
          onClick={onProfileClick}
          className={`w-8 h-8 rounded-full border flex items-center justify-center font-extrabold text-xs transition-colors ${
            darkMode
              ? "bg-zinc-800 border-emerald-500 text-emerald-400"
              : "bg-emerald-100 border-emerald-600 text-emerald-700"
          }`}
        >
          U
        </button>
      </div>
    </header>
  );
}