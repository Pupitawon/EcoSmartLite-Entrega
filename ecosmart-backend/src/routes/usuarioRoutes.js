const express = require('express');
const router = express.Router();
const { registrarUsuario, miPerfil, actualizarPreferencias, claveCambiada, misInsignias, misDesafios, miRanking, recuperarClave } = require('../controllers/usuarioController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { limiteRecuperarClave } = require('../middleware/rateLimit');

router.post('/registro', requireFirebaseUser, registrarUsuario);
router.get('/me', requireFirebaseUser, miPerfil);
router.patch('/me', requireFirebaseUser, actualizarPreferencias); // { recibe_notificaciones }
router.post('/me/clave-cambiada', requireFirebaseUser, claveCambiada); // admin con contraseña temporal
router.get('/me/insignias', requireFirebaseUser, misInsignias);
router.get('/me/desafios', requireFirebaseUser, misDesafios);
router.get('/me/ranking', requireFirebaseUser, miRanking);
router.post('/recuperar-clave', limiteRecuperarClave, recuperarClave); // público: no exige sesión

module.exports = router;