// Reglas de seguridad de la contraseña. Se usan al registrarse y al cambiarla.
// Conviene configurar la misma política en Firebase (Authentication > Configuración > Política de contraseñas),
// porque las reglas de la app solo las aplica la app; la política de Firebase las exige el servidor.
export const LARGO_MINIMO = 8;

const REGLAS = [
  { id: 'largo', texto: `Al menos ${LARGO_MINIMO} caracteres`, cumple: (c) => c.length >= LARGO_MINIMO },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (c) => /[A-ZÁÉÍÓÚÑ]/.test(c) },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (c) => /[a-záéíóúñ]/.test(c) },
  { id: 'numero', texto: 'Un número', cumple: (c) => /\d/.test(c) },
  { id: 'especial', texto: 'Un carácter especial (por ejemplo ! @ # $ %)', cumple: (c) => /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(c) },
];

/** Estado de cada requisito para la contraseña dada: [{ id, texto, ok }]. */
export const evaluarClave = (clave = '') => REGLAS.map((r) => ({ id: r.id, texto: r.texto, ok: r.cumple(clave) }));

/** true si cumple todos los requisitos. */
export const claveValida = (clave = '') => evaluarClave(clave).every((r) => r.ok);
