const { z } = require('zod');
const { normalizarRut, rutValido } = require('../utils/rut');

/** Celular chileno -> +569XXXXXXXX. Acepta '9 1234 5678', '912345678', '+56912345678', '56912345678'. null si no es válido. */
function normalizarTelefono(valor) {
  const digitos = String(valor ?? '').replace(/[\s\-().+]/g, '');
  const local = digitos.startsWith('56') ? digitos.slice(2) : digitos;
  return /^9\d{8}$/.test(local) ? `+56${local}` : null;
}

/** Datos con que el súper usuario crea un administrador (POST /api/administradores). */
const adminSchema = z
  .object({
    nombre_completo: z.string().trim().min(2).max(100),
    correo: z.string().trim().toLowerCase().email().max(254),
    telefono: z
      .string()
      .transform(normalizarTelefono)
      .refine((t) => t !== null, 'Teléfono inválido: usa un celular chileno, por ejemplo 9 1234 5678'),
    rut: z.string().transform(normalizarRut).refine(rutValido, 'RUT inválido').optional(),
    modo: z.enum(['enlace', 'temporal']),
  })
  .strict();

module.exports = { adminSchema, normalizarTelefono };
