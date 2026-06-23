// ESC/POS thermal printer service
// Supports: Web Serial API (USB/serial printers), Web Bluetooth API, browser print fallback

// ── ESC/POS Commands ────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;
const INIT             = [ESC, 0x40];           // Initialize printer
const ALIGN_LEFT       = [ESC, 0x61, 0x00];
const ALIGN_CENTER     = [ESC, 0x61, 0x01];
const ALIGN_RIGHT      = [ESC, 0x61, 0x02]; // eslint-disable-line no-unused-vars
const BOLD_ON          = [ESC, 0x45, 0x01];
const BOLD_OFF         = [ESC, 0x45, 0x00];
const DOUBLE_HEIGHT_ON = [ESC, 0x21, 0x10];
const DOUBLE_HEIGHT_OFF= [ESC, 0x21, 0x00];
const CUT_PAPER        = [GS,  0x56, 0x41, 0x00]; // Full cut
const LINE_FEED        = [0x0a];

let serialPort = null;
let serialWriter = null;

// ── Paper width config ──────────────────────────────────────────────────────
export const PAPER_WIDTHS = { '58mm': 32, '80mm': 48 };

// eslint-disable-next-line no-unused-vars
function pad(str, len, char = ' ') {
  return String(str).padEnd(len, char).slice(0, len);
}
// eslint-disable-next-line no-unused-vars
function padLeft(str, len, char = ' ') {
  return String(str).padStart(len, char).slice(-len);
}
// eslint-disable-next-line no-unused-vars
function center(str, width) {
  const s = String(str);
  const spaces = Math.max(0, Math.floor((width - s.length) / 2));
  return ' '.repeat(spaces) + s;
}
function twoCol(left, right, width) {
  const l = String(left);
  const r = String(right);
  const gap = Math.max(1, width - l.length - r.length);
  return l + ' '.repeat(gap) + r;
}
function divider(width, char = '-') {
  return char.repeat(width);
}

// ── Build ESC/POS byte array from receipt data ───────────────────────────────
export function buildReceiptBytes(receiptData, config = {}) {
  const width = PAPER_WIDTHS[config.paperWidth || '80mm'] || 48;
  const {
    businessName = 'Arwa Enterprises',
    businessAddress = '',
    gstNumber = '',
    receiptId = '',
    date = new Date().toLocaleString(),
    items = [],
    subtotal = 0,
    taxAmt = 0,
    discount = 0,
    total = 0,
    payments = [],
    cashGiven = 0,
    change = 0,
    loyaltyEarned = 0,
    loyaltyRedeemed = 0,
    sym = '$',
  } = receiptData;

  const bytes = [];
  const enc = new TextEncoder();

  const push = (data) => {
    if (Array.isArray(data)) bytes.push(...data);
    else if (typeof data === 'string') bytes.push(...enc.encode(data));
  };

  push(INIT);
  push(ALIGN_CENTER);
  push(BOLD_ON); push(DOUBLE_HEIGHT_ON);
  push(businessName.slice(0, width) + '\n');
  push(DOUBLE_HEIGHT_OFF); push(BOLD_OFF);
  if (businessAddress) push(businessAddress.slice(0, width) + '\n');
  if (gstNumber) push(`GST#: ${gstNumber}\n`);
  push(divider(width) + '\n');
  push(ALIGN_LEFT);
  push(`Date:    ${date}\n`);
  push(`Receipt: ${receiptId}\n`);
  push(divider(width) + '\n');

  // Items
  items.forEach(item => {
    const name = String(item.name || '').slice(0, width - 10);
    const price = `${sym}${((item.salePrice || item.price || 0) * (item.qty || 1)).toFixed(2)}`;
    push(twoCol(`${item.qty}x ${name}`, price, width) + '\n');
  });

  push(divider(width) + '\n');
  push(twoCol('Subtotal', `${sym}${subtotal.toFixed(2)}`, width) + '\n');
  if (discount > 0) push(twoCol('Discount', `-${sym}${discount.toFixed(2)}`, width) + '\n');
  push(twoCol('Tax (GST/HST)', `${sym}${taxAmt.toFixed(2)}`, width) + '\n');
  push(BOLD_ON);
  push(twoCol('TOTAL', `${sym}${total.toFixed(2)}`, width) + '\n');
  push(BOLD_OFF);
  push(divider(width) + '\n');

  // Payment lines
  if (payments && payments.length > 0) {
    payments.forEach(p => {
      push(twoCol(String(p.method || 'Payment').toUpperCase(), `${sym}${parseFloat(p.amount || 0).toFixed(2)}`, width) + '\n');
    });
  } else if (cashGiven > 0) {
    push(twoCol('CASH', `${sym}${cashGiven.toFixed(2)}`, width) + '\n');
    push(twoCol('CHANGE', `${sym}${change.toFixed(2)}`, width) + '\n');
  }

  if (loyaltyRedeemed > 0) push(twoCol('Loyalty Redeemed', `-${sym}${(loyaltyRedeemed/100).toFixed(2)}`, width) + '\n');
  if (loyaltyEarned > 0)   push(`Loyalty Earned: +${loyaltyEarned} pts\n`);

  push(divider(width) + '\n');
  push(ALIGN_CENTER);
  push('Thank you for shopping with us!\n');
  push('Powered by Arwa 1.0\n');
  push(LINE_FEED); push(LINE_FEED); push(LINE_FEED);
  push(CUT_PAPER);

  return new Uint8Array(bytes);
}

