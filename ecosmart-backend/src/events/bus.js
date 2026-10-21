const { EventEmitter } = require('node:events');

// Bus interno: el servicio de lecturas publica, el stream SSE (/api/stream) reenvía al panel.
// Si algún día hay varias instancias del servidor, reemplazar por Postgres LISTEN/NOTIFY o Redis.
const bus = new EventEmitter();
bus.setMaxListeners(200);

module.exports = bus;
