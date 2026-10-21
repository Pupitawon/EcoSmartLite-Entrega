import React, { useState, useRef } from "react";
import { 
  ShieldCheck, 
  Gift, 
  Trophy, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Edit3,
  X,
  Camera,
  Award,
  Sparkles,
  Tag,
  Coins,
  QrCode,
  Ticket,
  ChevronLeft,
  ShoppingBag,
  Coffee,
  Bus,
  Leaf
} from "lucide-react";

import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";
import avatar6 from "../assets/avatars/avatar6.png";

const PRESET_AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6];

const ECO_LEAGUES = [
  { 
    name: "Semilla", 
    minPts: 0, 
    maxPts: 499, 
    colorDark: "text-emerald-300", 
    colorLight: "text-emerald-700",
    bgProgress: "bg-emerald-500",
    borderActive: "border-emerald-500 bg-emerald-500/10"
  },
  { 
    name: "Brote", 
    minPts: 500, 
    maxPts: 1499, 
    colorDark: "text-lime-400", 
    colorLight: "text-lime-700",
    bgProgress: "bg-lime-500",
    borderActive: "border-lime-500 bg-lime-500/10"
  },
  { 
    name: "Guardián Verde", 
    minPts: 1500, 
    maxPts: 3499, 
    colorDark: "text-emerald-400", 
    colorLight: "text-emerald-700",
    bgProgress: "bg-emerald-500",
    borderActive: "border-emerald-500 bg-emerald-500/10"
  },
  { 
    name: "Eco Forestal", 
    minPts: 3500, 
    maxPts: 6999, 
    colorDark: "text-teal-300", 
    colorLight: "text-teal-800",
    bgProgress: "bg-teal-500",
    borderActive: "border-teal-500 bg-teal-500/10"
  },
  { 
    name: "Líder Sustentable", 
    minPts: 7000, 
    maxPts: 11999, 
    colorDark: "text-cyan-300", 
    colorLight: "text-cyan-800",
    bgProgress: "bg-cyan-500",
    borderActive: "border-cyan-500 bg-cyan-500/10"
  },
  { 
    name: "Maestro Bioma", 
    minPts: 12000, 
    maxPts: 19999, 
    colorDark: "text-blue-400", 
    colorLight: "text-blue-800",
    bgProgress: "bg-blue-500",
    borderActive: "border-blue-500 bg-blue-500/10"
  },
  { 
    name: "Protector de la Tierra", 
    minPts: 20000, 
    maxPts: 34999, 
    colorDark: "text-amber-300", 
    colorLight: "text-amber-700",
    bgProgress: "bg-amber-500",
    borderActive: "border-amber-500 bg-amber-500/10"
  },
  { 
    name: "EcoSmart Legend", 
    minPts: 35000, 
    maxPts: Infinity, 
    colorDark: "text-emerald-300 font-black", 
    colorLight: "text-emerald-800 font-black",
    bgProgress: "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500",
    borderActive: "border-emerald-500 bg-emerald-500/20"
  },
];

const RECOMPENSAS_DISPONIBLES = [
  {
    id: 1,
    title: "15% Dcto. en Cafetería Local",
    category: "Alimentación",
    cost: 500,
    store: "EcoCafé Calama",
    icon: Coffee,
    badgeDark: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    badgeLight: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: 2,
    title: "Pasaje Gratis Transporte Urbano",
    category: "Transporte",
    cost: 800,
    store: "Red Movilidad Local",
    icon: Bus,
    badgeDark: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    badgeLight: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: 3,
    title: "20% en Plantas y Semillas",
    category: "Ecología",
    cost: 600,
    store: "Vivero Verde del Sol",
    icon: Leaf,
    badgeDark: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    badgeLight: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: 4,
    title: "10% en Botellas Térmicas",
    category: "Tienda",
    cost: 1200,
    store: "EcoStore Chile",
    icon: ShoppingBag,
    badgeDark: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    badgeLight: "bg-purple-100 text-purple-800 border-purple-300",
  },
];

