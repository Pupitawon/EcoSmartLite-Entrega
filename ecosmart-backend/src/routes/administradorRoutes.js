const express = require('express');
const router = express.Router();
const { listar, crear, cambiarActivo, reenviar } = require('../controllers/administradorController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { requireSuper } = require('../middleware/adminAuth');
const { limiteAdministradores } = require('../middleware/rateLimit');

// Gestión de administradores: solo el súper usuario (SUPER_UIDS).
router.use(limiteAdministradores, requireFirebaseUser, requireSuper);

router.get('/', listar);
router.post('/', crear); // { nombre_completo, correo, telefono, rut?, modo: 'enlace' | 'temporal' }
router.patch('/:id', cambiarActivo); // { activo }
router.post('/:id/reenviar', reenviar);

module.exports = router;
