const express = require('express');
const router = express.Router();
// Alertas de contenedores: pendientes y listado general.
const { getAlertasPendientes, getAlertas } = require('../controllers/alertasController');

router.get('/pendientes', getAlertasPendientes);
router.get('/', getAlertas); // ?estado=pendiente|resuelta|duplicada

module.exports = router;
