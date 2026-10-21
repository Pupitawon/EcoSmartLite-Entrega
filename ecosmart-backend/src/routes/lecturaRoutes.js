const express = require('express');
const router = express.Router();
const { crearLectura } = require('../controllers/lecturaController');
const { requireIngestAuth } = require('../middleware/ingestAuth');
const { limiteLecturas } = require('../middleware/rateLimit');

// Recepción de lecturas (ESP32 / gateway / app autorizada)
router.post('/', limiteLecturas, requireIngestAuth, crearLectura);

module.exports = router;
