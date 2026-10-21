const express = require('express');
const router = express.Router();
const { getContenedores, updateNivelLlenado } = require('../controllers/contenedorController');

router.get('/', getContenedores);
router.put('/:id/nivel', updateNivelLlenado);

module.exports = router;