const { createRemoteJWKSet, jwtVerify } = require('jose');
const config = require('../config/config');

const jwks = config.firebaseProjectId ? createRemoteJWKSet(new URL(config.firebaseJwksUrl)) : null;

/**
 * Exige un ID token de Firebase válido de ESTE proyecto (firma, emisor, audiencia y expiración).
 * Deja en req.user { uid, email, emailVerificado }. El UID sale del token, nunca del cuerpo de la solicitud.
 */
async function requireFirebaseUser(req, res, next) {
  if (!jwks) {
    return res.status(503).json({ error: 'firebase_no_configurado', mensaje: 'Falta FIREBASE_PROJECT_ID en el servidor' });
  }
  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  const token = match ? match[1].trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'no_autorizado', mensaje: 'Falta el encabezado Authorization: Bearer' });
  }
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${config.firebaseProjectId}`,
      audience: config.firebaseProjectId,
      algorithms: ['RS256'],
    });
    if (!payload.sub) throw new Error('sin sub');
    req.user = { uid: payload.sub, email: payload.email || null, emailVerificado: payload.email_verified === true };
    return next();
  } catch {
    return res.status(401).json({ error: 'no_autorizado', mensaje: 'Token inválido o expirado' });
  }
}

module.exports = { requireFirebaseUser };
