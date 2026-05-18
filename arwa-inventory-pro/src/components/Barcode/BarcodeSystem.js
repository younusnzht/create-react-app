import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Zap, Printer, CheckCircle, AlertTriangle, RefreshCw, Package, Plus, Minus, Layers, Hash, ArrowRight, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const BARCODE_HISTORY = [
  { id: 1, barcode: '8901234567890', product: 'Paracetamol 500mg', action: 'inventory_check', time: '10:32:14', result: 'success', qty: 450 },
  { id: 2, barcode: '8902345678901', product: 'iPhone 15 Pro', action: 'pos_checkout', time: '10:28:05', result: 'success', qty: 23 },
  { id: 3, barcode: '9999999999999', product: null, action: 'inventory_check', time: '10:21:33', result: 'not_found', qty: null },
  { id: 4, barcode: '8903456789012', product: 'Organic Whole Milk 1L', action: 'stock_receive', time: '09:55:10', result: 'success', qty: 12 },
  { id: 5, barcode: '8905678901234', product: 'Samsung 65" QLED TV', action: 'pos_checkout', time: '09:40:22', result: 'success', qty: 8 },
];

const TABS = [
  { id: 'scanner', label: 'Live Scanner', icon: Zap },
  { id: 'individual', label: 'Receive Items', icon: Package },
  { id: 'carton', label: 'Carton / Bulk', icon: Layers },
  { id: 'print', label: 'Print Labels', icon: Printer },
];

