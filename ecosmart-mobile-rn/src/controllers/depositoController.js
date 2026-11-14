const { depositoSchema, registrarDepositoQR } = require('../services/depositoService');

// Código de error de la función SQL (en minúsculas) -> estado HTTP.
const HTTP_POR_ERROR = {
  qr_invalido: 404,
  usuario_no_encontrado: 404,
  contenedor_lleno: 409,
  escaneo_ya_registrado: 409,
  cantidad_invalida: 422,
  fecha_invalida: 422,
};

// Ciudadano autenticado registra botellas recicladas escaneando el QR de un contenedor.
const postDeposito = async (req, res) => {
  const parsed = depositoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: 'datos_invalidos',
      detalles: parsed.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
  }
  try {
    const r = await registrarDepositoQR(req.user.uid, parsed.data);
    if (r.estado === 'perfil_no_encontrado') return res.status(404).json({ error: 'perfil_no_encontrado' });
    if (r.estado === 'rechazado') return res.status(HTTP_POR_ERROR[r.error] || 400).json({ error: r.error });
    // 200 si era un reintento ya registrado (no suma de nuevo), 201 si es un depósito nuevo.
    return res.status(r.deposito.duplicado ? 200 : 201).json({ deposito: r.deposito });
  } catch (err) {
    console.error('Error al registrar depósito:', err.message);
    return res.status(500).json({ error: 'error_interno' });
  }
};

module.exports = { postDeposito };
