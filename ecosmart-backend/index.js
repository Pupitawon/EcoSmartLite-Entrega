const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const config = require('./src/config/config');
const contenedorRoutes = require('./src/routes/contenedorRoutes');
const alertaRoutes = require('./src/routes/alertaRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const lecturaRoutes = require('./src/routes/lecturaRoutes');
const streamRoutes = require('./src/routes/streamRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Detrás de un proxy (Render, Railway, Nginx...) define TRUST_PROXY=1 para que el límite de solicitudes use la IP real.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number.isNaN(Number(process.env.TRUST_PROXY)) ? process.env.TRUST_PROXY : Number(process.env.TRUST_PROXY));
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rutas de la API
app.use('/api/contenedores', contenedorRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/lecturas', lecturaRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/reportes', reporteRoutes);

// Panel web de sensores (mismo servidor: http://localhost:5000/panel)
app.get('/panel', (req, res) => res.sendFile(path.join(__dirname, 'public', 'panel.html')));

// Parámetros que el panel necesita para interpretar los datos
app.get('/api/config', (req, res) => {
  res.json({ umbral_alerta: config.umbralAlerta, sin_reporte_horas: config.sinReporteHoras });
});

// Ruta Raíz
app.get('/', (req, res) => {
  res.json({
    proyecto: 'EcoSmart API Backend',
    estado: 'En ejecución',
    puerto: PORT
  });
});

// Errores no controlados (JSON inválido, fallas internas)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'json_invalido' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'cuerpo_demasiado_grande' });
  console.error(err);
  res.status(500).json({ error: 'error_interno' });
});

// Iniciar Servidor (solo si se ejecuta directamente; los tests importan `app` sin abrir el puerto)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(` Servidor Backend ejecutándose en el puerto ${PORT}`);
  });
}


module.exports = app;