export default function BarcodeSystem() {
  const { products, updateProduct, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('scanner');

  // Live scanner state
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState(BARCODE_HISTORY);
  const inputRef = useRef(null);

  // Individual receive state
  const [receiveInput, setReceiveInput] = useState('');
  const [receiveList, setReceiveList] = useState([]);
  const [receivingNote, setReceivingNote] = useState('');
  const receiveRef = useRef(null);

  // Carton receive state
  const [cartonInput, setCartonInput] = useState('');
  const [cartonResult, setCartonResult] = useState(null);
  const [cartonQty, setCartonQty] = useState(1);
  const [unitsPerCarton, setUnitsPerCarton] = useState(12);
  const [cartonList, setCartonList] = useState([]);
  const cartonRef = useRef(null);

  // Print queue state
  const [printQueue, setPrintQueue] = useState([]);

  // Tab focus management
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'scanner' && inputRef.current) inputRef.current.focus();
      if (activeTab === 'individual' && receiveRef.current) receiveRef.current.focus();
      if (activeTab === 'carton' && cartonRef.current) cartonRef.current.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const addToHistory = (barcode, product, action, qty) => {
    setHistory(prev => [{
      id: Date.now(), barcode,
      product: product ? product.name : null,
      action, time: new Date().toLocaleTimeString(),
      result: product ? 'success' : 'not_found', qty
    }, ...prev.slice(0, 19)]);
  };

  // ── Live Scanner ──────────────────────────────────────────
  const simulateScan = (barcode) => {
    if (!barcode) return;
    setScanning(true);
    setTimeout(() => {
      const found = products.find(p => p.barcode === barcode || p.sku === barcode);
      if (found) {
        setScanResult({ success: true, product: found });
        addToHistory(barcode, found, 'inventory_check', found.stock);
        showToast(`Found: ${found.name}`, 'success');
      } else {
        setScanResult({ success: false, barcode });
        addToHistory(barcode, null, 'inventory_check', null);
        showToast(`Barcode not found: ${barcode}`, 'warning');
      }
      setScanning(false);
      setScanInput('');
    }, 400);
  };

  // ── Individual Receive ────────────────────────────────────
  const scanForReceive = (barcode) => {
    if (!barcode) return;
    const found = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (found) {
      const existing = receiveList.find(r => r.product.id === found.id);
      if (existing) {
        setReceiveList(prev => prev.map(r => r.product.id === found.id ? { ...r, qty: r.qty + 1 } : r));
        showToast(`+1 ${found.name} (${existing.qty + 1} total)`, 'info');
      } else {
        setReceiveList(prev => [...prev, { product: found, qty: 1, expiry: found.expiry || '' }]);
        showToast(`Added: ${found.name}`, 'success');
      }
      addToHistory(barcode, found, 'stock_receive', found.stock);
    } else {
      showToast(`Barcode not found: ${barcode}`, 'warning');
      addToHistory(barcode, null, 'stock_receive', null);
    }
    setReceiveInput('');
  };

  const updateReceiveQty = (id, delta) => {
    setReceiveList(prev => prev.map(r => r.product.id === id
      ? { ...r, qty: Math.max(1, r.qty + delta) } : r));
  };

  const commitIndividualReceive = () => {
    if (!receiveList.length) return;
    receiveList.forEach(r => {
      const current = products.find(p => p.id === r.product.id);
      if (current) updateProduct(r.product.id, { stock: current.stock + r.qty });
    });
    showToast(`Stock updated — ${receiveList.length} product(s) received`, 'success');
    setReceiveList([]);
    setReceivingNote('');
  };

  // ── Carton / Bulk Receive ────────────────────────────────
  const scanCarton = (barcode) => {
    if (!barcode) return;
    const found = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (found) {
      setCartonResult({ product: found });
      showToast(`Carton product: ${found.name}`, 'success');
    } else {
      setCartonResult(null);
      showToast(`Barcode not found: ${barcode}`, 'warning');
    }
    setCartonInput('');
  };

  const addCartonToList = () => {
    if (!cartonResult) return;
    const totalUnits = cartonQty * unitsPerCarton;
    const existing = cartonList.find(c => c.product.id === cartonResult.product.id);
    if (existing) {
      setCartonList(prev => prev.map(c => c.product.id === cartonResult.product.id
        ? { ...c, cartons: c.cartons + cartonQty, totalUnits: c.totalUnits + totalUnits } : c));
    } else {
      setCartonList(prev => [...prev, {
        product: cartonResult.product,
        cartons: cartonQty,
        unitsPerCarton,
        totalUnits,
      }]);
    }
    showToast(`${cartonQty} carton(s) × ${unitsPerCarton} units = ${totalUnits} units added`, 'success');
    setCartonResult(null);
    setCartonQty(1);
    setUnitsPerCarton(12);
  };

  const commitCartonReceive = () => {
    if (!cartonList.length) return;
    cartonList.forEach(c => {
      const current = products.find(p => p.id === c.product.id);
      if (current) updateProduct(c.product.id, { stock: current.stock + c.totalUnits });
    });
    showToast(`Carton receive complete — ${cartonList.reduce((s, c) => s + c.totalUnits, 0)} units added to stock`, 'success');
    setCartonList([]);
  };

  // ── Print Queue ──────────────────────────────────────────
  const addToPrintQueue = (product) => {
    if (!printQueue.find(p => p.id === product.id)) {
      setPrintQueue(prev => [...prev, { ...product, labelQty: 1 }]);
      showToast(`${product.name} added to print queue`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Barcode & QR System</h1>
          <p>Scan, receive, bulk carton intake and label printing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(16,185,129,0.12)', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Scanner Ready</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            <t.icon size={13} style={{ display: 'inline', marginRight: 5 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Live Scanner ── */}
      {activeTab === 'scanner' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Zap size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-light)' }} />Live Scanner</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>USB / Wireless / Manual</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="search-bar" style={{ width: '100%', border: '2px solid var(--primary)' }}>
                <QrCode size={18} style={{ color: 'var(--primary-light)' }} />
                <input
                  ref={inputRef}
                  placeholder="Scan barcode or type manually..."
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && scanInput && simulateScan(scanInput)}
                  style={{ fontSize: 15, fontFamily: 'monospace' }}
                />
                {scanning && <RefreshCw size={14} className="spin" style={{ color: 'var(--primary-light)' }} />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Press Enter to scan — or plug in USB barcode scanner</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['8901234567890', '8902345678901', '8904567890123'].map(b => (
                <button key={b} className="btn btn-secondary btn-sm" style={{ fontFamily: 'monospace', fontSize: 11 }}
                  onClick={() => { setScanInput(b); setTimeout(() => simulateScan(b), 100); }}>
                  {b.slice(0, 8)}...
                </button>
              ))}
            </div>
            {scanResult && (
              <div style={{ padding: 16, borderRadius: 10,
                background: scanResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${scanResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                {scanResult.success ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <CheckCircle size={18} style={{ color: '#10B981' }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#10B981' }}>Product Found!</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Product', value: scanResult.product.name },
                        { label: 'SKU', value: scanResult.product.sku },
                        { label: 'Barcode', value: scanResult.product.barcode },
                        { label: 'Price', value: `$${scanResult.product.salePrice}` },
                        { label: 'Stock', value: scanResult.product.stock },
                        { label: 'Category', value: scanResult.product.category },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => addToPrintQueue(scanResult.product)}>
                        <Printer size={12} /> Print Label
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                    <div>
                      <p style={{ fontWeight: 700, color: '#EF4444' }}>Product Not Found</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Barcode: {scanResult.barcode}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scan History */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Scan Activity Log</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 24 hrs</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 380 }}>
              <table>
                <thead>
                  <tr><th>Time</th><th>Barcode</th><th>Product</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{h.time}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{h.barcode.slice(0, 10)}...</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{h.product || '—'}</td>
                      <td><span className={`badge ${h.result === 'success' ? 'badge-success' : 'badge-danger'}`}>{h.result === 'success' ? 'Found' : 'Not Found'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Individual Receive ── */}
      {activeTab === 'individual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Package size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-light)' }} />Scan Items Individually</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Scan each product one by one. Each scan adds 1 unit. Scan the same item multiple times to increase quantity.
            </p>
            <div className="search-bar" style={{ width: '100%', border: '2px solid var(--primary)', marginBottom: 12 }}>
              <QrCode size={18} style={{ color: 'var(--primary-light)' }} />
              <input
                ref={receiveRef}
                placeholder="Scan item barcode..."
                value={receiveInput}
                onChange={e => setReceiveInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && receiveInput && scanForReceive(receiveInput)}
                style={{ fontSize: 15, fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['8901234567890', '8903456789012', '8907890123456'].map(b => (
                <button key={b} className="btn btn-secondary btn-sm" style={{ fontFamily: 'monospace', fontSize: 11 }}
                  onClick={() => scanForReceive(b)}>
                  {b.slice(0, 8)}...
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Receiving Note (optional)</label>
              <input className="form-control" placeholder="e.g. PO-1234 from supplier..." value={receivingNote} onChange={e => setReceivingNote(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 8 }}
              onClick={commitIndividualReceive} disabled={!receiveList.length}>
              <CheckCircle size={14} /> Confirm Receive ({receiveList.reduce((s, r) => s + r.qty, 0)} units)
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Scanned Items</span>
              {receiveList.length > 0 && (
                <button className="btn btn-danger btn-sm" onClick={() => setReceiveList([])}>Clear All</button>
              )}
            </div>
            {receiveList.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <QrCode size={32} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>No items scanned yet</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan products to add them here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {receiveList.map(r => (
                  <div key={r.product.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{r.product.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.product.barcode}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current stock: {r.product.stock}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button className="icon-btn" style={{ width: 26, height: 26, borderRadius: 6 }} onClick={() => updateReceiveQty(r.product.id, -1)}><Minus size={12} /></button>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-light)', minWidth: 28, textAlign: 'center' }}>{r.qty}</span>
                      <button className="icon-btn" style={{ width: 26, height: 26, borderRadius: 6 }} onClick={() => updateReceiveQty(r.product.id, 1)}><Plus size={12} /></button>
                    </div>
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>+{r.qty}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => setReceiveList(prev => prev.filter(x => x.product.id !== r.product.id))}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <div style={{ padding: '10px 12px', background: 'rgba(79,70,229,0.08)', borderRadius: 8, border: '1px solid rgba(79,70,229,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Total units to receive</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary-light)' }}>
                    {receiveList.reduce((s, r) => s + r.qty, 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Carton / Bulk Receive ── */}
      {activeTab === 'carton' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Layers size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-light)' }} />Carton / Case Receive</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Scan the barcode on a carton or outer case. Enter how many units are in each carton, and how many cartons you received.
            </p>

            <div className="search-bar" style={{ width: '100%', border: '2px solid var(--primary)', marginBottom: 12 }}>
              <QrCode size={18} style={{ color: 'var(--primary-light)' }} />
              <input
                ref={cartonRef}
                placeholder="Scan carton / case barcode..."
                value={cartonInput}
                onChange={e => setCartonInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cartonInput && scanCarton(cartonInput)}
                style={{ fontSize: 15, fontFamily: 'monospace' }}
              />
            </div>

            {cartonResult && (
              <div style={{ padding: 14, borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={16} style={{ color: '#10B981' }} />
                  <span style={{ fontWeight: 700, color: '#10B981' }}>{cartonResult.product.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><Hash size={11} style={{ display: 'inline', marginRight: 4 }} />Cartons / Cases Received</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="icon-btn" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)' }} onClick={() => setCartonQty(q => Math.max(1, q - 1))}><Minus size={14} /></button>
                      <input className="form-control" type="number" min="1" value={cartonQty} onChange={e => setCartonQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }} />
                      <button className="icon-btn" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)' }} onClick={() => setCartonQty(q => q + 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label"><Package size={11} style={{ display: 'inline', marginRight: 4 }} />Units per Carton</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="icon-btn" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)' }} onClick={() => setUnitsPerCarton(q => Math.max(1, q - 1))}><Minus size={14} /></button>
                      <input className="form-control" type="number" min="1" value={unitsPerCarton} onChange={e => setUnitsPerCarton(Math.max(1, parseInt(e.target.value) || 1))} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }} />
                      <button className="icon-btn" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)' }} onClick={() => setUnitsPerCarton(q => q + 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cartonQty} carton(s) × {unitsPerCarton} units</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-light)' }}>= {cartonQty * unitsPerCarton} units</span>
                </div>
                <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={addCartonToList}>
                  <Plus size={14} /> Add to Receive List
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['8901234567890', '8907890123456', '8901234567892'].map(b => (
                <button key={b} className="btn btn-secondary btn-sm" style={{ fontFamily: 'monospace', fontSize: 11 }}
                  onClick={() => scanCarton(b)}>
                  {b.slice(0, 8)}...
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Carton Receive List</span>
              {cartonList.length > 0 && (
                <button className="btn btn-danger btn-sm" onClick={() => setCartonList([])}>Clear</button>
              )}
            </div>
            {cartonList.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <Layers size={32} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>No cartons added yet</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan a carton barcode to get started</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cartonList.map((c, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.product.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.product.barcode}</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => setCartonList(prev => prev.filter((_, j) => j !== i))}><X size={11} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary-light)' }}>{c.cartons}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Cartons</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}><ArrowRight size={12} /></div>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-muted)' }}>{c.unitsPerCarton}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Units/Carton</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}><ArrowRight size={12} /></div>
                      <div style={{ textAlign: 'center', flex: 1, padding: '6px 0', background: 'rgba(16,185,129,0.1)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#10B981' }}>{c.totalUnits}</div>
                        <div style={{ color: '#10B981', fontSize: 10 }}>Total Units</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Grand Total Units</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-light)' }}>
                    {cartonList.reduce((s, c) => s + c.totalUnits, 0)}
                  </span>
                </div>
                <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={commitCartonReceive}>
                  <CheckCircle size={14} /> Confirm Carton Receive
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Print Labels ── */}
      {activeTab === 'print' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Printer size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-light)' }} />Label Print Queue</span>
              {printQueue.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={() => { showToast(`Printing ${printQueue.reduce((s, p) => s + p.labelQty, 0)} labels...`, 'info'); setPrintQueue([]); }}>
                  <Printer size={12} /> Print All
                </button>
              )}
            </div>
            {printQueue.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <Printer size={32} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>Print queue is empty</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add products from the list on the right</p>
              </div>
            ) : printQueue.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.barcode}</div>
                  <div style={{ display: 'flex', gap: 1, height: 30, alignItems: 'flex-end', margin: '6px 0' }}>
                    {Array.from(p.barcode).map((c, i) => (
                      <div key={i} style={{ width: parseInt(c) % 2 === 0 ? 2 : 1, height: parseInt(c) % 3 === 0 ? 30 : 20, background: 'var(--text-primary)' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="icon-btn" style={{ width: 24, height: 24, borderRadius: 6 }} onClick={() => setPrintQueue(prev => prev.map(x => x.id === p.id ? { ...x, labelQty: Math.max(1, x.labelQty - 1) } : x))}><Minus size={11} /></button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: 14 }}>{p.labelQty}</span>
                  <button className="icon-btn" style={{ width: 24, height: 24, borderRadius: 6 }} onClick={() => setPrintQueue(prev => prev.map(x => x.id === p.id ? { ...x, labelQty: x.labelQty + 1 } : x))}><Plus size={11} /></button>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13, minWidth: 55 }}>${p.salePrice}</span>
                <button className="btn btn-danger btn-sm" onClick={() => setPrintQueue(prev => prev.filter(x => x.id !== p.id))}>×</button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Add to Queue</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
              {products.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.barcode.slice(0, 10)}...</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => addToPrintQueue(p)}>
                    <Plus size={11} /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
