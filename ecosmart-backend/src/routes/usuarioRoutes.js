const express = require('express');
const router = express.Router();
const { registrarUsuario, miPerfil, recuperarClave } = require('../controllers/usuarioController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { limiteRecuperarClave } = require('../middleware/rateLimit');

router.post('/registro', requireFirebaseUser, registrarUsuario);
router.get('/me', requireFirebaseUser, miPerfil);
router.post('/recuperar-clave', limiteRecuperarClave, recuperarClave); // público: no exige sesión

module.exports = router;