// server.js — Arwa Inventory Pro backend
// Express REST API + WebSocket server for real-time order sync
require('dotenv').config();

const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');
const cors      = require('cors');

const { setWss, broadcast, broadcastToClient } = require('./utils/broadcast');
const webhookRoutes = require('./routes/webhooks');
const orderRoutes   = require('./routes/orders');
const orderStore    = require('./store');

const PORT    = process.env.PORT || 4000;
const WS_KEY  = process.env.WS_API_KEY || '';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing — preserve raw body for HMAC verification ────────────────
app.use((req, res, next) => {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    req.rawBody = raw;
    try { req.body = JSON.parse(raw); } catch { req.body = {}; }
    next();
  });
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    uptime:    process.uptime(),
    orders:    orderStore.count(),
    clients:   wss ? wss.clients.size : 0,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/webhooks', webhookRoutes);
app.use('/api/orders', orderRoutes);

// ── HTTP server ────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── WebSocket server ───────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });
setWss(wss);

wss.on('connection', (ws, req) => {
  // Optional API key check via query param: ws://server/ws?key=arwa_dev_key
  if (WS_KEY) {
    const url    = new URL(req.url, `http://${req.headers.host}`);
    const key    = url.searchParams.get('key');
    if (key !== WS_KEY) {
      ws.close(4001, 'Unauthorized');
      return;
    }
  }

  const ip = req.socket.remoteAddress;
  console.log(`[WS] Client connected from ${ip} | total: ${wss.clients.size}`);

  // Send current order snapshot immediately on connect
  broadcastToClient(ws, 'snapshot', {
    orders:  orderStore.getAll(),
    serverTime: new Date().toISOString(),
  });

  // Keepalive ping every 30s
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }, 30_000);

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Client can request a fresh snapshot
      if (msg.event === 'get_snapshot') {
        broadcastToClient(ws, 'snapshot', { orders: orderStore.getAll(), serverTime: new Date().toISOString() });
      }

      // Client status update (e.g. cashier advances order from their app)
      if (msg.event === 'update_status' && msg.orderId && msg.status) {
        const order = orderStore.updateStatus(msg.orderId, msg.status);
        if (order) {
          broadcast('order_updated', order);
          console.log(`[WS] Client updated order ${msg.orderId} → ${msg.status}`);
        }
      }
    } catch { /* ignore bad messages */ }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log(`[WS] Client disconnected | remaining: ${wss.clients.size}`);
  });

  ws.on('error', (err) => console.error('[WS] Client error:', err.message));
});

// ── Demo order simulator (when DEMO_MODE=true) ─────────────────────────────
// Injects a new fake order every 45–90 seconds so you can see live updates
// without a real aggregator. Set DEMO_MODE=true in .env to enable.
if (process.env.DEMO_MODE === 'true') {
  const { generateDemoOrder } = require('./utils/normalize');
  const schedule = () => {
    const delay = Math.floor(Math.random() * 45_000) + 45_000; // 45–90s
    setTimeout(() => {
      const order = generateDemoOrder();
      orderStore.add(order);
      broadcast('new_order', order);
      console.log(`[Demo] Auto-injected: ${order.id} (${order.platform}) — ${order.customer} — $${order.total}`);
      schedule();
    }, delay);
  };
  schedule();
  console.log('[Demo] Auto-order simulator active (45–90s intervals)');
}

// ── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Arwa Order Sync Server running on port ${PORT}`);
  console.log(`   REST API:  http://localhost:${PORT}/api/orders`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF (set DEMO_MODE=true to enable)'}\n`);
});

module.exports = { app, server, wss };
