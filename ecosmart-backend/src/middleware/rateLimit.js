const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// Límite por IP para los endpoints que reciben lecturas.
// Si el backend corre detrás de un proxy (Render, Railway, Nginx...), define TRUST_PROXY en el .env
// para que la IP sea la del cliente y no la del proxy (ver index.js).
const limiteLecturas = rateLimit({
  windowMs: 60_000,
  limit: config.rateLimitPorMinuto,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'demasiadas_solicitudes' },
});

module.exports = { limiteLecturas };
