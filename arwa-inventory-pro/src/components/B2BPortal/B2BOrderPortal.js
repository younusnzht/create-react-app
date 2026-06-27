import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Search, Upload, Scan, CheckCircle, Package, Trash2, Plus, Minus, X, Camera, Loader } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { submitB2BOrder } from '../../services/firestoreService';

const getCurrencySymbol = (code) => {
  const s = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥', INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼' };
  return s[code] || (code + ' ');
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const barcodeCol = headers.findIndex(h => ['barcode', 'sku', 'code', 'id', 'product_code', 'item_code'].some(k => h.includes(k)));
  const qtyCol = headers.findIndex(h => ['qty', 'quantity', 'amount', 'units'].some(k => h.includes(k)));
  const noteCol = headers.findIndex(h => ['note', 'notes', 'comment', 'remarks'].some(k => h.includes(k)));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return {
      lookup: barcodeCol >= 0 ? cols[barcodeCol] : cols[0],
      qty: Math.max(1, parseInt(qtyCol >= 0 ? cols[qtyCol] : cols[1]) || 1),
      note: noteCol >= 0 ? (cols[noteCol] || '') : '',
    };
  }).filter(r => r.lookup);
}

function matchProduct(lookup, products) {
  if (!lookup) return null;
  const q = lookup.toLowerCase().trim();
  return products.find(p =>
    (p.barcode && p.barcode.toLowerCase() === q) ||
    (p.sku && p.sku.toLowerCase() === q) ||
    p.name.toLowerCase() === q ||
    String(p.id) === q
  ) || null;
}

