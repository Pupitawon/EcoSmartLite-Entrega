const { rolDe } = require('../services/rolService');

/**
 * Va después de requireFirebaseUser: deja pasar solo a los administradores (súper usuario, ADMIN_UIDS
 * o fila activa de `administrador`). Un admin con contraseña temporal sin cambiar queda bloqueado
 * también en el servidor, no solo en la app. Deja el rol en req.rol.
 */
async function requireAdmin(req, res, next) {
  try {
    const rol = await rolDe(req.user?.uid);
    if (!rol.esAdmin) return res.status(403).json({ error: 'solo_administradores' });
    if (rol.debeCambiarClave) return res.status(403).json({ error: 'debe_cambiar_clave' });
    req.rol = rol;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Va después de requireFirebaseUser: solo el súper usuario (gestiona administradores). */
async function requireSuper(req, res, next) {
  try {
    const rol = await rolDe(req.user?.uid);
    if (!rol.esSuper) return res.status(403).json({ error: 'solo_super_usuario' });
    req.rol = rol;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAdmin, requireSuper };
