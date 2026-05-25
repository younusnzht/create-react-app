// broadcast.js — sends a JSON message to all connected WebSocket clients
const WebSocket = require('ws');

let wss = null;

function setWss(instance) {
  wss = instance;
}

function broadcast(event, data) {
  if (!wss) return;
  const msg = JSON.stringify({ event, data, ts: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastToClient(ws, event, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data, ts: new Date().toISOString() }));
  }
}

module.exports = { setWss, broadcast, broadcastToClient };