// ── Web Serial API ───────────────────────────────────────────────────────────
export async function connectSerialPrinter() {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported. Use Chrome or Edge browser.');
  }
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    serialWriter = serialPort.writable.getWriter();
    return true;
  } catch (e) {
    throw new Error('Could not connect to printer: ' + e.message);
  }
}

export async function disconnectSerialPrinter() {
  try {
    if (serialWriter) { serialWriter.releaseLock(); serialWriter = null; }
    if (serialPort)   { await serialPort.close(); serialPort = null; }
  } catch (e) {}
}

export function isSerialConnected() {
  return serialPort !== null && serialWriter !== null;
}

export async function printViaSerial(receiptData, config) {
  if (!isSerialConnected()) throw new Error('Printer not connected. Go to Settings → Hardware to connect.');
  const bytes = buildReceiptBytes(receiptData, config);
  await serialWriter.write(bytes);
}

// ── Browser print fallback (thermal-optimised HTML) ──────────────────────────
export function printViaBrowser(receiptData, config = {}) {
  const width = config.paperWidth === '58mm' ? '58mm' : '80mm';
  const sym = receiptData.sym || '$';
  const items = receiptData.items || [];
  const payments = receiptData.payments || [];

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: ${width}; margin: 0 auto; padding: 4px; color: #000; background: #fff; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; font-weight: bold; }
  .row { display: flex; justify-content: space-between; margin: 1px 0; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .divider-solid { border-top: 1px solid #000; margin: 4px 0; }
  @media print {
    @page { size: ${width} auto; margin: 0; }
    body { width: 100%; }
  }
</style>
</head><body>
<div class="center big">${receiptData.businessName || 'Arwa Enterprises'}</div>
${receiptData.businessAddress ? `<div class="center">${receiptData.businessAddress}</div>` : ''}
${receiptData.gstNumber ? `<div class="center">GST#: ${receiptData.gstNumber}</div>` : ''}
<div class="divider-solid"></div>
<div>Date: ${receiptData.date || new Date().toLocaleString()}</div>
<div>Receipt: ${receiptData.receiptId || receiptData.id || ''}</div>
<div class="divider"></div>
${items.map(i => `<div class="row"><span>${i.qty}× ${i.name}</span><span>${sym}${((i.salePrice||i.price||0)*(i.qty||1)).toFixed(2)}</span></div>`).join('')}
<div class="divider"></div>
<div class="row"><span>Subtotal</span><span>${sym}${(receiptData.subtotal||0).toFixed(2)}</span></div>
${receiptData.discount > 0 ? `<div class="row"><span>Discount</span><span>-${sym}${(receiptData.discount||0).toFixed(2)}</span></div>` : ''}
<div class="row"><span>Tax (GST/HST)</span><span>${sym}${(receiptData.taxAmt||0).toFixed(2)}</span></div>
<div class="divider-solid"></div>
<div class="row bold big"><span>TOTAL</span><span>${sym}${(receiptData.total||0).toFixed(2)}</span></div>
<div class="divider"></div>
${payments.length > 0
  ? payments.map(p => `<div class="row"><span>${String(p.method||'').toUpperCase()}</span><span>${sym}${parseFloat(p.amount||0).toFixed(2)}</span></div>`).join('')
  : receiptData.cashGiven > 0
    ? `<div class="row"><span>CASH</span><span>${sym}${(receiptData.cashGiven||0).toFixed(2)}</span></div><div class="row"><span>CHANGE</span><span>${sym}${(receiptData.change||0).toFixed(2)}</span></div>`
    : ''
}
${receiptData.loyaltyRedeemed > 0 ? `<div class="row"><span>Loyalty Redeemed</span><span>-${sym}${(receiptData.loyaltyRedeemed/100).toFixed(2)}</span></div>` : ''}
${receiptData.loyaltyEarned > 0 ? `<div>Loyalty Earned: +${receiptData.loyaltyEarned} pts</div>` : ''}
<div class="divider"></div>
<div class="center">Thank you for your business!</div>
<div class="center">Powered by Arwa 1.0</div>
<br><br>
</body></html>`;

  const w = window.open('', '_blank', `width=400,height=600`);
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  }
}

// ── Unified print function ────────────────────────────────────────────────────
export async function printReceipt(receiptData, config = {}) {
  if (isSerialConnected()) {
    try {
      await printViaSerial(receiptData, config);
      return { method: 'serial' };
    } catch (e) {
      console.warn('Serial print failed, falling back to browser print:', e);
    }
  }
  printViaBrowser(receiptData, config);
  return { method: 'browser' };
}
