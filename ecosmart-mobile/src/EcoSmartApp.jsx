import React, { useState, useMemo } from "react";
import {
  Bell,
  User,
  Home,
  MapPin,
  Award,
  Settings,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Camera,
  Lock,
  Crown,
  Recycle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Datos simulados (en una app real vendrían de una API)              */
/* ------------------------------------------------------------------ */

const CANJES = [
  { id: "sodimac", label: "SODIMAC", bg: "bg-white", text: "text-red-600" },
  { id: "gramco", label: "gramco", bg: "bg-blue-500", text: "text-white" },
  { id: "fluxus", label: "FLUXUS", bg: "bg-green-500", text: "text-white" },
  { id: "mcdonalds", label: "M", bg: "bg-yellow-400", text: "text-red-600" },
  { id: "beler", label: "beler", bg: "bg-blue-700", text: "text-white" },
];

const INSIGNIAS = [
  { id: 1, label: "Movilidad Verde", unlocked: true },
  { id: 2, label: "Gota a Gota", unlocked: true },
  { id: 3, label: "Mente Eficiente", unlocked: true },
  { id: 4, label: "Poder de Grupo", unlocked: true },
  { id: 5, label: "Ciclo de Vida", unlocked: true },
  { id: 6, label: "Cielo de Vida", unlocked: true },
  { id: 7, label: "Reciclador Activo", unlocked: true },
  { id: 8, label: "Hogar Eficiente", unlocked: true },
  { id: 9, label: "Ruta Sostenible", unlocked: true },
  { id: 10, label: "Patria Local (Bloqueado)", unlocked: false },
  { id: 11, label: "Pionero Verde (Bloqueado)", unlocked: false },
  { id: 12, label: "Guardián Tierra (Bloqueado)", unlocked: false },
];

const RANKING = [
  { name: "Jeremy", pts: 1000 },
  { name: "Damian", pts: 967 },
  { name: "Danae", pts: 900 },
];

const CANJEO_CATALOGO = {
  Servicios: [
    { id: "gramco", label: "gramco", bg: "bg-blue-500", text: "text-white" },
    { id: "fluxus", label: "FLUXUS", bg: "bg-green-500", text: "text-white" },
    { id: "spotify", label: "♫", bg: "bg-green-600", text: "text-white" },
    { id: "pd", label: "Pd", bg: "bg-teal-500", text: "text-white" },
  ],
  Comida: [
    { id: "mcdonalds", label: "M", bg: "bg-yellow-400", text: "text-red-600" },
    { id: "beler", label: "beler", bg: "bg-blue-700", text: "text-white" },
    {
      id: "starbucks",
      label: "Starbucks",
      bg: "bg-green-700",
      text: "text-white",
      pts: 2000,
      desc:
        "30% Off en Vasos Reutilizables. Adquiere tu termo o vaso reutilizable con descuento. ¡Recuerda que si llevas tu vaso te hacen un descuento extra en tu café!",
    },
    { id: "oxo", label: "OXO", bg: "bg-orange-500", text: "text-white" },
  ],
  Otros: [
    { id: "sodimac", label: "SODIMAC", bg: "bg-white", text: "text-red-600" },
    {
      id: "lapizlopez",
      label: "LAPIZ LOPEZ",
      bg: "bg-black",
      text: "text-white",
      pts: 3000,
      desc:
        "Obtén un 15% de descuento en el total de tu boleta. Válido para destacar, tomar apuntes y organizar tus proyectos.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Piezas de interfaz reutilizables                                   */
/* ------------------------------------------------------------------ */

function PhoneShell({ children }) {
  return (
    <div className="w-full max-w-sm mx-auto bg-white border-4 border-amber-500 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[700px]">
      {children}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-1">
        <span className="text-green-600 font-extrabold text-lg tracking-tight">
          ECO
        </span>
        <Recycle className="w-4 h-4 text-amber-500" strokeWidth={2.5} />
        <span className="text-stone-500 font-extrabold text-lg tracking-tight">
          SMART
        </span>
      </div>
      <div className="flex items-center gap-2 text-amber-500">
        <Bell className="w-5 h-5" />
        <User className="w-5 h-5" />
      </div>
    </div>
  );
}

function BottomNav({ active, onChange }) {
  const items = [
    { id: "home", icon: Home },
    { id: "mapa", icon: MapPin },
    { id: "qr", icon: QrCode, isCenter: true },
    { id: "logros", icon: Award },
    { id: "ajustes", icon: Settings },
  ];

  return (
    <div className="mt-auto bg-green-600 px-6 py-3 flex items-center justify-between">
      {items.map(({ id, icon: Icon, isCenter }) =>
        isCenter ? (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label="Escanear código QR"
            className={`w-11 h-11 rounded-full flex items-center justify-center -mt-6 shadow-md transition-colors ${
              active === id ? "bg-amber-600" : "bg-amber-500"
            }`}
          >
            <Icon className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={id}
            className={`transition-colors ${
              active === id ? "text-white" : "text-green-800"
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      )}
    </div>
  );
}

function PointsCard({ points }) {
  return (
    <div className="mx-5 mt-4 bg-amber-800 rounded-xl px-5 py-4 text-white">
      <p className="text-xs font-medium opacity-90">ECO-Puntos</p>
      <p className="text-3xl font-extrabold mt-1">$ {points}</p>
    </div>
  );
}

function LogoChip({ item, size = "w-12 h-12", onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${size} shrink-0 rounded-md border border-stone-200 shadow-sm flex items-center justify-center text-[10px] font-bold overflow-hidden ${item.bg} ${item.text}`}
      title={item.label}
    >
      {item.label.slice(0, 6)}
    </button>
  );
}

function CanjesCarousel({ onSelect }) {
  const [start, setStart] = useState(0);
  const visible = CANJES.slice(start, start + 4);

  return (
    <div className="mx-5 mt-5">
      <p className="text-sm font-semibold text-stone-700 mb-2">Canjes:</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStart((s) => Math.max(0, s - 1))}
          className="text-stone-400 disabled:opacity-30"
          disabled={start === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2 flex-1 justify-between">
          {visible.map((item) => (
            <LogoChip key={item.id} item={item} onClick={() => onSelect?.(item)} />
          ))}
        </div>
        <button
          onClick={() => setStart((s) => Math.min(CANJES.length - 4, s + 1))}
          className="text-stone-400 disabled:opacity-30"
          disabled={start >= CANJES.length - 4}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pantallas                                                           */
/* ------------------------------------------------------------------ */

function HomeScreen({ userName, points }) {
  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <p className="mx-5 mt-2 text-base font-semibold text-stone-800">
        ¡Hola {userName}!
      </p>
      <PointsCard points={points} />
      <CanjesCarousel />
    </div>
  );
}

function LogrosScreen({ userName, points, weeklyGoal, weeklyProgress }) {
  const pct = Math.round((weeklyProgress / weeklyGoal) * 100);

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="mx-5 mt-4 bg-amber-800 rounded-xl overflow-hidden text-white">
        <p className="text-center text-sm font-semibold py-2 bg-amber-900/40">
          Logros semanales
        </p>
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="w-full h-4 bg-amber-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 flex items-center pl-2 text-[10px] font-bold"
                style={{ width: `${pct}%` }}
              >
                {weeklyProgress} pts
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white text-amber-800 text-[10px] font-bold flex items-center justify-center">
            {pct}%
          </div>
        </div>
      </div>

      <p className="mx-5 mt-4 text-sm font-semibold text-stone-800">
        Insignias:
      </p>
      <div className="mx-5 mt-2 flex gap-2">
        {INSIGNIAS.slice(0, 5).map((b) => (
          <BadgeIcon key={b.id} badge={b} small />
        ))}
      </div>

      <div className="mx-5 mt-5">
        <p className="text-sm font-semibold text-stone-800 flex items-center gap-1">
          <span>@</span>Ranking
        </p>
        <ul className="mt-2 divide-y divide-stone-100">
          {RANKING.map((r, i) => (
            <li key={r.name} className="flex items-center justify-between py-1.5 text-sm">
              <span className="flex items-center gap-2 text-stone-700">
                {i === 0 ? (
                  <Crown className="w-4 h-4 text-amber-500" />
                ) : (
                  <Recycle className="w-3.5 h-3.5 text-green-600" />
                )}
                {i + 1}- {r.name}
              </span>
              <span className="font-semibold text-stone-800">{r.pts} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BadgeIcon({ badge, small }) {
  const size = small ? "w-11 h-11" : "w-full aspect-square";
  return (
    <div
      className={`${size} rounded-lg border-2 flex items-center justify-center relative ${
        badge.unlocked
          ? "border-green-500 bg-green-50"
          : "border-amber-700 bg-stone-100"
      }`}
      title={badge.label}
    >
      {badge.unlocked ? (
        <Recycle className="w-5 h-5 text-green-600" />
      ) : (
        <Lock className="w-5 h-5 text-stone-400" />
      )}
    </div>
  );
}

function InsigniasScreen() {
  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <p className="mx-5 mt-4 text-sm font-semibold text-stone-800">
        Insignias:
      </p>
      <div className="mx-5 mt-3 grid grid-cols-3 gap-3">
        {INSIGNIAS.map((b) => (
          <div key={b.id} className="flex flex-col items-center gap-1">
            <BadgeIcon badge={b} />
            <span className="text-[9px] text-stone-500 text-center leading-tight">
              {b.label.replace(" (Bloqueado)", "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ userName, onSave }) {
  const [name, setName] = useState(userName);
  const [password, setPassword] = useState("");

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-col items-center pt-8">
        <div className="w-24 h-24 rounded-full bg-stone-200 border-4 border-white shadow flex items-center justify-center overflow-hidden">
          <User className="w-12 h-12 text-stone-400" />
        </div>
      </div>
      <form
        className="px-8 mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.(name);
        }}
      >
        <div>
          <label className="text-sm font-semibold text-stone-800">
            Nombre:
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-stone-300 rounded-md px-3 py-2 text-sm text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-800">
            Contraseña:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••"
            className="mt-1 w-full border border-stone-300 rounded-md px-3 py-2 text-sm text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Guardar cambios
        </button>
      </form>
      <div className="mt-auto bg-green-600 h-10" />
    </div>
  );
}

function MapScreen() {
  return (
    <div className="flex-1 flex flex-col">
      <p className="mx-5 mt-4 text-base font-semibold text-stone-800">
        Puntos de reciclaje cercanos
      </p>
      <div className="mx-5 mt-3 flex-1 rounded-xl border-2 border-green-500 bg-stone-100 relative overflow-hidden">
        {/* Mapa simulado */}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,#00000008_25%,#00000008_26%,transparent_27%,transparent_74%,#00000008_75%,#00000008_76%,transparent_77%),linear-gradient(90deg,transparent_24%,#00000008_25%,#00000008_26%,transparent_27%,transparent_74%,#00000008_75%,#00000008_76%,transparent_77%)] bg-[length:40px_40px]" />
        <MapPin className="w-6 h-6 text-red-500 absolute top-10 left-16" />
        <MapPin className="w-6 h-6 text-green-600 absolute top-24 right-10" />
        <MapPin className="w-6 h-6 text-red-500 absolute bottom-16 left-24" />
        <div className="absolute bottom-3 right-3 bg-white text-[10px] px-2 py-1 rounded shadow">
          Toca un pin para ver detalles
        </div>
      </div>
    </div>
  );
}

function StationScreen({ level = "Nivel", capacity = "Limitado" }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <Recycle className="w-full h-full text-amber-500 opacity-90" />
        <div className="absolute w-20 h-32 bg-stone-700 rounded-md flex flex-col items-center justify-between p-2">
          <div className="w-10 h-6 bg-stone-500 rounded-sm" />
          <QrCode className="w-8 h-8 text-white" />
          <div className="w-8 h-3 bg-green-500 rounded-sm" />
        </div>
      </div>
      <div className="flex justify-between w-full max-w-xs mt-4 text-sm font-semibold text-stone-700">
        <span>{level}</span>
        <span>{capacity}</span>
      </div>
    </div>
  );
}

function CanjeoScreen({ points }) {
  const [selected, setSelected] = useState(null);
  const [redeemed, setRedeemed] = useState({});

  const handleRedeem = (item) => {
    setRedeemed((prev) => ({ ...prev, [item.id]: true }));
  };

  if (selected) {
    const isDone = redeemed[selected.id];
    return (
      <div className="flex-1 p-5">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-stone-500 flex items-center gap-1 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Volver
        </button>
        <div
          className={`rounded-xl p-5 text-white shadow-md ${
            selected.text === "text-white" && selected.bg !== "bg-white"
              ? selected.bg
              : "bg-green-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">{selected.label}</span>
            <span className="text-sm font-semibold">{selected.pts} Pts</span>
          </div>
          <p className="text-xs mt-3 leading-relaxed">{selected.desc}</p>
          <button
            onClick={() => handleRedeem(selected)}
            disabled={isDone}
            className="mt-4 w-full border-2 border-white rounded-md py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isDone ? "¡Canjeado!" : "Canjear"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <p className="mx-5 mt-2 text-base font-semibold text-stone-800">
        ¡Hola!
      </p>
      <PointsCard points={points} />
      {Object.entries(CANJEO_CATALOGO).map(([category, list]) => (
        <div key={category} className="mx-5 mt-5">
          <p className="text-sm font-semibold text-stone-800 mb-2">
            {category}
          </p>
          <div className="flex gap-2">
            {list.map((item) => (
              <LogoChip key={item.id} item={item} onClick={() => setSelected(item)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function QRScreen({ points, onScanned }) {
  const [step, setStep] = useState("home"); // home | scan | code | done
  const [digits, setDigits] = useState([]);
  const earned = 25;

  const pressDigit = (n) => {
    if (digits.length >= 4) return;
    const next = [...digits, n];
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        onScanned?.(earned);
        setStep("done");
      }, 300);
    }
  };

  if (step === "home") {
    return (
      <div className="flex-1 overflow-y-auto pb-4">
        <p className="mx-5 mt-2 text-base font-semibold text-stone-800">
          ¡Hola!
        </p>
        <PointsCard points={points} />
        <div className="mx-5 mt-6">
          <button
            onClick={() => setStep("scan")}
            className="w-full bg-green-600 text-white text-sm font-semibold py-3 rounded-md hover:bg-green-700 transition-colors"
          >
            Escanear código QR
          </button>
        </div>
      </div>
    );
  }

  if (step === "scan") {
    return (
      <div className="flex-1 flex flex-col px-6 pt-6">
        <div className="bg-slate-700 rounded-xl aspect-square flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-4 border-2 border-white/70 rounded-lg" />
          <Camera className="w-10 h-10 mb-3 opacity-80" />
          <QrCode className="w-16 h-16" />
          <p className="mt-4 text-xs tracking-wide opacity-90">
            SCAN TO RECYCLE &amp; EARN!
          </p>
        </div>
        <button
          onClick={() => setStep("code")}
          className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-stone-700 border border-stone-300 rounded-md py-2"
        >
          Ingresar código manualmente <Camera className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="flex-1 flex flex-col items-center px-6 pt-8">
        <p className="text-base font-semibold text-stone-800 mb-4">Dígitos</p>
        <div className="flex gap-2 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-md bg-amber-500 flex items-center justify-center text-white font-bold"
            >
              {digits[i] ?? ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => pressDigit(n)}
              className="w-14 h-14 rounded-full text-xl font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // done
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <p className="text-base font-semibold text-stone-800">
        Gracias por reciclar en
      </p>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-green-600 font-extrabold text-xl">ECO</span>
        <Recycle className="w-4 h-4 text-amber-500" />
        <span className="text-stone-500 font-extrabold text-xl">SMART</span>
      </div>
      <div className="w-px h-4 bg-stone-300 my-2" />
      <p className="text-sm text-stone-500 mt-4">Puntos actuales:</p>
      <div className="mt-2 border border-stone-300 rounded-md px-6 py-2 text-sm font-semibold text-stone-800">
        {points} pts
      </div>
      <button
        onClick={() => {
          setStep("home");
          setDigits([]);
        }}
        className="mt-6 text-sm text-green-600 font-semibold"
      >
        Volver al inicio
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App principal                                                       */
/* ------------------------------------------------------------------ */

export default function EcoSmartApp() {
  const [tab, setTab] = useState("home");
  const [userName, setUserName] = useState("Jeremy");
  const [points, setPoints] = useState(600);

  const handleScanned = (earned) => setPoints((p) => p + earned);

  const screen = useMemo(() => {
    switch (tab) {
      case "home":
        return <HomeScreen userName={userName} points={points} />;
      case "mapa":
        return <MapScreen />;
      case "estacion":
        return <StationScreen />;
      case "perfil":
        return <ProfileScreen userName={userName} onSave={setUserName} />;
      case "canjeo":
        return <CanjeoScreen points={points} />;
      case "qr":
        return <QRScreen points={points} onScanned={handleScanned} />;
      case "logros":
        return (
          <LogrosScreen
            userName={userName}
            points={points}
            weeklyGoal={1000}
            weeklyProgress={500}
          />
        );
      case "insignias":
        return <InsigniasScreen />;
      default:
        return <HomeScreen userName={userName} points={points} />;
    }
  }, [tab, userName, points]);

  const secondaryTabs = [
    { id: "home", label: "Inicio" },
    { id: "perfil", label: "Perfil" },
    { id: "mapa", label: "Mapa" },
    { id: "estacion", label: "Estación" },
    { id: "canjeo", label: "Canjeo" },
    { id: "qr", label: "QR" },
    { id: "logros", label: "Logros" },
    { id: "insignias", label: "Insignias" },
  ];

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4">
      <div className="max-w-sm mx-auto mb-4 flex flex-wrap gap-2 justify-center">
        {secondaryTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              tab === t.id
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-stone-600 border-stone-300 hover:border-green-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <PhoneShell>
        <TopBar />
        {screen}
        <BottomNav
          active={
            ["logros", "insignias"].includes(tab)
              ? "logros"
              : ["perfil", "mapa", "estacion"].includes(tab)
              ? "mapa"
              : tab
          }
          onChange={(id) => {
            if (id === "logros") setTab("logros");
            else if (id === "mapa") setTab("mapa");
            else setTab(id);
          }}
        />
      </PhoneShell>
    </div>
  );
}
