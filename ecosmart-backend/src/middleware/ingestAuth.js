const { createHash, timingSafeEqual } = require('node:crypto');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const config = require('../config/config');

const sha = (s) => createHash('sha256').update(s).digest();
const esperada = sha(config.apiKey);

const jwks = config.firebaseProjectId ? createRemoteJWKSet(new URL(config.firebaseJwksUrl)) : null;

/**
 * Quién puede enviar lecturas de llenado:
 *  1) Un dispositivo / gateway (ESP32) con la API key: "Authorization: Bearer <INGEST_API_KEY>".
 *  2) (Opcional) Un ID token de Firebase válido de ESTE proyecto Y con permiso explícito:
 *     claim personalizado `ingest: true`, o UID listado en FIREBASE_INGEST_UIDS.
 *
 * Un token de Firebase válido NO basta: todos los ciudadanos de la app lo tienen. Si bastara,
 * cualquier usuario podría falsear niveles de llenado y disparar alertas.
 */
async function requireIngestAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'no_autorizado', mensaje: 'Falta el encabezado Authorization: Bearer' });
  }

  if (timingSafeEqual(sha(token), esperada)) {
    req.auth = { tipo: 'api_key' };
    return next();
  }

  if (jwks && token.split('.').length === 3) {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, jwks, {
        issuer: `https://securetoken.google.com/${config.firebaseProjectId}`,
        audience: config.firebaseProjectId,
        algorithms: ['RS256'],
      }));
      if (!payload.sub) throw new Error('sin sub');
    } catch {
      return res.status(401).json({ error: 'no_autorizado', mensaje: 'Token inválido o expirado' });
    }
    if (payload.ingest === true || config.firebaseIngestUids.includes(payload.sub)) {
      req.auth = { tipo: 'firebase', uid: payload.sub };
      return next();
    }
    return res.status(403).json({ error: 'sin_permiso', mensaje: 'Este usuario no puede enviar lecturas' });
  }

  return res.status(401).json({ error: 'no_autorizado', mensaje: 'Credencial inválida' });
}

module.exports = { requireIngestAuth };