export default function PerfilScreen({ 
  userName = "Leandro", 
  points = 1850, 
  darkMode = true, 
  onLogout 
}) {
  const [currentScreen, setCurrentScreen] = useState("perfil"); // "perfil" | "recompensas"
  const [profileImage, setProfileImage] = useState(PRESET_AVATARS[0]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLeaguesModalOpen, setIsLeaguesModalOpen] = useState(false);
  
  // Estado local para los puntos y cupones del usuario
  const [userPoints, setUserPoints] = useState(points);
  const [myCoupons, setMyCoupons] = useState([
    {
      id: "CUPON-101",
      title: "10% Dcto. en Productos Biorremediables",
      store: "EcoTienda",
      code: "ECO-SMART-2026",
      status: "active",
      expires: "30 Ago 2026",
    }
  ]);

  const fileInputRef = useRef(null);

  const currentLeagueIndex = ECO_LEAGUES.findIndex(
    (l) => userPoints >= l.minPts && userPoints <= l.maxPts
  );
  const currentLeague = ECO_LEAGUES[currentLeagueIndex] || ECO_LEAGUES[0];
  const nextLeague = ECO_LEAGUES[currentLeagueIndex + 1];

  const ptsInCurrentTier = userPoints - currentLeague.minPts;
  const tierRange = nextLeague ? (nextLeague.minPts - currentLeague.minPts) : 1;
  const progressPercent = nextLeague 
    ? Math.min(Math.max((ptsInCurrentTier / tierRange) * 100, 0), 100)
    : 100;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      setIsAvatarModalOpen(false);
    }
  };

  if (currentScreen === "recompensas") {
    return (
      <RecompensasView 
        userPoints={userPoints} 
        setUserPoints={setUserPoints}
        myCoupons={myCoupons}
        setMyCoupons={setMyCoupons}
        darkMode={darkMode} 
        onBack={() => setCurrentScreen("perfil")} 
      />
    );
  }

  return (
    <div className={`flex-1 flex flex-col gap-4 p-2 relative transition-colors duration-200 ${
      darkMode ? "text-white" : "text-zinc-900"
    }`}>
      
      {/* 1. Header de Perfil */}
      <div className="flex flex-col items-center text-center mt-1">
        <div className="relative">
          <div className={`w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden shadow-xl p-0.5 ${
            darkMode ? "bg-zinc-800" : "bg-stone-200"
          }`}>
            <img src={profileImage} alt={userName} className="w-full h-full object-cover rounded-full" />
          </div>
          <button 
            onClick={() => setIsAvatarModalOpen(true)}
            className="absolute bottom-0 right-0 bg-emerald-500 text-zinc-950 p-1.5 rounded-full shadow-md hover:bg-emerald-400 transition-transform active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h2 className="text-xl font-extrabold mt-3 tracking-tight">{userName}</h2>
        <p className={`text-xs mt-0.5 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
          ¡Reciclando por un mundo mejor! 🌱
        </p>
      </div>

      {/* 2. Tarjeta Resumen de Liga */}
      <div className={`rounded-2xl border p-4 shadow-md transition-colors ${
        darkMode ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              darkMode ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-100 border-zinc-200"
            }`}>
              <ShieldCheck className={`w-6 h-6 ${darkMode ? currentLeague.colorDark : currentLeague.colorLight}`} />
            </div>
            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                darkMode ? "text-emerald-400" : "text-emerald-700"
              }`}>
                LIGA ECOSMART
              </span>
              <h3 className={`text-sm font-black ${darkMode ? currentLeague.colorDark : currentLeague.colorLight}`}>
                Nivel {currentLeagueIndex + 1} - {currentLeague.name}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsLeaguesModalOpen(true)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors ${
              darkMode 
                ? "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700" 
                : "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Ver Ligas</span>
          </button>
        </div>

        {/* Barra de Progreso */}
        <div className="space-y-1.5">
          <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
            darkMode ? "bg-zinc-800 border-zinc-700/50" : "bg-zinc-200 border-zinc-300"
          }`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${currentLeague.bgProgress}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={`flex justify-between items-center text-[10px] font-semibold ${
            darkMode ? "text-zinc-400" : "text-zinc-600"
          }`}>
            <span>{userPoints} pts acumulados</span>
            {nextLeague ? (
              <span>Siguiente: <strong className={darkMode ? "text-white" : "text-zinc-900"}>{nextLeague.minPts} pts</strong></span>
            ) : (
              <span className="text-emerald-600 font-bold">¡Rango Máximo!</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Menú de Opciones */}
      <div className={`rounded-2xl border overflow-hidden shadow-md transition-colors ${
        darkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
        <MenuItem 
          icon={<Gift className="w-4 h-4 text-emerald-500" />} 
          label="Mis recompensas" 
          darkMode={darkMode} 
          onClick={() => setCurrentScreen("recompensas")} 
        />
        <MenuItem 
          icon={<Trophy className="w-4 h-4 text-amber-500" />} 
          label="Desafíos de Liga" 
          darkMode={darkMode} 
          onClick={() => setIsLeaguesModalOpen(true)} 
        />
        <MenuItem icon={<Settings className="w-4 h-4 text-blue-500" />} label="Configuración" darkMode={darkMode} />
        <MenuItem icon={<HelpCircle className="w-4 h-4 text-purple-500" />} label="Ayuda y soporte" darkMode={darkMode} />
      </div>

      {/* 4. Botón Cerrar Sesión */}
      <button
        onClick={onLogout}
        className={`w-full py-3.5 px-4 rounded-2xl border flex items-center justify-between font-bold text-sm transition-all active:scale-[0.99] shadow-sm ${
          darkMode
            ? "bg-zinc-900/50 border-rose-900/40 text-rose-400 hover:bg-rose-950/30"
            : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </div>
        <ChevronRight className="w-4 h-4 opacity-60" />
      </button>

      {/* Modal 1: Selector de Avatares */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-xs rounded-3xl p-5 border shadow-2xl ${
            darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">Cambiar Foto de Perfil</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className={`p-1 rounded-full ${darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 mb-4 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Camera className="w-4 h-4" /> Subir desde la galería
            </button>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((avatarImg, idx) => (
                <button
                  key={idx}
                  onClick={() => { setProfileImage(avatarImg); setIsAvatarModalOpen(false); }}
                  className={`relative rounded-full overflow-hidden border-2 aspect-square ${
                    profileImage === avatarImg ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-transparent"
                  }`}
                >
                  <img src={avatarImg} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Jerarquía de Ligas */}
      {isLeaguesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-xs max-h-[85vh] rounded-3xl p-5 border shadow-2xl flex flex-col ${
            darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
          }`}>
            
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold">Sistema de Ligas</h3>
              </div>
              <button 
                onClick={() => setIsLeaguesModalOpen(false)} 
                className={`p-1.5 rounded-full transition-colors ${darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-[11px] mb-4 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Acumula puntos reciclando en las estaciones para ascender hasta la liga cúspide.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {ECO_LEAGUES.map((league, idx) => {
                const isCurrent = currentLeagueIndex === idx;
                const textColor = darkMode ? league.colorDark : league.colorLight;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isCurrent
                        ? league.borderActive
                        : darkMode
                        ? "bg-zinc-950/60 border-zinc-800"
                        : "bg-zinc-50 border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${
                        darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-300 shadow-sm"
                      }`}>
                        {idx === ECO_LEAGUES.length - 1 ? (
                          <Sparkles className={`w-4 h-4 ${textColor} animate-pulse`} />
                        ) : (
                          <Award className={`w-4 h-4 ${textColor}`} />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-extrabold ${textColor}`}>
                            {league.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-500 text-zinc-950 font-bold px-1.5 py-0.2 rounded-full">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                          {league.maxPts === Infinity ? `${league.minPts}+ pts` : `${league.minPts} - ${league.maxPts} pts`}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-bold ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                      Nivel {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Vista Interna: Recompensas
function RecompensasView({ userPoints, setUserPoints, myCoupons, setMyCoupons, darkMode, onBack }) {
  const [activeTab, setActiveTab] = useState("catalogo");
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const handleRedeem = (item) => {
    if (userPoints < item.cost) {
      alert("No tienes suficientes EcoPuntos para canjear este beneficio.");
      return;
    }

    setUserPoints((prev) => prev - item.cost);
    
    const newCoupon = {
      id: `CUPON-${Math.floor(100 + Math.random() * 900)}`,
      title: item.title,
      store: item.store,
      code: `ECO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: "active",
      expires: "15 Sep 2026",
    };

    setMyCoupons([newCoupon, ...myCoupons]);
    setSelectedCoupon(newCoupon);
  };

  return (
    <div className={`flex-1 flex flex-col gap-4 p-2 transition-colors duration-200 ${
      darkMode ? "text-white" : "text-zinc-900"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className={`p-2 rounded-xl border flex items-center gap-1 transition-colors text-xs font-bold ${
            darkMode 
              ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800" 
              : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100 shadow-sm"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <h2 className="text-base font-extrabold flex items-center gap-2">
          <Gift className={`w-5 h-5 ${darkMode ? "text-emerald-400" : "text-emerald-700"}`} />
          Mis Recompensas
        </h2>
        <div className="w-16" />
      </div>

      {/* Tarjeta EcoPuntos */}
      <div className={`rounded-2xl border p-4 shadow-md flex items-center justify-between transition-colors ${
        darkMode ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
        <div>
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            darkMode ? "text-zinc-400" : "text-zinc-600"
          }`}>
            Tus EcoPuntos
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <Coins className="w-6 h-6 text-amber-500" />
            <span className={`text-2xl font-black ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
              {userPoints}
            </span>
            <span className={`text-xs font-semibold ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              pts
            </span>
          </div>
        </div>

        <span className={`text-xs p-2.5 rounded-xl font-bold border transition-colors ${
          darkMode 
            ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-300" 
            : "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
        }`}>
          ¡Canjea y Ahorra!
        </span>
      </div>

      {/* Tabs */}
      <div className={`p-1 rounded-2xl border flex gap-1 ${
        darkMode ? "bg-zinc-900 border-zinc-800" : "bg-zinc-200/90 border-zinc-300"
      }`}>
        <button
          onClick={() => setActiveTab("catalogo")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
            activeTab === "catalogo"
              ? "bg-emerald-500 text-zinc-950 shadow-md"
              : darkMode 
              ? "text-zinc-400 hover:text-white" 
              : "text-zinc-700 hover:text-zinc-900"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Catálogo
        </button>

        <button
          onClick={() => setActiveTab("mis_cupones")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
            activeTab === "mis_cupones"
              ? "bg-emerald-500 text-zinc-950 shadow-md"
              : darkMode 
              ? "text-zinc-400 hover:text-white" 
              : "text-zinc-700 hover:text-zinc-900"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Mis Cupones ({myCoupons.length})
        </button>
      </div>

      {/* Catálogo */}
      {activeTab === "catalogo" && (
        <div className="space-y-3">
          {RECOMPENSAS_DISPONIBLES.map((item) => {
            const IconComp = item.icon;
            const canAfford = userPoints >= item.cost;
            const badgeClass = darkMode ? item.badgeDark : item.badgeLight;

            return (
              <div 
                key={item.id}
                className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between gap-3 transition-colors ${
                  darkMode ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${
                    darkMode ? "bg-zinc-950 border-zinc-800 text-emerald-400" : "bg-zinc-100 border-zinc-300 text-emerald-700"
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeClass}`}>
                      {item.category}
                    </span>
                    <h4 className="text-xs font-extrabold mt-1">{item.title}</h4>
                    <p className={`text-[11px] font-medium ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                      {item.store}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-black flex items-center gap-1 ${
                    darkMode ? "text-amber-400" : "text-amber-600"
                  }`}>
                    <Coins className="w-3.5 h-3.5" />
                    {item.cost} pts
                  </span>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                      canAfford
                        ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-sm"
                        : darkMode 
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50" 
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed border border-zinc-300"
                    }`}
                  >
                    Canjear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mis Cupones */}
      {activeTab === "mis_cupones" && (
        <div className="space-y-3">
          {myCoupons.length === 0 ? (
            <div className={`p-6 text-center rounded-2xl border ${
              darkMode ? "bg-zinc-900/40 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
            }`}>
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="text-xs font-bold">Aún no has canjeado ningún cupón.</p>
            </div>
          ) : (
            myCoupons.map((coupon) => (
              <div 
                key={coupon.id}
                className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${
                  darkMode ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${
                    darkMode ? "bg-zinc-950 border-zinc-800 text-emerald-400" : "bg-zinc-100 border-zinc-300 text-emerald-700"
                  }`}>
                    <QrCode className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold">{coupon.title}</h4>
                    <p className={`text-[11px] font-medium ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                      {coupon.store} • Vence: {coupon.expires}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCoupon(coupon)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    darkMode 
                      ? "bg-zinc-800 border-zinc-700 text-emerald-300 hover:bg-zinc-700" 
                      : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-sm"
                  }`}
                >
                  Ver QR
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal QR */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`w-full max-w-xs rounded-3xl p-5 border shadow-2xl flex flex-col items-center text-center ${
            darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
          }`}>
            <div className="w-full flex justify-end">
              <button 
                onClick={() => setSelectedCoupon(null)}
                className={`p-1.5 rounded-full transition-colors ${
                  darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-sm font-black mb-1">{selectedCoupon.title}</h3>
            <p className={`text-xs mb-4 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Muestra este código en {selectedCoupon.store}
            </p>

            <div className="bg-white p-4 rounded-2xl shadow-inner border border-zinc-300 mb-4 flex flex-col items-center">
              <QrCode className="w-36 h-36 text-zinc-950" />
              <span className="text-xs font-mono font-black text-zinc-950 mt-2 tracking-widest">
                {selectedCoupon.code}
              </span>
            </div>

            <p className={`text-[10px] font-semibold mb-4 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
              Válido hasta el {selectedCoupon.expires}
            </p>

            <button
              onClick={() => setSelectedCoupon(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, darkMode, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3.5 flex items-center justify-between border-b last:border-b-0 transition-colors ${
        darkMode 
          ? "border-zinc-800/60 hover:bg-zinc-800/50 text-zinc-200" 
          : "border-zinc-100 hover:bg-zinc-50 text-zinc-800"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 ${darkMode ? "text-zinc-600" : "text-zinc-400"}`} />
    </button>
  );
}