export default function B2BOrderPortal() {
  const { products, currency, clientConfigs, subscription } = useApp();
  const sym = getCurrencySymbol(currency);

  // Identify which client this portal belongs to (via ?store= param)
  const storeCode = new URLSearchParams(window.location.search).get('store') || '';
  const clientConfig = clientConfigs?.find(c => c.accessCode === storeCode || String(c.id) === storeCode);
  const portalSettings = clientConfig?.b2bPortal || subscription?.b2bPortal || {};
  const portalName = portalSettings.portalName || clientConfig?.clientName || 'Wholesale Order Portal';
  const showPrices = portalSettings.showPrices !== false;
  const minOrder = parseFloat(portalSettings.minOrderValue) || 0;
  const clientCode = clientConfig?.accessCode || clientConfig?.id || storeCode || 'default';

  const [mode, setMode] = useState('browse'); // browse | csv | scanner
  const [cart, setCart] = useState([]); // [{product, qty, note}]
  const [search, setSearch] = useState('');
  const [step, setStep] = useState('order'); // order | checkout | submitted
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', notes: '', expectedDate: '' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // CSV state
  const [csvRows, setCsvRows] = useState([]); // [{lookup, qty, note, product, matched}]
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef(null);

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanResults, setScanResults] = useState([]); // [{product, qty}]
  const [scanError, setScanError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const scanTimerRef = useRef(null);

  const cartTotal = cart.reduce((s, i) => s + i.product.salePrice * i.qty, 0);
  const cartQty = cart.reduce((s, i) => s + i.qty, 0);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1, note = '') => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, qty, note }];
    });
  }, []);

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  };

  // ── Browse mode ──────────────────────────────────────────────────────────
  const filtered = products.filter(p => p.status === 'active' && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())));

  // ── CSV mode ─────────────────────────────────────────────────────────────
  const handleCSVFile = (file) => {
    if (!file) return;
    setCsvError('');
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = parseCSV(e.target.result);
        if (rows.length === 0) { setCsvError('No valid rows found. Check your CSV format.'); return; }
        const matched = rows.map(r => ({ ...r, product: matchProduct(r.lookup, products) }));
        setCsvRows(matched);
      } catch { setCsvError('Failed to parse CSV file. Please check the format.'); }
    };
    reader.readAsText(file);
  };

  const importCSVToCart = () => {
    csvRows.filter(r => r.product).forEach(r => addToCart(r.product, r.qty, r.note));
    setCsvRows([]);
    setMode('browse');
  };

  // ── Scanner mode ─────────────────────────────────────────────────────────
  const handleScanSubmit = (code) => {
    const lookup = (code || scanInput).trim();
    if (!lookup) return;
    const product = matchProduct(lookup, products);
    setScanInput('');
    if (!product) { setScanError(`No product found for: ${lookup}`); return; }
    setScanError('');
    setScanResults(prev => {
      const ex = prev.find(r => r.product.id === product.id);
      if (ex) return prev.map(r => r.product.id === product.id ? { ...r, qty: r.qty + 1 } : r);
      return [...prev, { product, qty: 1 }];
    });
  };

  // Camera barcode scanning using BarcodeDetector API
  const startCamera = async () => {
    if (!window.BarcodeDetector) { setScanError('Camera scanning not supported in this browser. Use Chrome/Edge or type the barcode manually.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true);
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'upc_a', 'upc_e', 'code_39'] });
      const scan = async () => {
        if (!videoRef.current || !cameraActive) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0) {
            handleScanSubmit(results[0].rawValue);
          }
        } catch {}
        scanTimerRef.current = setTimeout(scan, 500);
      };
      scan();
    } catch { setScanError('Could not access camera. Please allow camera permission.'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addScanResultsToCart = () => {
    scanResults.forEach(r => addToCart(r.product, r.qty));
    setScanResults([]);
    setMode('browse');
  };

  // ── Checkout ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (minOrder > 0 && cartTotal < minOrder) { setSubmitError(`Minimum order value is ${sym}${minOrder.toFixed(2)}`); return; }
    setSubmitting(true);
    setSubmitError('');
    const ref = `B2B-${Date.now().toString(36).toUpperCase()}`;
    const order = {
      ...form,
      orderRef: ref,
      items: cart.map(i => ({ id: i.product.id, name: i.product.name, sku: i.product.sku, barcode: i.product.barcode, qty: i.qty, unitPrice: i.product.salePrice, lineTotal: i.product.salePrice * i.qty, note: i.note })),
      subtotal: cartTotal,
      currency,
      storeCode,
      clientCode,
    };
    try {
      await submitB2BOrder(clientCode, order);
      setOrderRef(ref);
      setStep('submitted');
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submitted screen ─────────────────────────────────────────────────────
  if (step === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={40} color="#10B981" />
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Order Submitted!</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
            Your order has been received by <strong style={{ color: '#fff' }}>{portalName}</strong>.<br />
            Reference: <strong style={{ color: '#818CF8' }}>{orderRef}</strong><br />
            You will be contacted at <strong style={{ color: '#fff' }}>{form.email}</strong> to confirm.
          </p>
          <button onClick={() => { setStep('order'); setCart([]); setForm({ companyName: '', contactName: '', email: '', phone: '', address: '', notes: '', expectedDate: '' }); }}
            style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  // ── Checkout screen ───────────────────────────────────────────────────────
  if (step === 'checkout') {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>
          <button onClick={() => setStep('order')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to order
          </button>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Complete Your Order</h2>

          {/* Order summary */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Order Summary</div>
            {cart.map(item => (
              <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.product.name} × {item.qty}</span>
                {showPrices && <span style={{ color: '#818CF8', fontWeight: 600 }}>{sym}{(item.product.salePrice * item.qty).toFixed(2)}</span>}
              </div>
            ))}
            {showPrices && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 15, fontWeight: 700 }}>
                <span>Total</span><span style={{ color: '#10B981' }}>{sym}{cartTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Company Name *</label>
                <input required value={form.companyName} onChange={e => setF('companyName', e.target.value)} placeholder="Your company name"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Contact Name *</label>
                <input required value={form.contactName} onChange={e => setF('contactName', e.target.value)} placeholder="Your full name"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Email Address *</label>
                <input required type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="orders@company.com"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Phone Number</label>
                <input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+1-416-555-0100"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Delivery Address</label>
              <input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="123 Main St, Toronto, ON"
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Expected Delivery Date</label>
                <input type="date" value={form.expectedDate} onChange={e => setF('expectedDate', e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Order Notes</label>
                <input value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Special instructions..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            {minOrder > 0 && cartTotal < minOrder && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#F87171' }}>
                ⚠️ Minimum order value is {sym}{minOrder.toFixed(2)}. Current total: {sym}{cartTotal.toFixed(2)}.
              </div>
            )}
            {submitError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#F87171' }}>
                {submitError}
              </div>
            )}

            <button type="submit" disabled={submitting || (minOrder > 0 && cartTotal < minOrder)} style={{
              padding: '14px', borderRadius: 10, border: 'none',
              background: submitting ? 'rgba(79,70,229,0.4)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : 'Submit Order'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main order screen ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)', zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{portalName}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Wholesale Order Portal · Powered by Arwa 1.0</div>
        </div>
        {cart.length > 0 && (
          <button onClick={() => setStep('checkout')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', border: 'none', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <ShoppingCart size={15} />
            Checkout ({cartQty} items{showPrices ? ` · ${sym}${cartTotal.toFixed(2)}` : ''})
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { id: 'browse', label: 'Browse Catalogue', icon: Search },
            { id: 'csv', label: 'Upload CSV', icon: Upload },
            { id: 'scanner', label: 'Barcode Scanner', icon: Scan },
          ].map(m => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                background: mode === m.id ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${mode === m.id ? 'rgba(79,70,229,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: mode === m.id ? '#818CF8' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <Icon size={15} /> {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: cart.length > 0 ? '1fr 340px' : '1fr', gap: 20 }}>
          {/* Left: intake area */}
          <div>
            {/* ── Browse mode ── */}
            {mode === 'browse' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
                  <Search size={15} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or SKU..."
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {filtered.map(product => {
                    const inCart = cart.find(i => i.product.id === product.id);
                    return (
                      <div key={product.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, transition: 'border-color 0.15s', borderColor: inCart ? 'rgba(79,70,229,0.4)' : undefined }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{product.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: product.sku ? 4 : 8 }}>{product.category}</div>
                        {product.sku && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>SKU: {product.sku}</div>}
                        {showPrices && <div style={{ fontSize: 14, fontWeight: 800, color: '#818CF8', marginBottom: 12 }}>{sym}{product.salePrice?.toFixed(2)}</div>}
                        {inCart ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => updateQty(product.id, inCart.qty - 1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{inCart.qty}</span>
                            <button onClick={() => updateQty(product.id, inCart.qty + 1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', color: '#818CF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                            <button onClick={() => removeFromCart(product.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 4 }}><X size={12} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(product)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(79,70,229,0.35)', background: 'rgba(79,70,229,0.1)', color: '#818CF8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            + Add to Order
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
                      <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                      <p>No products found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CSV mode ── */}
            {mode === 'csv' && (
              <div>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', marginBottom: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  <strong style={{ color: '#818CF8' }}>CSV Format:</strong> The file should have columns for <strong>barcode</strong> or <strong>sku</strong> (or <strong>code</strong>), and <strong>quantity</strong> (or <strong>qty</strong>). Optional: <strong>notes</strong> column.<br />
                  Example: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>barcode,quantity,notes</code>
                </div>

                {csvRows.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleCSVFile(e.dataTransfer.files[0]); }}
                    style={{ border: '2px dashed rgba(79,70,229,0.4)', borderRadius: 16, padding: '56px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.7)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'}
                  >
                    <Upload size={40} style={{ color: 'rgba(79,70,229,0.6)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Drag & drop your CSV file</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>or click to browse</p>
                    <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={e => handleCSVFile(e.target.files[0])} />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{csvRows.filter(r => r.product).length} matched</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 12 }}>{csvRows.filter(r => !r.product).length} not found</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setCsvRows([])} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Clear</button>
                        <button onClick={importCSVToCart} disabled={!csvRows.some(r => r.product)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: csvRows.some(r => r.product) ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: csvRows.some(r => r.product) ? 'pointer' : 'not-allowed' }}>
                          Import {csvRows.filter(r => r.product).length} items to cart
                        </button>
                      </div>
                    </div>
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Barcode / SKU</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left' }}>Product</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                        </tr></thead>
                        <tbody>
                          {csvRows.map((row, i) => (
                            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                              <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 12 }}>{row.lookup}</td>
                              <td style={{ padding: '10px 14px', color: row.product ? '#fff' : 'rgba(239,68,68,0.7)' }}>{row.product ? row.product.name : '— not found —'}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', color: '#818CF8', fontWeight: 700 }}>{row.qty}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {row.product
                                  ? <span style={{ padding: '2px 10px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>✓ Matched</span>
                                  : <span style={{ padding: '2px 10px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', color: '#F87171', fontSize: 11, fontWeight: 700 }}>✗ Not found</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {csvError && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#F87171' }}>{csvError}</div>}
              </div>
            )}

            {/* ── Scanner mode ── */}
            {mode === 'scanner' && (
              <div>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', marginBottom: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  Works with <strong style={{ color: '#818CF8' }}>USB barcode scanners</strong> (they type the code + Enter automatically) or type the barcode/SKU manually. You can also use your phone camera.
                </div>

                {/* Camera */}
                <div style={{ marginBottom: 20 }}>
                  {cameraActive ? (
                    <div>
                      <video ref={videoRef} style={{ width: '100%', maxWidth: 480, borderRadius: 12, border: '2px solid rgba(79,70,229,0.4)', display: 'block', marginBottom: 10 }} />
                      <button onClick={stopCamera} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#F87171', fontSize: 13, cursor: 'pointer' }}>
                        Stop Camera
                      </button>
                    </div>
                  ) : (
                    <button onClick={startCamera} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(79,70,229,0.35)', background: 'rgba(79,70,229,0.1)', color: '#818CF8', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
                      <Camera size={15} /> Scan with Camera
                    </button>
                  )}
                </div>

                {/* Manual barcode input */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <input
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleScanSubmit(); } }}
                    placeholder="Scan barcode or type SKU + Enter"
                    autoFocus
                    style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
                  />
                  <button onClick={() => handleScanSubmit()} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add</button>
                </div>
                {scanError && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#F87171' }}>{scanError}</div>}

                {scanResults.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#818CF8' }}>{scanResults.reduce((s, r) => s + r.qty, 0)} items scanned</span>
                      <button onClick={addScanResultsToCart} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Add all to cart →
                      </button>
                    </div>
                    {scanResults.map(r => (
                      <div key={r.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.product.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>SKU: {r.product.sku || '—'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setScanResults(prev => prev.map(x => x.product.id === r.product.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                            style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: 'none', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{r.qty}</span>
                          <button onClick={() => setScanResults(prev => prev.map(x => x.product.id === r.product.id ? { ...x, qty: x.qty + 1 } : x))}
                            style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(79,70,229,0.15)', border: 'none', color: '#818CF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                          <button onClick={() => setScanResults(prev => prev.filter(x => x.product.id !== r.product.id))}
                            style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Cart sidebar */}
          {cart.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, height: 'fit-content', position: 'sticky', top: 80 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={15} style={{ color: '#818CF8' }} /> Your Order ({cartQty} items)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 360, overflowY: 'auto' }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                      {showPrices && <div style={{ fontSize: 11, color: '#818CF8' }}>{sym}{(item.product.salePrice * item.qty).toFixed(2)}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.product.id, item.qty - 1)} style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(239,68,68,0.15)', border: 'none', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={10} /></button>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(79,70,229,0.15)', border: 'none', color: '#818CF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {showPrices && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                    <span>Total</span><span style={{ color: '#10B981' }}>{sym}{cartTotal.toFixed(2)}</span>
                  </div>
                  {minOrder > 0 && cartTotal < minOrder && <div style={{ fontSize: 11, color: '#F87171', marginTop: 6 }}>Min order: {sym}{minOrder.toFixed(2)}</div>}
                </div>
              )}
              <button onClick={() => setStep('checkout')} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Proceed to Checkout →
              </button>
              <button onClick={() => setCart([])} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
                Clear cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
