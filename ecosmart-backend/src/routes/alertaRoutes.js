const express = require('express');
const router = express.Router();
const { getAlertasPendientes } = require('../controllers/alertaController');

router.get('/pendientes', getAlertasPendientes);

module.exports = router;