const express = require('express');
const cors = require('cors');
require('dotenv').config();

const contenedorRoutes = require('./src/routes/contenedorRoutes');
const alertaRoutes = require('./src/routes/alertaRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/contenedores', contenedorRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Ruta Raíz
app.get('/', (req, res) => {
  res.json({ 
    proyecto: 'EcoSmart API Backend', 
    estado: 'En ejecución',
    puerto: PORT
  });
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(` Servidor Backend ejecutándose en el puerto ${PORT}`);
});