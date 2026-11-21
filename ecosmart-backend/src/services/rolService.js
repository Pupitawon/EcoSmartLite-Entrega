const pool = require('../config/db');
const config = require('../config/config');

const COLUMNAS_ADMIN =
  'id_admin, id_auth, correo, nombre_completo, telefono, rut, activo, debe_cambiar_clave, creado_por, fecha_creacion, fecha_actualizacion';

/** ¿Es súper usuario? Su UID está en SUPER_UIDS. */
const esSuper = (uid) => Boolean(uid) && config.superUids.includes(uid);

/**
 * Rol de una cuenta de Firebase:
 * - súper usuario (SUPER_UIDS) y ADMIN_UIDS: siempre admin, nunca bloqueados aunque tengan fila;
 * - si no, admin = fila de `administrador` con activo = true.
 * `admin` es la fila (o null), para mostrar sus datos en /me.
 */
async function rolDe(uid) {
  if (!uid) return { esAdmin: false, esSuper: false, debeCambiarClave: false, desactivado: false, admin: null };
  const { rows } = await pool.query(`SELECT ${COLUMNAS_ADMIN} FROM administrador WHERE id_auth = $1`, [uid]);
  const admin = rows[0] || null;
  const sup = esSuper(uid);
  if (sup || config.adminUids.includes(uid)) {
    return { esAdmin: true, esSuper: sup, debeCambiarClave: false, desactivado: false, admin };
  }
  if (!admin) return { esAdmin: false, esSuper: false, debeCambiarClave: false, desactivado: false, admin: null };
  return {
    esAdmin: admin.activo,
    esSuper: false,
    debeCambiarClave: admin.activo && admin.debe_cambiar_clave,
    desactivado: !admin.activo,
    admin,
  };
}

module.exports = { rolDe, esSuper, COLUMNAS_ADMIN };
