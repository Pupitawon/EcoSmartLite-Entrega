const express = require('express');
const router = express.Router();
const { postReporte, getReportes, patchReporte } = require('../controllers/reporteController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { requireAdmin } = require('../middleware/adminAuth');

router.post('/', requireFirebaseUser, postReporte);
router.get('/', getReportes); // ?estado=pendiente|en_revision|resuelto|descartado
// Solo administradores (ADMIN_UIDS) cambian el estado de revisión desde la app.
router.patch('/:id', requireFirebaseUser, requireAdmin, patchReporte);

module.exports = router;
