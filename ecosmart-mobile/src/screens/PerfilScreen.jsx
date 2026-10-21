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
  Moon,
  Sun,
  Bell,
  Lock,
  UserCheck,
  Key,
  Type,
  Eye,
  EyeOff,
  Check
} from "lucide-react";

import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";
import avatar6 from "../assets/avatars/avatar6.png";

const PRESET_AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6];

const ECO_LEAGUES = [
  { name: "Semilla", minPts: 0, maxPts: 499, colorDark: "text-emerald-300", colorLight: "text-emerald-700", bgProgress: "bg-emerald-500", borderActive: "border-emerald-500 bg-emerald-500/10" },
  { name: "Brote", minPts: 500, maxPts: 1499, colorDark: "text-lime-400", colorLight: "text-lime-700", bgProgress: "bg-lime-500", borderActive: "border-lime-500 bg-lime-500/10" },
  { name: "Guardián Verde", minPts: 1500, maxPts: 3499, colorDark: "text-emerald-400", colorLight: "text-emerald-700", bgProgress: "bg-emerald-500", borderActive: "border-emerald-500 bg-emerald-500/10" },
  { name: "Eco Forestal", minPts: 3500, maxPts: 6999, colorDark: "text-teal-300", colorLight: "text-teal-800", bgProgress: "bg-teal-500", borderActive: "border-teal-500 bg-teal-500/10" },
  { name: "Líder Sustentable", minPts: 7000, maxPts: 11999, colorDark: "text-cyan-300", colorLight: "text-cyan-800", bgProgress: "bg-cyan-500", borderActive: "border-cyan-500 bg-cyan-500/10" },
  { name: "Maestro Bioma", minPts: 12000, maxPts: 19999, colorDark: "text-blue-400", colorLight: "text-blue-800", bgProgress: "bg-blue-500", borderActive: "border-blue-500 bg-blue-500/10" },
  { name: "Protector de la Tierra", minPts: 20000, maxPts: 34999, colorDark: "text-amber-300", colorLight: "text-amber-700", bgProgress: "bg-amber-500", borderActive: "border-amber-500 bg-amber-500/10" },
  { name: "EcoSmart Legend", minPts: 35000, maxPts: Infinity, colorDark: "text-emerald-300 font-black", colorLight: "text-emerald-800 font-black", bgProgress: "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500", borderActive: "border-emerald-500 bg-emerald-500/20" },
];

