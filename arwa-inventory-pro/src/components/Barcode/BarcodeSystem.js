import React, { useState, useRef } from 'react';
import { QrCode, Zap, Printer, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const BARCODE_HISTORY = [
  { id: 1, barcode: '8901234567890', product: 'Paracetamol 500mg', action: 'inventory_check', time: '10:32:14', result: 'success', qty: 450 },
  { id: 2, barcode: '8902345678901', product: 'iPhone 15 Pro', action: 'pos_checkout', time: '10:28:05', result: 'success', qty: 23 },
  { id: 3, barcode: '9999999999999', product: null, action: 'inventory_check', time: '10:21:33', result: 'not_found', qty: null },
  { id: 4, barcode: '8903456789012', product: 'Organic Whole Milk 1L', action: 'stock_receive', time: '09:55:10', result: 'success', qty: 12 },
  { id: 5, barcode: '8905678901234', product: 'Samsung 65" QLED TV', action: 'pos_checkout', time: '09:40:22', result: 'success', qty: 8 },
];

export default function BarcodeSystem() {
  const { products, showToast } = useApp();
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [printQueue, setPrintQueue] = useState([]);
  const [history, setHistory] = useState(BARCODE_HISTORY);
  const inputRef = useRef(null);

  const simulateScan = (barcode) => {
    if (!barcode) return;
    setScanning(true);
    setTimeout(() => {
      const found = products.find(p => p.barcode === barcode || p.sku === barcode);
      if (found) {
        setScanResult({ success: true, product: found });
        setHistory(prev => [{
          id: Date.now(), barcode, product: found.name, action: 'inventory_check',
          time: new Date().toLocaleTimeString(), result: 'success', qty: found.stock
        }, ...prev.slice(0, 9)]);
        showToast(`Found: ${found.name}`, 'success');
      } else {
        setScanResult({ success: false, barcode });
        setHistory(prev => [{
          id: Date.now(), barcode, product: null, action: 'inventory_check',
          time: new Date().toLocaleTimeString(), result: 'not_found', qty: null
        }, ...prev.slice(0, 9)]);
        showToast(`Barcode not found: ${barcode}`, 'warning');
      }
      setScanning(false);
      setScanInput('');
    }, 400);
  };

  const addToPrintQueue = (product) => {
    if (!printQueue.find(p => p.id === product.id)) {
      setPrintQueue(prev => [...prev, product]);
      showToast(`${product.name} added to print queue`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && scanInput) simulateScan(scanInput);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Barcode & QR System</h1>
          <p>USB scanner support, QR generation, and batch label printing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(16,185,129,0.12)', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Scanner Ready</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Scanner Panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Zap size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-light)' }} />
              Live Scanner
            </span>
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
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: 15, fontFamily: 'monospace' }}
              />
              {scanning && <RefreshCw size={14} className="spin" style={{ color: 'var(--primary-light)' }} />}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Press Enter to scan — or plug in USB barcode scanner and scan product
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['8901234567890', '8902345678901', '8904567890123'].map(b => (
              <button key={b} className="btn btn-secondary btn-sm" style={{ fontFamily: 'monospace', fontSize: 11 }} onClick={() => { setScanInput(b); setTimeout(() => simulateScan(b), 100); }}>
                {b.slice(0, 8)}...
              </button>
            ))}
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div style={{
              padding: 16, borderRadius: 10,
              background: scanResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${scanResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              animation: 'slideUp 0.2s ease',
            }}>
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
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => addToPrintQueue(scanResult.product)}>
                    <Printer size={12} /> Add to Print Queue
                  </button>
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

        {/* Print Queue */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Printer size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--primary-light)' }} />
              Label Print Queue
            </span>
            {printQueue.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => { showToast(`Printing ${printQueue.length} labels...`, 'info'); setPrintQueue([]); }}>
                <Printer size={12} /> Print All ({printQueue.length})
              </button>
            )}
          </div>
          {printQueue.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <Printer size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No items in print queue</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan a product and add it here</p>
            </div>
          ) : printQueue.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.barcode}</div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13 }}>${p.salePrice}</span>
              <button className="btn btn-danger btn-sm" onClick={() => setPrintQueue(prev => prev.filter(x => x.id !== p.id))}>×</button>
            </div>
          ))}

          <div className="divider" />
          <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>Quick Add Products</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {products.slice(0, 6).map(p => (
              <button key={p.id} className="btn btn-secondary btn-sm" style={{ justifyContent: 'space-between' }} onClick={() => addToPrintQueue(p)}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{p.barcode.slice(0, 8)}...</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan History */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scan Activity Log</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 24 hours</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Barcode</th>
              <th>Product</th>
              <th>Action</th>
              <th>Stock</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.time}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{h.barcode}</td>
                <td style={{ fontWeight: 600 }}>{h.product || '—'}</td>
                <td><span className="chip" style={{ textTransform: 'capitalize' }}>{h.action.replace('_', ' ')}</span></td>
                <td>{h.qty ?? '—'}</td>
                <td>
                  <span className={`badge ${h.result === 'success' ? 'badge-success' : 'badge-danger'}`}>
                    {h.result === 'success' ? 'Found' : 'Not Found'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
