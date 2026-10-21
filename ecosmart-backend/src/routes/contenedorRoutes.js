const express = require('express');
const router = express.Router();
const { getContenedores, updateNivelLlenado } = require('../controllers/contenedorController');
const { requireIngestAuth } = require('../middleware/ingestAuth');
const { limiteLecturas } = require('../middleware/rateLimit');

router.get('/', getContenedores);
// Ruta antigua para lecturas del ESP32 / simulación. Ahora exige credencial (API key) igual que POST /api/lecturas.
router.put('/:id/nivel', limiteLecturas, requireIngestAuth, updateNivelLlenado);

module.exports = router;
