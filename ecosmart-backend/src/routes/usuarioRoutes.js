const express = require('express');
const router = express.Router();
const { registrarDeposito } = require('../controllers/usuarioController');

router.post('/deposito', registrarDeposito);

module.exports = router;