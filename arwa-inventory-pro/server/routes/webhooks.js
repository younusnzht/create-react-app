// webhooks.js — receives order webhooks from Deliverect, Otter, DoorDash, Uber Eats
const express = require('express');
const router  = express.Router();
const { normalizeDeliverect, normalizeOtter, normalizeDoorDash, normalizeUberEats } = require('../utils/normalize');
const { verifyDeliverect, verifyOtter, verifyDoorDash, verifyUberEats } = require('../utils/verify');
const { broadcast } = require('../utils/broadcast');

// Shared order store (in-memory; replace with DB in production)
const orderStore = require('../store');

function handleWebhook(req, res, verifyFn, normalizeFn, platformName) {
  const rawBody = req.rawBody;

  // 1. Verify signature
  if (!verifyFn(rawBody, req)) {
    console.warn(`[${platformName}] Webhook signature invalid`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Parse + normalize
  let order;
  try {
    order = normalizeFn(req.body);
  } catch (err) {
    console.error(`[${platformName}] Normalize error:`, err.message);
    return res.status(400).json({ error: 'Malformed payload' });
  }

  // 3. Store + broadcast
  orderStore.add(order);
  broadcast('new_order', order);
  console.log(`[${platformName}] New order ${order.id} from ${order.platform} — ${order.customer} — $${order.total}`);

  // 4. Acknowledge (each platform expects 200 within ~5s)
  res.status(200).json({ received: true, orderId: order.id });
}

// ── Deliverect (covers UE + DD + Skip via aggregation) ─────────────────────
router.post('/deliverect', (req, res) => {
  handleWebhook(req, res, verifyDeliverect, normalizeDeliverect, 'Deliverect');
});

// ── Otter (alternative aggregator) ────────────────────────────────────────
router.post('/otter', (req, res) => {
  handleWebhook(req, res, verifyOtter, normalizeOtter, 'Otter');
});

// ── DoorDash direct ────────────────────────────────────────────────────────
router.post('/doordash', (req, res) => {
  handleWebhook(req, res, verifyDoorDash, normalizeDoorDash, 'DoorDash');
});

// ── Uber Eats direct ───────────────────────────────────────────────────────
router.post('/ubereats', (req, res) => {
  handleWebhook(req, res, verifyUberEats, normalizeUberEats, 'Uber Eats');
});

module.exports = router;
