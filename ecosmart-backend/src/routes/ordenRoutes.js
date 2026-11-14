const express = require('express');
const router = express.Router();
const { getOrdenes, postOrden, patchAvanzar, deleteOrden } = require('../controllers/ordenController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { requireAdmin } = require('../middleware/adminAuth');

// Órdenes de trabajo: solo administradores (ADMIN_UIDS), también para leerlas.
router.use(requireFirebaseUser, requireAdmin);

router.get('/', getOrdenes);
router.post('/', postOrden);
router.patch('/:id/avanzar', patchAvanzar);
router.delete('/:id', deleteOrden);

module.exports = router;