export default function PerfilScreen({ 
  userName = "Jeremy", 
  points = 650, 
  darkMode = true, 
  setDarkMode,
  fontSize = "normal", 
  setFontSize,
  setUserName,
  onLogout,
  onNavigate 
}) {
  const [profileImage, setProfileImage] = useState(PRESET_AVATARS[0]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLeaguesModalOpen, setIsLeaguesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [currentUserName, setCurrentUserName] = useState(userName);
  const [textSize, setTextSize] = useState(fontSize || "normal");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);

  const fileInputRef = useRef(null);

  const currentLeagueIndex = ECO_LEAGUES.findIndex(
    (l) => points >= l.minPts && points <= l.maxPts
  );
  const currentLeague = ECO_LEAGUES[currentLeagueIndex] || ECO_LEAGUES[0];
  const nextLeague = ECO_LEAGUES[currentLeagueIndex + 1];

  const ptsInCurrentTier = points - currentLeague.minPts;
  const tierRange = nextLeague ? (nextLeague.minPts - currentLeague.minPts) : 1;
  const progressPercent = nextLeague 
    ? Math.min(Math.max((ptsInCurrentTier / tierRange) * 100, 0), 100)
    : 100;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      setIsAvatarModalOpen(false);
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (currentPass && newPass) {
      setPassSuccess(true);
      setTimeout(() => {
        setPassSuccess(false);
        setIsChangePasswordOpen(false);
        setCurrentPass("");
        setNewPass("");
      }, 1500);
    }
  };

  const handleApplySettings = () => {
    if (setFontSize) setFontSize(textSize);
    if (setUserName) setUserName(currentUserName);
    setIsSettingsModalOpen(false);
  };

  return (
    <div className={`flex-1 flex flex-col gap-4 p-2 relative transition-colors duration-200 ${
      darkMode ? "text-white" : "text-zinc-900"
    }`}>
      
      {/* Header Perfil */}
      <div className="flex flex-col items-center text-center mt-1">
        <div className="relative">
          <div className={`w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden shadow-xl p-0.5 ${
            darkMode ? "bg-zinc-800" : "bg-stone-200"
          }`}>
            <img 
              src={profileImage} 
              alt={currentUserName} 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/150"; 
              }}
            />
          </div>
          <button 
            onClick={() => setIsAvatarModalOpen(true)}
            className="absolute bottom-0 right-0 bg-emerald-500 text-zinc-950 p-1.5 rounded-full shadow-md hover:bg-emerald-400 transition-transform active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h2 className="text-xl font-extrabold mt-3 tracking-tight">{currentUserName}</h2>
        <p className={`text-xs mt-0.5 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
          ¡Reciclando por un mundo mejor! 🌱
        </p>
      </div>

      {/* Resumen Liga */}
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
            <span>{points} pts acumulados</span>
            {nextLeague ? (
              <span>Siguiente: <strong className={darkMode ? "text-white" : "text-zinc-900"}>{nextLeague.minPts} pts</strong></span>
            ) : (
              <span className="text-emerald-600 font-bold">¡Rango Máximo!</span>
            )}
          </div>
        </div>
      </div>

      {/* Menú de Opciones */}
      <div className={`rounded-2xl border overflow-hidden shadow-md transition-colors ${
        darkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
        <MenuItem 
          icon={<Gift className="w-4 h-4 text-emerald-500" />} 
          label="Mis recompensas" 
          darkMode={darkMode} 
          onClick={() => onNavigate && onNavigate("canjeo")} 
        />
        <MenuItem 
          icon={<Trophy className="w-4 h-4 text-amber-500" />} 
          label="Desafíos de Liga" 
          darkMode={darkMode} 
          onClick={() => setIsLeaguesModalOpen(true)} 
        />
        <MenuItem 
          icon={<Settings className="w-4 h-4 text-blue-500" />} 
          label="Configuración" 
          darkMode={darkMode} 
          onClick={() => setIsSettingsModalOpen(true)}
        />
        <MenuItem 
          icon={<HelpCircle className="w-4 h-4 text-purple-500" />} 
          label="Ayuda y soporte" 
          darkMode={darkMode} 
          onClick={() => onNavigate && onNavigate("soporte")}
        />
      </div>

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

      {/* Modal Configuración */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`w-full max-w-xs max-h-[90vh] overflow-y-auto rounded-3xl p-5 border shadow-2xl space-y-4 ${
            darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-zinc-700/40">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-extrabold">Configuración</h3>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)} 
                className={`p-1.5 rounded-full transition-colors ${darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className={`text-[11px] font-bold flex items-center gap-1.5 ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                Nombre de usuario
              </label>
              <input
                type="text"
                value={currentUserName}
                onChange={(e) => setCurrentUserName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none focus:border-emerald-500 transition-colors ${
                  darkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-300 text-zinc-900"
                }`}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className={`text-[11px] font-bold flex items-center justify-between ${darkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-amber-500" />
                  Tamaño de texto (Adulto Mayor)
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "normal", label: "Normal", sizeClass: "text-xs" },
                  { id: "large", label: "Grande", sizeClass: "text-base" },
                  { id: "xlarge", label: "Muy Grande", sizeClass: "text-lg" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTextSize(item.id);
                      if (setFontSize) setFontSize(item.id);
                    }}
                    className={`py-2 px-1 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      textSize === item.id
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : darkMode
                        ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    <span className={item.sizeClass}>A</span>
                    <span className="text-[9px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(!isChangePasswordOpen)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors ${
                  darkMode ? "bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800" : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-500" />
                  <span>Cambiar contraseña</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isChangePasswordOpen ? "rotate-90" : ""}`} />
              </button>

              {isChangePasswordOpen && (
                <form onSubmit={handleSavePassword} className="mt-2.5 p-3 rounded-xl border border-zinc-700/50 space-y-2.5 bg-black/20">
                  {passSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold py-1">
                      <Check className="w-4 h-4" />
                      ¡Contraseña actualizada!
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-400">Contraseña actual</label>
                        <input
                          type="password"
                          required
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                            darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-zinc-400">Nueva contraseña</label>
                        <div className="relative">
                          <input
                            type={showPass ? "text" : "password"}
                            required
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none pr-8 ${
                              darkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-2 top-2 text-zinc-400"
                          >
                            {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-[11px] hover:bg-emerald-400 transition-colors"
                      >
                        Actualizar Contraseña
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="text-xs font-semibold">Modo Oscuro</span>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode && setDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                  darkMode ? "bg-emerald-500 justify-end" : "bg-zinc-300 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold">Notificaciones Push</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                  notifications ? "bg-emerald-500 justify-end" : "bg-zinc-300 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleApplySettings}
              className="w-full py-2.5 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold shadow-md transition-transform active:scale-95"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Modales de Avatar y Ligas */}
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