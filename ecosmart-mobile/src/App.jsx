import React, { useState } from "react";
import { LayoutDashboard, History, LogOut } from "lucide-react";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";

// Importación de pantallas
import InicioScreen from "./screens/InicioScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import MapaScreen from "./screens/MapaScreen.jsx";
import EstacionScreen from "./screens/EstacionScreen.jsx";
import CanjeoScreen from "./screens/CanjeoScreen.jsx";
import QRScreen from "./screens/QRScreen.jsx";
import LogrosScreen from "./screens/LogrosScreen.jsx";
import InsigniasScreen from "./screens/InsigniasScreen.jsx";
import PerfilScreen from "./screens/PerfilScreen.jsx";
import SoporteScreen from "./screens/SoporteScreen.jsx";
import AdminPanelScreen from "./screens/AdminPanelScreen.jsx";
import AdminHistorialScreen from "./screens/AdminHistorialScreen.jsx";

const SCREEN_TO_NAV_GROUP = {
  home: "inicio",
  inicio: "inicio",
  perfil: "perfil",
  soporte: "perfil", 
  mapa: "mapa",
  estacion: "mapa",
  canjeo: "inicio",
  qr: "qr",
  logros: "logros",
  insignias: "logros",
  adminPanel: "adminPanel",
  adminHistorico: "adminHistorico",
};

const ADMIN_NAV_ITEMS = [
  { id: "adminPanel", icon: LayoutDashboard, label: "Panel" },
  { id: "adminHistorico", icon: History, label: "Histórico" },
  { id: "logout", icon: LogOut, label: "Salir" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("ciudadano"); // ciudadano | admin
  const [screen, setScreen] = useState("login");
  const [userName, setUserName] = useState("Jeremy");
  const [points, setPoints] = useState(600);
  const [selectedStation, setSelectedStation] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  
  // Estado global para "Tamaño del texto" ("normal", "large", "xlarge")
  const [fontSize, setFontSize] = useState("normal");

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const navigate = (target) => setScreen(target);
  const handleScanned = (earned) => setPoints((p) => p + earned);

  const handleLogin = (username, role = "ciudadano") => {
    const formattedName = username ? username.charAt(0).toUpperCase() + username.slice(1) : "Jeremy";
    setUserName(formattedName);
    setUserRole(role);
    setIsLoggedIn(true);
    navigate(role === "admin" ? "adminPanel" : "home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("ciudadano");
    navigate("login");
  };

  const handleAdminNav = (target) => {
    if (target === "logout") {
      handleLogout();
    } else {
      navigate(target);
    }
  };

  const handleViewStation = (station) => {
    setSelectedStation(station);
    navigate("estacion");
  };

  // 1. Mapeo del multiplicador de escala mediante zoom CSS
  const getFontSizeStyle = () => {
    switch (fontSize) {
      case "large":
        return { zoom: "1.15" }; // Aumenta 15% todo el layout
      case "xlarge":
        return { zoom: "1.30" }; // Aumenta 30% todo el layout
      default:
        return { zoom: "1" };
    }
  };

  const renderScreen = () => {
    if (!isLoggedIn || screen === "login") {
      return (
        <LoginScreen
          darkMode={darkMode}
          onLogin={handleLogin}
          onGoToRegister={() =>
            alert("Flujo de registro (mock) — próximamente.")
          }
        />
      );
    }

    switch (screen) {
      case "home":
      case "inicio":
        return (
          <InicioScreen
            userName={userName}
            points={points}
            darkMode={darkMode}
            onNavigateToCanjeo={() => navigate("canjeo")}
          />
        );
      case "perfil":
        return (
          <PerfilScreen
            userName={userName}
            setUserName={setUserName}
            points={points}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            fontSize={fontSize}
            setFontSize={setFontSize}
            onLogout={handleLogout}
            onNavigate={navigate} 
          />
        );
      case "soporte": 
        return (
          <SoporteScreen
            darkMode={darkMode}
            onBack={() => navigate("perfil")}
          />
        );
      case "mapa":
        return (
          <MapaScreen
            darkMode={darkMode}
            onViewStation={handleViewStation}
          />
        );
      case "estacion":
        return (
          <EstacionScreen
            darkMode={darkMode}
            station={selectedStation}
            onBack={() => navigate("mapa")}
          />
        );
      case "canjeo":
        return (
          <CanjeoScreen
            darkMode={darkMode}
            points={points}
            userName={userName}
          />
        );
      case "qr":
        return (
          <QRScreen
            darkMode={darkMode}
            points={points}
            onScanned={handleScanned}
          />
        );
      case "logros":
        return (
          <LogrosScreen
            darkMode={darkMode}
            weeklyGoal={1000}
            weeklyProgress={500}
            onNavigateToInsignias={() => navigate("insignias")}
          />
        );
      case "insignias":
        return (
          <InsigniasScreen
            darkMode={darkMode}
            onBack={() => navigate("logros")}
          />
        );
      case "adminPanel":
        return <AdminPanelScreen darkMode={darkMode} />;
      case "adminHistorico":
        return <AdminHistorialScreen darkMode={darkMode} />;
      default:
        return userRole === "admin" ? (
          <AdminPanelScreen darkMode={darkMode} />
        ) : (
          <InicioScreen
            userName={userName}
            points={points}
            darkMode={darkMode}
            onNavigateToCanjeo={() => navigate("canjeo")}
          />
        );
    }
  };

  const activeGroup = SCREEN_TO_NAV_GROUP[screen] ?? "inicio";

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-0 sm:p-6 transition-colors duration-300 ${
        darkMode ? "bg-zinc-900" : "bg-stone-100"
      }`}
    >
      <div
        style={getFontSizeStyle()}
        className={`w-full h-screen sm:h-[720px] sm:max-w-sm overflow-hidden flex flex-col transition-all duration-300 sm:border-4 ${
          darkMode
            ? "bg-zinc-950 sm:border-zinc-800 text-white shadow-2xl shadow-black/80 sm:rounded-3xl"
            : "bg-stone-50 sm:border-stone-300 text-stone-900 shadow-2xl shadow-stone-400/40 sm:rounded-3xl"
        }`}
      >
        {isLoggedIn && (
          <Header
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onProfileClick={() => navigate(userRole === "admin" ? "adminPanel" : "perfil")}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 relative">
          {renderScreen()}
        </main>

        {isLoggedIn && (
          <BottomNav
            active={activeGroup}
            activeTab={activeGroup}
            darkMode={darkMode}
            items={userRole === "admin" ? ADMIN_NAV_ITEMS : undefined}
            onNavigate={userRole === "admin" ? handleAdminNav : (target) => navigate(target)}
            setActiveTab={(target) => navigate(target)}
          />
        )}
      </div>
    </div>
  );
}