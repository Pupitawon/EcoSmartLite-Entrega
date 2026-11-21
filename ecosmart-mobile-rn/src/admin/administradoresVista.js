// Cómo se muestra cada administrador en la pantalla del súper usuario. Sin React: se prueba con node --test.
import { COLOR } from './utils.js';

/** Estado visible de un administrador de la tabla. */
export function estadoAdmin(a) {
  if (!a.activo) return { texto: 'Desactivado', color: COLOR.gris };
  if (a.debe_cambiar_clave) return { texto: 'Debe cambiar contraseña', color: COLOR.ambar };
  return { texto: 'Activo', color: COLOR.verde };
}

/** '+56912345678' -> '+56 9 1234 5678'. Lo que no reconoce lo deja igual. */
export function telefonoVisible(t) {
  if (!t) return '—';
  const m = /^\+569(\d{4})(\d{4})$/.exec(t);
  return m ? `+56 9 ${m[1]} ${m[2]}` : t;
}
