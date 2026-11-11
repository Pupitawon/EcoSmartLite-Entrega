const express = require('express');
const router = express.Router();
const { postDeposito, getResumen } = require('../controllers/depositoController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { limiteDepositos } = require('../middleware/rateLimit');

router.get('/resumen', limiteDepositos, requireFirebaseUser, getResumen);
router.post('/', limiteDepositos, requireFirebaseUser, postDeposito);

module.exports = router;
