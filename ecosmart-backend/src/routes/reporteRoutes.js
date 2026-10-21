const express = require('express');
const router = express.Router();
const { postReporte, getReportes, patchReporte } = require('../controllers/reporteController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');

router.post('/', requireFirebaseUser, postReporte);
router.get('/', getReportes); // ?estado=pendiente|en_revision|resuelto|descartado
// Igual que /api/alertas, el panel aún no tiene login: proteger con rol admin antes de publicarlo.
router.patch('/:id', patchReporte);

module.exports = router;
