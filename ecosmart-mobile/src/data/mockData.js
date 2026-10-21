/**
 * mockData.js - Datos simulados de la app EcoSmart (Calama).
 */

// Importación de insignias desde la carpeta assets
import imgMovilidad from "../assets/insignias/movilidad-verde.png";
import imgGota from "../assets/insignias/gota-a-gota.png";
import imgMente from "../assets/insignias/mente-eficiente.png";
import imgGrupo from "../assets/insignias/poder-de-grupo.png";
import imgCiclo from "../assets/insignias/ciclo-de-vida.png";
import imgCielo from "../assets/insignias/cielo-de-vida.png";
import imgReciclador from "../assets/insignias/reciclador-activo.png";
import imgHogar from "../assets/insignias/hogar-eficiente.png";
import imgRuta from "../assets/insignias/ruta-sostenible.png";
import imgPatria from "../assets/insignias/patria-local.png";
import imgPionero from "../assets/insignias/pionero-verde.png";
import imgGuardian from "../assets/insignias/guardian-tierra.png";

export const CANJES = [
  { id: "sodimac", label: "SODIMAC", bg: "bg-white", text: "text-red-600" },
  { id: "gramco", label: "gramco", bg: "bg-blue-500", text: "text-white" },
  { id: "fluxus", label: "FLUXUS", bg: "bg-green-500", text: "text-white" },
  { id: "mcdonalds", label: "M", bg: "bg-yellow-400", text: "text-red-600" },
  { id: "beler", label: "beler", bg: "bg-blue-700", text: "text-white" },
];

export const CANJEO_CATALOGO = {
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
      desc: "30% Off en Vasos Reutilizables. Adquiere tu termo o vaso reutilizable con descuento.",
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
      desc: "Obtén un 15% de descuento en el total de tu boleta. Válido para destacar y organizar tus proyectos.",
    },
  ],
};

export const INSIGNIAS = [
  { id: 1, label: "Movilidad Verde", desc: "Usas medios de transporte sostenibles para cuidar el planeta.", image: imgMovilidad, unlocked: true },
  { id: 2, label: "Gota a Gota", desc: "Cada acción cuenta, ahorras agua y proteges nuestros recursos.", image: imgGota, unlocked: true },
  { id: 3, label: "Mente Eficiente", desc: "Usas la energía de forma responsable y reduces tu impacto ambiental.", image: imgMente, unlocked: true },
  { id: 4, label: "Poder de Grupo", desc: "El trabajo en equipo multiplica el impacto positivo.", image: imgGrupo, unlocked: true },
  { id: 5, label: "Ciclo de Vida", desc: "Entiendes el ciclo de los materiales y fomentas su uso responsable.", image: imgCiclo, unlocked: true },
  { id: 6, label: "Cielo de Vida", desc: "Cuidas nuestro planeta hoy para un mejor mañana.", image: imgCielo, unlocked: true },
  { id: 7, label: "Reciclador Activo", desc: "Eres constante y comprometido con el reciclaje.", image: imgReciclador, unlocked: true },
  { id: 8, label: "Hogar Eficiente", desc: "Tu hogar es un ejemplo de ahorro y sostenibilidad.", image: imgHogar, unlocked: true },
  { id: 9, label: "Ruta Sostenible", desc: "Eliges rutas responsables y reduces tu huella de carbono.", image: imgRuta, unlocked: true },
  { id: 10, label: "Patria Local", desc: "Sigue reciclando en tu comunidad para desbloquear este logro.", image: imgPatria, unlocked: false },
  { id: 11, label: "Pionero Verde", desc: "Alcanza nuevos niveles de compromiso para desbloquear este logro.", image: imgPionero, unlocked: false },
  { id: 12, label: "Guardián Tierra", desc: "Demuestra tu compromiso y conviértete en guardián del planeta.", image: imgGuardian, unlocked: false },
];

export const RANKING = [
  { id: 1, name: "Jeremy", pts: 1000, avatar: "/avatars/jeremy.png" },
  { id: 2, name: "Damian", pts: 967, avatar: null },
  { id: 3, name: "Danae", pts: 900, avatar: null },
  { id: 4, name: "Carlos", pts: 820, avatar: null },
  { id: 5, name: "Sofia", pts: 750, avatar: null },
];

// Puntos estratégicos de reciclaje en Calama con coordenadas reales GPS
// status: "low" (verde), "medium" (amarillo), "full" (rojo)
export const MAP_PINS = [
  {
    id: "pin-1",
    qrCode: "ECO-BIN-MLZ1",
    name: "Punto Verde Mallplaza Calama",
    category: "Comercial",
    lat: -22.4589,
    lng: -68.9248,
    fill: 92,
    address: "Av. Balmaceda 3242",
    acceptedMaterials: ["PET", "Latas", "Cartón"]
  },
  {
    id: "pin-2",
    qrCode: "ECO-BIN-LOA2",
    name: "Estación Parque El Loa",
    category: "Área Verde",
    lat: -22.4682,
    lng: -68.9285,
    fill: 18,
    address: "Av. Balmaceda s/n",
    acceptedMaterials: ["Vidrio", "PET", "Latas"]
  },
  {
    id: "pin-3",
    qrCode: "ECO-BIN-OAS3",
    name: "Punto Reciclaje Parque Urbano Oasis",
    category: "Área Verde",
    lat: -22.4665,
    lng: -68.9338,
    fill: 58,
    address: "Sector Sur-Poniente",
    acceptedMaterials: ["PET", "Papel/Cartón"]
  },
  {
    id: "pin-4",
    qrCode: "ECO-BIN-LID4",
    name: "Estación Lider Balmaceda",
    category: "Supermercado",
    lat: -22.4431,
    lng: -68.9189,
    fill: 25,
    address: "Av. Balmaceda / Huaytiquina",
    acceptedMaterials: ["PET", "Latas", "Tetra Pak"]
  },
  {
    id: "pin-5",
    qrCode: "ECO-BIN-INC5",
    name: "Punto Vecinal Villa Portal del Inca VI",
    category: "Residencial",
    lat: -22.4532,
    lng: -68.9412,
    fill: 30,
    address: "Sector Poniente",
    acceptedMaterials: ["Vidrio", "PET"]
  },
  {
    id: "pin-6",
    qrCode: "ECO-BIN-FER6",
    name: "Estación Feria Modelo",
    category: "Comercio Local",
    lat: -22.4608,
    lng: -68.9281,
    fill: 65,
    address: "Av. Granaderos",
    acceptedMaterials: ["Cartón", "Latas", "PET"]
  }
];

