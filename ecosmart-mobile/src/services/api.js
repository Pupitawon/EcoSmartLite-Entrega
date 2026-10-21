// Conexión con el backend de EcoSmart (ecosmart-backend).
// Define VITE_API_URL en ecosmart-mobile/.env (ver .env.example). Por defecto apunta al backend local.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function getJSON(ruta) {
  const res = await fetch(`${API_URL}${ruta}`);
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  return res.json();
}

export const apiUrl = API_URL;
export const getConfig = () => getJSON("/api/config");
export const getContenedores = () => getJSON("/api/contenedores");
export const getAlertas = () => getJSON("/api/alertas");
export const getReportes = (estado) => getJSON(`/api/reportes${estado ? `?estado=${encodeURIComponent(estado)}` : ""}`);

/**
 * Abre la conexión en vivo (Server-Sent Events). El navegador reconecta solo si se corta.
 * - onEstado("en_vivo" | "reconectando")
 * - onLectura({ contenedor, alerta_creada, alerta_resuelta })
 * Devuelve una función para cerrarla.
 */
export function abrirStream({ onEstado, onLectura }) {
  const es = new EventSource(`${API_URL}/api/stream`);
  es.onopen = () => onEstado("en_vivo");
  es.onerror = () => onEstado("reconectando");
  es.addEventListener("lectura", (ev) => {
    try {
      onLectura(JSON.parse(ev.data));
    } catch {
      /* evento mal formado: se ignora */
    }
  });
  return () => es.close();
}
