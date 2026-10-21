const express = require('express');
const router = express.Router();
// Corregido: el archivo se llama alertasController.js (antes se importaba "alertaController" y el servidor no arrancaba).
const { getAlertasPendientes, getAlertas } = require('../controllers/alertasController');

router.get('/pendientes', getAlertasPendientes);
router.get('/', getAlertas); // ?estado=pendiente|resuelta|duplicada

module.exports = router;
