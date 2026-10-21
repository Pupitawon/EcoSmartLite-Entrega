require('dotenv').config();

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

const config = {
  // Umbral de alerta de llenado (%). Es el mismo 80 % de RF-02.
  umbralAlerta: num(process.env.UMBRAL_ALERTA, 80),
  // Horas sin lectura para marcar un contenedor como "Sin reporte".
  sinReporteHoras: num(process.env.SIN_REPORTE_HORAS, 6),

  // Quién puede enviar lecturas (ver src/middleware/ingestAuth.js).
  apiKey: process.env.INGEST_API_KEY,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
  firebaseJwksUrl:
    process.env.FIREBASE_JWKS_URL ||
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  firebaseIngestUids: (process.env.FIREBASE_INGEST_UIDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),

  // Límite de lecturas por minuto y por IP.
  rateLimitPorMinuto: num(process.env.RATE_LIMIT_POR_MINUTO, 600),
};

if (!config.apiKey || config.apiKey.length < 16) {
  throw new Error(
    'Falta INGEST_API_KEY (mínimo 16 caracteres). Genera una con: ' +
      "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\" y agrégala al .env"
  );
}

module.exports = config;
