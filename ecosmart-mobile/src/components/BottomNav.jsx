import React from "react";
import { Home, MapPin, QrCode, Award, User } from "lucide-react";

/**
 * BottomNav - Navegación inferior adaptativa (Modo Claro / Oscuro)
 */
const NAV_ITEMS = [
  { id: "inicio", altId: "home", icon: Home, label: "Inicio" },
  { id: "mapa", altId: "mapa", icon: MapPin, label: "Mapa" },
  { id: "qr", altId: "qr", icon: QrCode, label: "Escanear", isCenter: true },
  { id: "logros", altId: "logros", icon: Award, label: "Logros" },
  { id: "perfil", altId: "perfil", icon: User, label: "Perfil" },
];

export default function BottomNav({
  activeTab,
  active,
  setActiveTab,
  onNavigate,
  darkMode = true,
  items,
}) {
  const currentTab = activeTab || active || "inicio";
  const handleNavigation = onNavigate || setActiveTab;
  const navItems = items || NAV_ITEMS; // permite reemplazar los ítems (ej. panel admin)

  return (
    <nav
      className={`mt-auto px-5 py-3 flex items-center justify-between shrink-0 transition-colors duration-300 relative z-10 rounded-t-3xl border-t ${
        darkMode
          ? "bg-zinc-950 border-zinc-800 text-zinc-400 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.6)]"
          : "bg-emerald-600 border-emerald-700 text-white shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.15)]"
      }`}
    >
      {navItems.map(({ id, altId, icon: Icon, label, isCenter }) => {
        const isActive = currentTab === id || currentTab === altId;

        // Botón central flotante (Escáner QR)
        if (isCenter) {
          return (
            <button
              key={id}
              onClick={() => handleNavigation && handleNavigation(id)}
              aria-label={label}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center -mt-7 shadow-lg transition-all active:scale-95 border-2 ${
                darkMode
                  ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-zinc-950 shadow-amber-500/20"
                  : "bg-amber-500 hover:bg-amber-400 text-white border-white shadow-amber-900/30"
              } ${isActive ? "scale-105 ring-2 ring-amber-300" : ""}`}
              style={{ width: "3.25rem", height: "3.25rem" }}
            >
              <Icon className="w-6 h-6 stroke-[2.5]" />
            </button>
          );
        }

        // Botones estándar de navegación (Corregido contraste claro)
        return (
          <button
            key={id}
            onClick={() => handleNavigation && handleNavigation(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-2xl px-3.5 py-2 transition-all ${
              isActive
                ? darkMode
                  ? "bg-zinc-800/80 text-emerald-400"
                  : "bg-white/20 text-white font-bold shadow-sm backdrop-blur-sm"
                : darkMode
                  ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                  : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon
              className="w-5 h-5 transition-colors"
              strokeWidth={isActive ? 2.5 : 2}
            />
            {isActive && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  darkMode ? "bg-emerald-400" : "bg-white"
                }`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}