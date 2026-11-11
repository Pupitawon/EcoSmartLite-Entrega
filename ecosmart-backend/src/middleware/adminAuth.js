const config = require('../config/config');

/** ¿Es administrador (equipo de Innova Recicla)? Su UID de Firebase debe estar en ADMIN_UIDS. */
const esAdmin = (uid) => Boolean(uid) && config.adminUids.includes(uid);

/** Va después de requireFirebaseUser: deja pasar solo a los administradores. */
function requireAdmin(req, res, next) {
  if (esAdmin(req.user?.uid)) return next();
  return res.status(403).json({ error: 'solo_administradores' });
}

module.exports = { esAdmin, requireAdmin };
