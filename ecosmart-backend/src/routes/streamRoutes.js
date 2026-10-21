const express = require('express');
const bus = require('../events/bus');

const router = express.Router();

// Actualización automática del panel: Server-Sent Events.
// Cada lectura confirmada llega como `event: lectura` con { contenedor, alerta_creada, alerta_resuelta }.
// Cada reporte ciudadano nuevo o revisado llega como `event: reporte` con el reporte completo.
router.get('/', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');

  const onLectura = (data) => res.write(`event: lectura\ndata: ${JSON.stringify(data)}\n\n`);
  const onReporte = (data) => res.write(`event: reporte\ndata: ${JSON.stringify(data)}\n\n`);
  bus.on('lectura', onLectura);
  bus.on('reporte', onReporte);
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(ping);
    bus.off('lectura', onLectura);
    bus.off('reporte', onReporte);
  });
});

module.exports = router;
