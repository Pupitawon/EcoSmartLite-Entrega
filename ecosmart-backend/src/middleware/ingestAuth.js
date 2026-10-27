const { createHash, timingSafeEqual } = require('node:crypto');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const config = require('../config/config');

const sha = (s) => createHash('sha256').update(s).digest();

// Se calcula solo si existe config.apiKey para prevenir fallos al arrancar el servidor
const esperada = config.apiKey ? sha(config.apiKey) : null;

const jwks = config.firebaseProjectId ? createRemoteJWKSet(new URL(config.firebaseJwksUrl)) : null;

/**
 * Quién puede enviar lecturas de llenado:
 *  1) Un dispositivo / gateway (ESP32) con la API key: "Authorization: Bearer <INGEST_API_KEY>".
 *  2) Un ID token de Firebase válido con permiso explícito: claim `ingest: true` o UID en FIREBASE_INGEST_UIDS.
 */
async function requireIngestAuth(req, res, next) {
  const header = req.get('authorization') || '';
  
  // Expresión regular insensible a mayúsculas/minúsculas (/i) para soportar 'Bearer', 'bearer', etc.
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match ? match[1].trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'no_autorizado', mensaje: 'Falta el encabezado Authorization: Bearer' });
  }

  // 1. Validación de API Key de Ingesta (para ESP32 / Simulador)
  if (esperada && token) {
    const tokenHash = sha(token);
    // Comparación segura en tiempo constante para mitigar timing attacks
    if (tokenHash.length === esperada.length && timingSafeEqual(tokenHash, esperada)) {
      req.auth = { tipo: 'api_key' };
      return next();
    }
  }

  // 2. Validación de Token JWT de Firebase (para clientes o paneles autorizados)
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

    const uidsAutorizados = config.firebaseIngestUids || [];
    if (payload.ingest === true || uidsAutorizados.includes(payload.sub)) {
      req.auth = { tipo: 'firebase', uid: payload.sub };
      return next();
    }
    return res.status(403).json({ error: 'sin_permiso', mensaje: 'Este usuario no puede enviar lecturas' });
  }

  return res.status(401).json({ error: 'no_autorizado', mensaje: 'Credencial inválida' });
}

module.exports = { requireIngestAuth };