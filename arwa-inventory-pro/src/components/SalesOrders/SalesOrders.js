import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search, X, Truck, Clock, ChevronDown, Eye, Trash2,
  ClipboardList, DollarSign, Upload, Camera, Package, CheckCircle,
  Link2, ScanLine, FileText, Zap, AlertCircle,
  Printer, ArrowRight,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

function getCurrencySymbol(code) {
  const map = { CAD: 'CA$', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', INR: '₹', AED: 'AED ' };
  return map[code] || code + ' ';
}

const STATUS_CFG = {
  new:        { label: 'New',        color: '#4F46E5', bg: 'rgba(79,70,229,0.12)'  },
  processing: { label: 'Processing', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  picking:    { label: 'Picking',    color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  dispatched: { label: 'Dispatched', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)'  },
  delivered:  { label: 'Delivered',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  invoiced:   { label: 'Invoiced',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
};

const STATUS_FLOW = ['new', 'processing', 'picking', 'dispatched', 'delivered', 'invoiced'];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.new;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {cfg.label}
    </span>
  );
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsvForOrder(text, products) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], unmatched: [] };
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const barcodeIdx = headers.findIndex(h => ['barcode','sku','code','id','upc','ean','item'].some(k => h.includes(k)));
  const qtyIdx     = headers.findIndex(h => ['qty','quantity','amount','units','count','ordered'].some(k => h.includes(k)));
  const priceIdx   = headers.findIndex(h => ['price','unit_price','unitprice','cost'].some(k => h.includes(k)));
  if (barcodeIdx === -1) return { rows: [], unmatched: ['No barcode/SKU column found in CSV header'] };
  const rows = [], unmatched = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const code  = cols[barcodeIdx] || '';
    const qty   = Math.max(1, parseInt(qtyIdx !== -1 ? cols[qtyIdx] : 1) || 1);
    const price = priceIdx !== -1 ? parseFloat(cols[priceIdx]) || null : null;
    if (!code) continue;
    const product = products.find(p =>
      (p.barcode && p.barcode === code) ||
      (p.sku && p.sku.toLowerCase() === code.toLowerCase()) ||
      p.name.toLowerCase() === code.toLowerCase() ||
      String(p.id) === code
    );
    if (product) {
      rows.push({ product, qty, unitPrice: price ?? product.salePrice });
    } else {
      unmatched.push(code);
    }
  }
  return { rows, unmatched };
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderModal({ order, onClose, onUpdateStatus, currency }) {
  const sym = getCurrencySymbol(currency);
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  const printOrder = () => {
    const w = window.open('', '_blank');
    const items = (order.items || []).map(i =>
      `<tr><td>${i.productName}</td><td>${i.sku||'—'}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right">${sym}${(i.unitPrice||0).toFixed(2)}</td><td style="text-align:right">${sym}${((i.qty||0)*(i.unitPrice||0)).toFixed(2)}</td></tr>`
    ).join('');
    w.document.write(`<html><head><title>${order.id}</title><style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5;font-weight:700}.total{font-size:16px;font-weight:800}</style></head><body>
      <h2>${order.id}</h2>
      <p><strong>Customer:</strong> ${order.customer} &nbsp; <strong>Status:</strong> ${STATUS_CFG[order.status]?.label||order.status}</p>
      ${order.reference ? `<p><strong>Customer PO:</strong> ${order.reference}</p>` : ''}
      <p><strong>Date:</strong> ${new Date(order.dateReceived).toLocaleDateString('en-CA')}${order.dateRequired ? ` &nbsp; <strong>Required By:</strong> ${new Date(order.dateRequired).toLocaleDateString('en-CA')}` : ''}</p>
      <table><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>${items}</tbody></table>
      <p class="total" style="text-align:right;margin-top:16px">Total: ${sym}${(order.total||0).toFixed(2)}</p>
      ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 800, maxHeight: '92vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{order.id}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {order.customer} · Received {new Date(order.dateReceived).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {order.reference && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Customer PO: <strong style={{ color: 'var(--text-primary)' }}>{order.reference}</strong>
              </p>
            )}
            {order.companyName && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Company: <strong style={{ color: 'var(--text-primary)' }}>{order.companyName}</strong>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={order.status} />
            <button className="icon-btn" title="Print order" onClick={printOrder}><Printer size={16} /></button>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Status pipeline */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 6, overflow: 'hidden' }}>
          {STATUS_FLOW.map((s, i) => {
            const idx = STATUS_FLOW.indexOf(order.status);
            const done   = i < idx;
            const active = i === idx;
            const cfg    = STATUS_CFG[s];
            return (
              <div key={s} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', position: 'relative' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: active ? cfg.color : done ? '#10B981' : 'var(--text-muted)',
                  background: active ? cfg.bg : done ? 'rgba(16,185,129,0.08)' : 'transparent',
                  borderRadius: 6, padding: '4px 2px',
                }}>
                  {done ? '✓ ' : ''}{STATUS_CFG[s].label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Items */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {['Product', 'SKU', 'Qty', 'Unit Price', 'Line Total'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700,
                    textAlign: ['Product','SKU'].includes(h) ? 'left' : 'right',
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{item.productName || item.name}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{(item.qty||0).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>{sym}{(item.unitPrice||0).toFixed(2)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)' }}>
                    {sym}{((item.qty||0)*(item.unitPrice||0)).toLocaleString('en-CA',{minimumFractionDigits:2})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 280, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span><span>{sym}{(order.subtotal||0).toLocaleString('en-CA',{minimumFractionDigits:2})}</span>
            </div>
            {(order.tax||0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-secondary)' }}>
                <span>Tax</span><span>{sym}{(order.tax||0).toLocaleString('en-CA',{minimumFractionDigits:2})}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 800, fontSize: 16, borderTop: '2px solid var(--border)', marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-light)' }}>{sym}{(order.total||0).toLocaleString('en-CA',{minimumFractionDigits:2})}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Notes:</strong> {order.notes}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {nextStatus && !['invoiced','cancelled'].includes(order.status) && (
            <button
              className="btn btn-primary"
              onClick={() => { onUpdateStatus(order.id, nextStatus); onClose(); }}
              style={{ background: STATUS_CFG[nextStatus]?.color }}
            >
              Advance to {STATUS_CFG[nextStatus]?.label} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Receive Order Modal — 4 intake modes ──────────────────────────────────────
const INTAKE_MODES = [
  { id: 'scan',   label: 'Scan',         icon: ScanLine,    desc: 'USB or camera barcode scanner' },
  { id: 'csv',    label: 'CSV Upload',   icon: Upload,      desc: 'Upload order spreadsheet' },
  { id: 'lookup', label: 'Order Lookup', icon: Search,      desc: 'Find by Order ID or PO number' },
  { id: 'manual', label: 'Manual Entry', icon: FileText,    desc: 'Type products manually' },
];

function ReceiveOrderModal({ onClose, onSave, customers, products, currency, salesOrders }) {
  const sym = getCurrencySymbol(currency || 'CAD');
  const [mode, setMode]               = useState('scan');
  const [step, setStep]               = useState('intake'); // 'intake' | 'review'

  // Order metadata
  const [customerId, setCustomerId]   = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustDrop, setShowCustDrop]     = useState(false);
  const [reference, setReference]     = useState('');
  const [dateRequired, setDateRequired] = useState('');
  const [notes, setNotes]             = useState('');
  const [companyName, setCompanyName] = useState('');

  // Cart (shared across all modes)
  const [items, setItems]             = useState([]);

  // ── Scan mode ──────────────────────────────────────────────────────────────
  const [scanInput, setScanInput]     = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef    = useRef(null);
  const detectorRef = useRef(null);
  const frameRef    = useRef(null);
  const scanInputRef = useRef(null);

  // ── CSV mode ───────────────────────────────────────────────────────────────
  const [csvDrag, setCsvDrag]         = useState(false);
  const [csvRows, setCsvRows]         = useState([]);
  const [csvUnmatched, setCsvUnmatched] = useState([]);
  const fileRef = useRef(null);

  // ── Lookup mode ────────────────────────────────────────────────────────────
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // ── Manual mode ────────────────────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [showProdDrop, setShowProdDrop]   = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCustomer = customers.find(c => String(c.id) === String(customerId));
  const filteredCusts    = useMemo(() =>
    customers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase())).slice(0, 8),
    [customers, customerSearch]);
  const filteredProds    = useMemo(() =>
    products.filter(p =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku||'').toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode||'').includes(productSearch)
    ).slice(0, 10), [products, productSearch]);

  const subtotal = items.reduce((s, i) => s + (i.unitPrice||0) * (i.qty||0), 0);
  const tax      = subtotal * 0.13;
  const total    = subtotal + tax;

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToItems = useCallback((product, qty = 1, unitPrice = null) => {
    setItems(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, {
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        unitPrice: unitPrice ?? product.salePrice ?? 0,
        qty,
      }];
    });
  }, []);

  const updateItem = (productId, field, val) =>
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, [field]: parseFloat(val) || 0 } : i));

  const removeItem = (productId) =>
    setItems(prev => prev.filter(i => i.productId !== productId));

  // ── Scan: USB/keyboard handler ────────────────────────────────────────────
  const handleScanKey = (e) => {
    if (e.key !== 'Enter') return;
    const code = scanInput.trim();
    setScanInput('');
    if (!code) return;
    const product = products.find(p =>
      (p.barcode && p.barcode === code) ||
      (p.sku && p.sku.toLowerCase() === code.toLowerCase())
    );
    if (product) {
      addToItems(product, 1);
      setScanFeedback({ ok: true, msg: `✓ Added: ${product.name} (${product.sku})` });
    } else {
      setScanFeedback({ ok: false, msg: `✗ No match for: "${code}"` });
    }
    setTimeout(() => setScanFeedback(null), 2500);
  };

  // ── Scan: camera ─────────────────────────────────────────────────────────
  const startCamera = async () => {
    if (!('BarcodeDetector' in window)) {
      setScanFeedback({ ok: false, msg: 'Camera scanning requires Chrome/Edge. Use a USB scanner instead.' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      detectorRef.current = new window.BarcodeDetector({ formats: ['ean_13','ean_8','code_128','qr_code','upc_a','upc_e'] });
      setCameraActive(true);
    } catch {
      setScanFeedback({ ok: false, msg: 'Camera permission denied or unavailable.' });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setCameraActive(false);
  };

  useEffect(() => {
    if (!cameraActive || !detectorRef.current || !videoRef.current) return;
    let lastCode = '';
    const detect = async () => {
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          if (code !== lastCode) {
            lastCode = code;
            const product = products.find(p =>
              (p.barcode && p.barcode === code) ||
              (p.sku && p.sku.toLowerCase() === code.toLowerCase())
            );
            if (product) {
              addToItems(product, 1);
              setScanFeedback({ ok: true, msg: `✓ Added: ${product.name}` });
            } else {
              setScanFeedback({ ok: false, msg: `✗ No match for: "${code}"` });
            }
            setTimeout(() => { setScanFeedback(null); lastCode = ''; }, 2000);
          }
        }
      } catch {}
      frameRef.current = requestAnimationFrame(detect);
    };
    frameRef.current = requestAnimationFrame(detect);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [cameraActive, products, addToItems]);

  useEffect(() => () => stopCamera(), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'scan') setTimeout(() => scanInputRef.current?.focus(), 100);
  }, [mode]);

  // ── CSV ───────────────────────────────────────────────────────────────────
  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const { rows, unmatched } = parseCsvForOrder(e.target.result, products);
      setCsvRows(rows);
      setCsvUnmatched(unmatched);
    };
    reader.readAsText(file);
  };

  const importCsvToCart = () => {
    csvRows.forEach(r => addToItems(r.product, r.qty, r.unitPrice));
    setCsvRows([]);
    setCsvUnmatched([]);
    setStep('review');
  };

  // ── Lookup ────────────────────────────────────────────────────────────────
  const handleLookup = () => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return;
    setLookupError('');
    setLookupResult(null);

    // Search existing sales orders by ID or reference
    const found = salesOrders.find(o =>
      o.id?.toLowerCase() === q ||
      o.reference?.toLowerCase() === q ||
      o.id?.toLowerCase().includes(q) ||
      o.reference?.toLowerCase().includes(q)
    );

    if (found) {
      setLookupResult(found);
      setLookupError('');
    } else {
      setLookupError(`No order found for "${lookupQuery}". Check the Order ID or Customer PO number.`);
    }
  };

  const importFromLookup = (order) => {
    const orderItems = (order.items || []).map(i => ({
      productId: i.productId || i.id || Date.now(),
      productName: i.productName || i.name || 'Unknown',
      sku: i.sku || '',
      unitPrice: i.unitPrice || i.unitprice || 0,
      qty: i.qty || 1,
    }));
    setItems(orderItems);
    setReference(order.reference || order.id);
    if (order.companyName) setCompanyName(order.companyName);
    // Try to match customer
    if (order.customerId) setCustomerId(String(order.customerId));
    setLookupResult(null);
    setStep('review');
  };

  // ── Review step ───────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!customerId && !companyName) {
      alert('Please select or enter a customer / company name');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one product');
      return;
    }
    onSave({
      customer: selectedCustomer?.name || companyName || 'Unknown Customer',
      customerId: customerId || null,
      companyName: companyName || selectedCustomer?.name || '',
      reference,
      dateRequired: dateRequired || null,
      notes,
      items,
      subtotal,
      tax,
      total,
      status: 'new',
      source: mode,
    });
    onClose();
  };

  const modeColors = { scan: '#4F46E5', csv: '#10B981', lookup: '#F59E0B', manual: '#06B6D4' };
  const mc = modeColors[mode];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 18, width: '100%', maxWidth: 920, maxHeight: '94vh', overflow: 'auto', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>Receive Customer Order</h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Choose how you want to bring the order in</p>
            </div>
            <button className="icon-btn" onClick={() => { stopCamera(); onClose(); }}><X size={18} /></button>
          </div>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {INTAKE_MODES.map(m => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); stopCamera(); if (step !== 'intake') setStep('intake'); }}
                  style={{
                    flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
                    background: active ? `${modeColors[m.id]}18` : 'transparent',
                    borderBottom: active ? `3px solid ${modeColors[m.id]}` : '3px solid transparent',
                    color: active ? modeColors[m.id] : 'var(--text-muted)',
                    fontWeight: active ? 800 : 500,
                    fontSize: 13, transition: 'all 0.15s',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <Icon size={16} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '24px 28px', flex: 1, overflow: 'auto' }}>

          {/* ───────── INTAKE STEP ───────── */}
          {step === 'intake' && (
            <div>
              {/* ── Scan mode ── */}
              {mode === 'scan' && (
                <div>
                  <div style={{ background: `${mc}08`, border: `1px solid ${mc}25`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${mc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScanLine size={18} style={{ color: mc }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>USB / Handheld Barcode Scanner</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Connect your scanner and scan items — or type a barcode/SKU and press Enter</div>
                      </div>
                    </div>
                    <input
                      ref={scanInputRef}
                      autoFocus
                      placeholder="Scan barcode or type SKU / product code…"
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      onKeyDown={handleScanKey}
                      style={{
                        width: '100%', padding: '13px 16px',
                        background: 'var(--bg-primary)', border: `2px solid ${mc}`,
                        borderRadius: 10, color: 'var(--text-primary)',
                        fontSize: 15, outline: 'none', fontFamily: 'monospace',
                        letterSpacing: '0.06em', boxSizing: 'border-box',
                      }}
                    />
                    {scanFeedback && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: scanFeedback.ok ? '#10B981' : '#EF4444' }}>
                        {scanFeedback.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                        {scanFeedback.msg}
                      </div>
                    )}
                  </div>

                  {/* Camera section */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cameraActive ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Camera size={15} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Camera Scanner</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(Chrome/Edge on Android)</span>
                      </div>
                      {!cameraActive ? (
                        <button onClick={startCamera} className="btn btn-secondary btn-sm">
                          <Camera size={13} /> Start Camera
                        </button>
                      ) : (
                        <button onClick={stopCamera} className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none' }}>
                          Stop
                        </button>
                      )}
                    </div>
                    {cameraActive && (
                      <video ref={videoRef} muted playsInline
                        style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 280, objectFit: 'cover' }} />
                    )}
                  </div>

                  {/* Scanned items live list */}
                  {items.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Scanned Items ({items.length} SKUs · {items.reduce((s,i)=>s+i.qty,0)} units)</span>
                        <span style={{ color: mc }}>{sym}{subtotal.toFixed(2)}</span>
                      </div>
                      {items.map(item => (
                        <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.productName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sku} · {sym}{item.unitPrice.toFixed(2)}/unit</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => updateItem(item.productId, 'qty', item.qty - 1 || 1)}
                              style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>−</button>
                            <input type="number" min="1" value={item.qty}
                              onChange={e => updateItem(item.productId, 'qty', e.target.value)}
                              style={{ width: 52, padding: '3px 6px', textAlign: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }} />
                            <button onClick={() => updateItem(item.productId, 'qty', item.qty + 1)}
                              style={{ width: 26, height: 26, borderRadius: 6, background: mc, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>+</button>
                          </div>
                          <div style={{ minWidth: 72, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>
                            {sym}{(item.qty * item.unitPrice).toFixed(2)}
                          </div>
                          <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── CSV mode ── */}
              {mode === 'csv' && (
                <div>
                  <div
                    onDragOver={e => { e.preventDefault(); setCsvDrag(true); }}
                    onDragLeave={() => setCsvDrag(false)}
                    onDrop={e => { e.preventDefault(); setCsvDrag(false); handleCsvFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${csvDrag ? mc : 'var(--border)'}`,
                      borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                      background: csvDrag ? `${mc}08` : 'var(--bg-tertiary)',
                      marginBottom: 20, transition: 'all 0.2s',
                    }}
                  >
                    <Upload size={38} style={{ color: mc, marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Drop your order CSV here, or click to browse</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                      Auto-detects columns — just needs <code style={{ color: mc, background: `${mc}12`, padding: '1px 6px', borderRadius: 4 }}>barcode</code> or <code style={{ color: mc, background: `${mc}12`, padding: '1px 6px', borderRadius: 4 }}>sku</code> plus <code style={{ color: mc, background: `${mc}12`, padding: '1px 6px', borderRadius: 4 }}>qty</code>
                    </div>
                    <div style={{ display: 'inline-flex', gap: 8, fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 16px', fontFamily: 'monospace' }}>
                      barcode, qty &nbsp;|&nbsp; sku, quantity &nbsp;|&nbsp; code, amount, price
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.txt,.xls,.xlsx" style={{ display: 'none' }} onChange={e => handleCsvFile(e.target.files[0])} />
                  </div>

                  {csvRows.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          <span style={{ color: '#10B981' }}>✓ {csvRows.length} product{csvRows.length!==1?'s':''} matched</span>
                          {csvUnmatched.length > 0 && <span style={{ color: '#F59E0B', marginLeft: 16 }}>⚠ {csvUnmatched.length} not found</span>}
                        </div>
                        <button onClick={importCsvToCart} className="btn btn-primary btn-sm" style={{ background: mc }}>
                          <Package size={13} /> Import {csvRows.length} items
                        </button>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderTop: '1px solid var(--border)' }}>
                            {['Product','SKU','Qty','Unit Price','Line Total'].map(h => (
                              <th key={h} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, textAlign: h==='Product'||h==='SKU'?'left':'right', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.map((r, i) => (
                            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                              <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600 }}>{r.product.name}</td>
                              <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.product.sku}</td>
                              <td style={{ padding: '9px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{r.qty}</td>
                              <td style={{ padding: '9px 14px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>{sym}{r.unitPrice.toFixed(2)}</td>
                              <td style={{ padding: '9px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)' }}>{sym}{(r.qty*r.unitPrice).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvUnmatched.length > 0 && (
                        <div style={{ padding: '10px 16px', background: 'rgba(245,158,11,0.06)', borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: 4 }}>Unrecognised codes (skipped):</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{csvUnmatched.join(' · ')}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Lookup mode ── */}
              {mode === 'lookup' && (
                <div>
                  <div style={{ background: `${mc}08`, border: `1px solid ${mc}25`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Search size={16} style={{ color: mc }} /> Find Existing Order
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                      Enter a Sales Order ID (e.g. <code>SO-1234567890</code>) or Customer PO number to load the order and re-process it
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        autoFocus
                        placeholder="Enter Order ID or Customer PO number…"
                        value={lookupQuery}
                        onChange={e => setLookupQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                        style={{ flex: 1, padding: '11px 14px', background: 'var(--bg-primary)', border: `2px solid ${mc}`, borderRadius: 9, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                      <button onClick={handleLookup} className="btn btn-primary" style={{ background: mc, minWidth: 100 }}>
                        <Search size={14} /> Look Up
                      </button>
                    </div>
                    {lookupError && (
                      <div style={{ marginTop: 10, fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={14} /> {lookupError}
                      </div>
                    )}
                  </div>

                  {/* Recent portal orders (from B2B portal, status new) */}
                  {(() => {
                    const portalOrders = salesOrders.filter(o => o.source === 'b2b_portal' || o.firestoreId).slice(0, 5);
                    if (portalOrders.length === 0) return null;
                    return (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                          🔗 Recent B2B Portal Orders
                        </div>
                        {portalOrders.map(o => (
                          <div key={o.id} onClick={() => importFromLookup(o)}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Link2 size={16} style={{ color: mc, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{o.id}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {o.companyName || o.customer} · {(o.items||[]).length} item(s) · {sym}{(o.total||0).toFixed(2)}
                              </div>
                            </div>
                            <StatusBadge status={o.status} />
                            <span style={{ fontSize: 12, color: mc, fontWeight: 700 }}>Load →</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {lookupResult && (
                    <div style={{ border: `2px solid ${mc}`, borderRadius: 12, padding: 20, background: `${mc}06` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{lookupResult.id}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                            {lookupResult.customer} · {(lookupResult.items||[]).length} items · {sym}{(lookupResult.total||0).toFixed(2)}
                          </div>
                        </div>
                        <button onClick={() => importFromLookup(lookupResult)} className="btn btn-primary btn-sm" style={{ background: mc }}>
                          <Package size={13} /> Import this Order
                        </button>
                      </div>
                      {(lookupResult.items||[]).slice(0,4).map((i,idx) => (
                        <div key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0' }}>
                          • {i.productName||i.name} × {i.qty}
                        </div>
                      ))}
                      {(lookupResult.items||[]).length > 4 && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>…and {(lookupResult.items||[]).length - 4} more items</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Manual mode ── */}
              {mode === 'manual' && (
                <div>
                  <div style={{ marginBottom: 18, position: 'relative' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Products *</label>
                    <input
                      autoFocus
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setShowProdDrop(true); }}
                      onFocus={() => setShowProdDrop(true)}
                      placeholder="Search by product name, SKU, or barcode…"
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: `2px solid ${mc}`, borderRadius: 9, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                    />
                    {showProdDrop && productSearch && filteredProds.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, zIndex: 20, maxHeight: 260, overflowY: 'auto', boxShadow: 'var(--shadow-lg)', marginTop: 4 }}>
                        {filteredProds.map(p => (
                          <div key={p.id} onClick={() => { addToItems(p); setProductSearch(''); setShowProdDrop(false); }}
                            style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sku} · Barcode: {p.barcode || '—'}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{sym}{p.salePrice}</div>
                              <div style={{ fontSize: 11, color: p.stock < (p.minStock||0) ? '#EF4444' : '#10B981' }}>{p.stock} in stock</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-tertiary)' }}>
                            {['Product','Qty',`Price (${sym})`,'Total',''].map(h => (
                              <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textAlign: h==='Product'?'left':'right', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.productId} style={{ borderTop: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{item.productName}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.productId,'qty',e.target.value)}
                                  style={{ width: 68, padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.productId,'unitPrice',e.target.value)}
                                  style={{ width: 88, padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)', fontSize: 13 }}>
                                {sym}{((item.qty||0)*(item.unitPrice||0)).toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Proceed button (scan + manual modes) */}
              {['scan','manual'].includes(mode) && items.length > 0 && (
                <button onClick={() => setStep('review')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: mc }}>
                  Review Order ({items.length} items · {sym}{subtotal.toFixed(2)}) <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}

          {/* ───────── REVIEW STEP ───────── */}
          {step === 'review' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setStep('intake')} className="btn btn-secondary btn-sm">← Back</button>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Review & Confirm Order</h3>
              </div>

              {/* Customer details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                {/* Customer search */}
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</label>
                  <input
                    value={customerSearch || selectedCustomer?.name || ''}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustDrop(true); setCustomerId(''); }}
                    onFocus={() => setShowCustDrop(true)}
                    placeholder="Search customers…"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                  />
                  {showCustDrop && customerSearch && filteredCusts.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 20, maxHeight: 200, overflowY: 'auto', boxShadow: 'var(--shadow-lg)', marginTop: 4 }}>
                      {filteredCusts.map(c => (
                        <div key={c.id} onClick={() => { setCustomerId(String(c.id)); setCustomerSearch(c.name); setShowCustDrop(false); }}
                          style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {c.name} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Name (if no account)</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Metro Wholesale Ltd"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer PO / Reference</label>
                  <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. PO-M-2026-441"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required By Date</label>
                  <input type="date" value={dateRequired} onChange={e => setDateRequired(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes / Special Instructions</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, lot requirements, temperature…"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>

              {/* Items review */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: '9px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order Items ({items.length} SKUs)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderTop: '1px solid var(--border)' }}>
                      {['Product','SKU','Qty',`Unit Price (${sym})`,'Total',''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textAlign: h==='Product'||h==='SKU'?'left':'right', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.productId} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku||'—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.productId,'qty',e.target.value)}
                            style={{ width: 68, padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.productId,'unitPrice',e.target.value)}
                            style={{ width: 88, padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }} />
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)', fontSize: 13 }}>
                          {sym}{((item.qty||0)*(item.unitPrice||0)).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{ width: 260, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span><span>{sym}{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-secondary)' }}>
                    <span>HST (13%)</span><span>{sym}{tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontWeight: 800, fontSize: 16, borderTop: '2px solid var(--border)', marginTop: 4 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary-light)' }}>{sym}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setStep('intake')}>← Edit Items</button>
                <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: 160, justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                  <CheckCircle size={15} /> Receive Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Sales Orders page ────────────────────────────────────────────────────
export default function SalesOrders() {
  const { salesOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder, customers, products, currency, showToast } = useApp();
  const sym = getCurrencySymbol(currency || 'CAD');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewOrder, setViewOrder]     = useState(null);
  const [showNew, setShowNew]         = useState(false);

  const stats = useMemo(() => {
    const orders = salesOrders || [];
    const pending    = orders.filter(o => ['new','processing','picking'].includes(o.status)).length;
    const dispatched = orders.filter(o => o.status === 'dispatched').length;
    const revenue    = orders.filter(o => !['cancelled'].includes(o.status)).reduce((s, o) => s + (o.total||0), 0);
    return [
      { label: 'Total Orders', value: orders.length, icon: ClipboardList, color: '#4F46E5' },
      { label: 'Pending',      value: pending,        icon: Clock,         color: '#F59E0B' },
      { label: 'Dispatched',   value: dispatched,     icon: Truck,         color: '#06B6D4' },
      { label: 'Revenue',      value: `${sym}${revenue.toLocaleString('en-CA',{minimumFractionDigits:0})}`, icon: DollarSign, color: '#10B981' },
    ];
  }, [salesOrders, sym]);

  const filtered = useMemo(() => {
    let list = salesOrders || [];
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        o.companyName?.toLowerCase().includes(q) ||
        o.reference?.toLowerCase().includes(q) ||
        (o.items||[]).some(i => (i.productName||i.name)?.toLowerCase().includes(q) || (i.sku||'').toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
  }, [salesOrders, filterStatus, search]);

  const handleSave = (data) => {
    addSalesOrder({ ...data, id: `SO-${Date.now()}`, dateReceived: new Date().toISOString() });
    showToast('Sales order received and logged', 'success');
  };

  const handleUpdateStatus = (id, status) => {
    updateSalesOrder(id, { status });
    showToast(`Order advanced to ${STATUS_CFG[status]?.label}`, 'success');
    if (viewOrder?.id === id) setViewOrder(prev => ({ ...prev, status }));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this sales order?')) return;
    deleteSalesOrder(id);
    showToast('Order removed', 'info');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Sales Orders</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Inbound customer orders — scan, upload, or look up · pick, pack, dispatch, invoice</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Zap size={15} /> Receive Order
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders, customers, SKUs, PO numbers…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...Object.keys(STATUS_CFG)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filterStatus === s ? 'var(--primary)' : 'var(--bg-secondary)',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)', transition: 'all 0.15s' }}>
              {s === 'all' ? 'All Orders' : STATUS_CFG[s].label}
              {s !== 'all' && (
                <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                  {(salesOrders||[]).filter(o => o.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <ClipboardList size={44} style={{ marginBottom: 14, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>No sales orders found</p>
            <p style={{ fontSize: 13, margin: '0 0 20px' }}>
              {filterStatus !== 'all'
                ? `No ${STATUS_CFG[filterStatus]?.label} orders.`
                : 'Click "Receive Order" to log an inbound order via scan, CSV, or lookup.'}
            </p>
            {filterStatus === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                <Zap size={14} /> Receive First Order
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {['Order #', 'Customer / Company', 'PO Reference', 'Items', `Total (${sym})`, 'Required By', 'Source', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}
                    style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setViewOrder(order)}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', whiteSpace: 'nowrap' }}>{order.id}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                      {order.customer || order.companyName}
                      {order.companyName && order.customer && order.companyName !== order.customer && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.companyName}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.reference || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center' }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{(order.items||[]).length} SKUs</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>{sym}{(order.total||0).toLocaleString('en-CA',{minimumFractionDigits:2})}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {order.dateRequired ? new Date(order.dateRequired).toLocaleDateString('en-CA') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {order.source === 'b2b_portal' || order.firestoreId ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(79,70,229,0.12)', color: 'var(--primary-light)' }}>🔗 Portal</span>
                      ) : order.source === 'csv' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>📄 CSV</span>
                      ) : order.source === 'scan' ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>📷 Scan</span>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Manual</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}><StatusBadge status={order.status} /></td>
                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-btn" title="View order" onClick={() => setViewOrder(order)}><Eye size={15} /></button>
                        {!['invoiced','cancelled'].includes(order.status) && (
                          <button className="icon-btn" title="Advance status"
                            style={{ color: STATUS_CFG[STATUS_FLOW[STATUS_FLOW.indexOf(order.status)+1]]?.color }}
                            onClick={() => {
                              const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.status)+1];
                              if (next) handleUpdateStatus(order.id, next);
                            }}><ChevronDown size={15} /></button>
                        )}
                        <button className="icon-btn" title="Delete" style={{ color: '#EF4444' }} onClick={() => handleDelete(order.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNew && (
        <ReceiveOrderModal
          onClose={() => setShowNew(false)}
          onSave={handleSave}
          customers={customers}
          products={products}
          currency={currency}
          salesOrders={salesOrders || []}
        />
      )}
      {viewOrder && (
        <OrderModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          currency={currency}
        />
      )}
    </div>
  );
}
