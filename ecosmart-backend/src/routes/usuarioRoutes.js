const express = require('express');
const router = express.Router();
const { registrarDeposito, registrarUsuario, miPerfil } = require('../controllers/usuarioController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');

router.post('/registro', requireFirebaseUser, registrarUsuario);
router.get('/me', requireFirebaseUser, miPerfil);
router.post('/deposito', registrarDeposito);

module.exports = router;
