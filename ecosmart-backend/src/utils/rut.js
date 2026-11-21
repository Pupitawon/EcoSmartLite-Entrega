// RUT chileno: 7-8 dígitos + dígito verificador (módulo 11). Se guarda como 12345678-K, sin puntos.
// Lo usan el registro de ciudadanos y el de administradores.

function normalizarRut(raw) {
  return String(raw).replace(/[.\s]/g, '').toUpperCase();
}

function rutValido(rut) {
  const m = /^(\d{7,8})-([\dK])$/.exec(rut);
  if (!m) return false;
  let suma = 0, mult = 2;
  for (let i = m[1].length - 1; i >= 0; i--) {
    suma += Number(m[1][i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (suma % 11);
  const dv = r === 11 ? '0' : r === 10 ? 'K' : String(r);
  return dv === m[2];
}

module.exports = { normalizarRut, rutValido };
