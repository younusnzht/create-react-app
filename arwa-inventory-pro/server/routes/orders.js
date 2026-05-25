// orders.js — REST API for order management
const express   = require('express');
const router    = express.Router();
const orderStore = require('../store');
const { broadcast } = require('../utils/broadcast');
const { generateDemoOrder } = require('../utils/normalize');

const STATUS_FLOW = ['new', 'confirmed', 'preparing', 'ready', 'pickup', 'delivered'];

// GET /api/orders — list all orders (optionally filter by platform/status)
router.get('/', (req, res) => {
  let orders = orderStore.getAll();
  if (req.query.platform && req.query.platform !== 'all') {
    orders = orders.filter(o => o.platform === req.query.platform);
  }
  if (req.query.status) {
    orders = orders.filter(o => o.status === req.query.status);
  }
  res.json({ orders, total: orders.length });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = orderStore.getById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// PATCH /api/orders/:id/status — advance or set order status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  if (!STATUS_FLOW.includes(status) && status !== 'cancelled') {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const order = orderStore.updateStatus(req.params.id, status);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  broadcast('order_updated', order);
  console.log(`[Orders] ${order.id} → ${status}`);
  res.json(order);
});

// POST /api/orders/demo — inject a simulated order (for testing without a real aggregator)
router.post('/demo', (req, res) => {
  const order = generateDemoOrder();
  orderStore.add(order);
  broadcast('new_order', order);
  console.log(`[Demo] Injected order ${order.id} — ${order.platform} — ${order.customer}`);
  res.status(201).json(order);
});

// DELETE /api/orders/:id — remove order
router.delete('/:id', (req, res) => {
  const removed = orderStore.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Order not found' });
  broadcast('order_deleted', { id: req.params.id });
  res.json({ deleted: true });
});

module.exports = router;
