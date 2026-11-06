// Distancia en línea recta entre dos puntos { lat, lng } (fórmula de Haversine), en metros.
export function distanciaMetros(a, b) {
  const R = 6371000; // radio de la Tierra en metros
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 85 -> "90 m", 1240 -> "1,2 km"
export function textoDistancia(metros) {
  if (metros < 1000) return `${Math.max(10, Math.round(metros / 10) * 10)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}