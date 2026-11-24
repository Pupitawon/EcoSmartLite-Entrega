const express = require('express');
const router = express.Router();
const { getContenedores, updateNivelLlenado, getEstadoConexion, cambiarUbicacion } = require('../controllers/contenedorController');
const { requireFirebaseUser } = require('../middleware/firebaseAuth');
const { requireAdmin } = require('../middleware/adminAuth');
const { requireIngestAuth } = require('../middleware/ingestAuth');
const { limiteLecturas } = require('../middleware/rateLimit');

router.get('/', getContenedores);
// Lectura simple del ESP32 o de la simulación. Exige la credencial (API key), igual que POST /api/lecturas.
router.put('/:id/nivel', limiteLecturas, requireIngestAuth, updateNivelLlenado);
router.get('/conexion', getEstadoConexion); // ?solo_problemas=1
// Solo administradores: el contenedor se trasladó o se corrige su ubicación. { latitud, longitud }
router.patch('/:id/ubicacion', requireFirebaseUser, requireAdmin, cambiarUbicacion);
module.exports = router;