// Umbrales del semáforo ciudadano (RNF-04), alineados con la alerta
// operativa principal del 80% definida en RF-02 / RNF-02.
export const FILL_THRESHOLDS = {
  MEDIUM: 50, // desde aquí pasa de "Disponible" a "Ocupación"
  FULL: 80,   // desde aquí pasa a "Lleno" (mismo umbral de la alerta 80%)
};

export const STATUS_META = {
  low: { color: "#22c55e", label: "Disponible" },
  medium: { color: "#eab308", label: "Ocupación" },
  full: { color: "#ef4444", label: "Lleno" },
};

/**
 * Deriva el estado (low/medium/full) a partir del % de llenado del
 * contenedor, según los umbrales de RNF-04. Úsese siempre esta función
 * en vez de leer un campo "status" fijo, para que el color mostrado al
 * ciudadano nunca quede desincronizado del dato real del sensor.
 */
export function getFillStatus(fill) {
  if (fill >= FILL_THRESHOLDS.FULL) return "full";
  if (fill >= FILL_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

// ---------------------------------------------------------------------
// RF-05 · Reporte ciudadano de anomalías
// (contenedor dañado o con residuos que no corresponden a su tipo)
// ---------------------------------------------------------------------

export const ANOMALY_TYPES = [
  { id: "danado", label: "Contenedor dañado" },
  { id: "residuos_incorrectos", label: "Residuos que no corresponden" },
  { id: "otro", label: "Otro problema" },
];

// Simula el almacenamiento en backend de los reportes ciudadanos.
// En producción esto sería un POST a la API que alimenta el módulo
// histórico / trazabilidad de Innova Recicla (RF-03).
export const anomalyReports = [];

export function submitAnomalyReport({ stationId, stationName, typeId, description }) {
  const report = {
    id: `rep-${Date.now()}`,
    stationId,
    stationName,
    typeId,
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  anomalyReports.push(report);
  return report;
}

// ---------------------------------------------------------------------
// RF-06 · Validación e incentivo por reciclaje (escaneo QR)
// ---------------------------------------------------------------------

export const POINTS_PER_DEPOSIT = 25;

// Simula el registro histórico de depósitos validados (alimenta el
// módulo de trazabilidad de RF-03: qué contenedor, cuándo, y cuántos
// puntos se acreditaron).
export const depositHistory = [];

/**
 * Busca el contenedor real asociado a un código QR. Devuelve null si el
 * código no corresponde a ningún contenedor del piloto.
 */
export function findStationByQrCode(code) {
  const clean = code.trim().toUpperCase();
  return MAP_PINS.find((pin) => pin.qrCode === clean) || null;
}

/**
 * Registra la validación de un depósito de reciclaje en un contenedor
 * real y devuelve el evento creado con los puntos otorgados.
 */
export function registerDeposit(station) {
  const event = {
    id: `dep-${Date.now()}`,
    stationId: station.id,
    stationName: station.name,
    points: POINTS_PER_DEPOSIT,
    createdAt: new Date().toISOString(),
  };
  depositHistory.push(event);
  return event;
}

// ---------------------------------------------------------------------
// RF-01 · Monitoreo en tiempo real / RF-02 · Alertas preventivas de
// llenado (Panel de Control Operativo — Innova Recicla)
// ---------------------------------------------------------------------

export function getActiveAlerts() {
  return MAP_PINS.filter((pin) => getFillStatus(pin.fill) === "full");
}

// ---------------------------------------------------------------------
// RF-03 · Registro y consulta histórica de retiros
// ---------------------------------------------------------------------

export const PICKUP_HISTORY = [
  { id: "pk-1", stationId: "pin-1", stationName: "Punto Verde Mallplaza Calama", date: "2026-08-24", fillAtPickup: 88, emptiedBy: "Cuadrilla A" },
  { id: "pk-2", stationId: "pin-3", stationName: "Punto Reciclaje Parque Urbano Oasis", date: "2026-08-26", fillAtPickup: 82, emptiedBy: "Cuadrilla B" },
  { id: "pk-3", stationId: "pin-6", stationName: "Estación Feria Modelo", date: "2026-08-27", fillAtPickup: 91, emptiedBy: "Cuadrilla A" },
  { id: "pk-4", stationId: "pin-4", stationName: "Estación Lider Balmaceda", date: "2026-08-28", fillAtPickup: 85, emptiedBy: "Cuadrilla B" },
  { id: "pk-5", stationId: "pin-1", stationName: "Punto Verde Mallplaza Calama", date: "2026-08-19", fillAtPickup: 90, emptiedBy: "Cuadrilla A" },
  { id: "pk-6", stationId: "pin-2", stationName: "Estación Parque El Loa", date: "2026-08-15", fillAtPickup: 83, emptiedBy: "Cuadrilla C" },
];