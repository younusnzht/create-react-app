// verify.js — HMAC webhook signature verification
const crypto = require('crypto');

function verifyHmac(payload, signature, secret, algorithm = 'sha256', prefix = 'sha256=') {
  if (!secret) return true; // skip verification if no secret configured (dev mode)
  const computed = prefix + crypto.createHmac(algorithm, secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

function verifyDeliverect(rawBody, req) {
  const sig = req.headers['x-deliverect-signature'] || '';
  return verifyHmac(rawBody, sig, process.env.DELIVERECT_SECRET);
}

function verifyOtter(rawBody, req) {
  const sig = req.headers['x-otter-signature'] || '';
  return verifyHmac(rawBody, sig, process.env.OTTER_SECRET);
}

function verifyDoorDash(rawBody, req) {
  const sig = req.headers['x-doordash-signature'] || '';
  return verifyHmac(rawBody, sig, process.env.DOORDASH_SECRET);
}

function verifyUberEats(rawBody, req) {
  const sig = req.headers['x-uber-signature'] || '';
  return verifyHmac(rawBody, sig, process.env.UBEREATS_SECRET);
}

module.exports = { verifyDeliverect, verifyOtter, verifyDoorDash, verifyUberEats };
