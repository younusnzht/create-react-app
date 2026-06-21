import React, { useState } from 'react';
import { Plus, Package, Hash, AlertTriangle, CheckCircle, X, ScanLine } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';


function LotBadge({ lot }) {
  const expiry = lot.expiryDate ? new Date(lot.expiryDate) : null;
  const daysLeft = expiry ? Math.ceil((expiry - Date.now()) / 86400000) : null;
  const expired  = daysLeft !== null && daysLeft <= 0;
  const expiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px', borderRadius: 8, marginBottom: 6,
      background: expired ? 'rgba(239,68,68,0.08)' : expiring ? 'rgba(245,158,11,0.08)' : 'var(--bg-tertiary)',
      border: `1px solid ${expired ? 'rgba(239,68,68,0.3)' : expiring ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Hash size={13} style={{ color: 'var(--primary-light)' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{lot.lotNumber}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Received: {lot.receivedDate} · Supplier: {lot.supplier || '—'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {lot.expiryDate && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: expired ? '#EF4444' : expiring ? '#F59E0B' : 'var(--success)' }}>
              {expired ? 'EXPIRED' : expiring ? `Exp. in ${daysLeft}d` : `Exp. ${lot.expiryDate}`}
            </div>
            {expired ? <AlertTriangle size={12} style={{ color: '#EF4444' }} /> : expiring ? <AlertTriangle size={12} style={{ color: '#F59E0B' }} /> : <CheckCircle size={12} style={{ color: 'var(--success)' }} />}
          </div>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary-light)' }}>{lot.quantity}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>units</div>
        </div>
      </div>
    </div>
  );
}

export default function LotTracker() {
  const { products, updateProduct, addAuditEntry } = useApp();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddLot, setShowAddLot] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [lotForm, setLotForm] = useState({ lotNumber: '', quantity: '', expiryDate: '', receivedDate: new Date().toISOString().split('T')[0], supplier: '', cost: '' });
  const [serialInput, setSerialInput] = useState('');

  const tracked = products.filter(p => p.trackingType && p.trackingType !== 'none');
  const filtered = products.filter(p =>
    (filterType === 'all' || p.trackingType === filterType) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalLots    = tracked.reduce((s, p) => s + (p.lots?.length || 0), 0);
  const expiredLots  = tracked.reduce((s, p) => s + (p.lots || []).filter(l => l.expiryDate && new Date(l.expiryDate) < new Date()).length, 0);
  const expiringLots = tracked.reduce((s, p) => s + (p.lots || []).filter(l => { if (!l.expiryDate) return false; const d = Math.ceil((new Date(l.expiryDate) - Date.now()) / 86400000); return d > 0 && d <= 30; }).length, 0);

  const setTracking = (product, type) => {
    updateProduct(product.id, { trackingType: type, lots: type === 'batch' ? (product.lots || []) : [], serialNumbers: type === 'serial' ? (product.serialNumbers || []) : [] });
    addAuditEntry('TRACKING_UPDATED', { product: product.name, trackingType: type });
  };

  const addLot = () => {
    if (!lotForm.lotNumber || !lotForm.quantity) return;
    const newLot = { ...lotForm, quantity: parseInt(lotForm.quantity), id: Date.now() };
    const existing = selectedProduct.lots || [];
    updateProduct(selectedProduct.id, { lots: [...existing, newLot] });
    addAuditEntry('LOT_ADDED', { product: selectedProduct.name, lotNumber: lotForm.lotNumber, quantity: lotForm.quantity });
    setShowAddLot(false);
    setLotForm({ lotNumber: '', quantity: '', expiryDate: '', receivedDate: new Date().toISOString().split('T')[0], supplier: '', cost: '' });
    setSelectedProduct(prev => ({ ...prev, lots: [...existing, newLot] }));
  };

  const addSerial = () => {
    const nums = serialInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const existing = selectedProduct.serialNumbers || [];
    const deduped = [...new Set([...existing, ...nums])];
    updateProduct(selectedProduct.id, { serialNumbers: deduped });
    addAuditEntry('SERIALS_ADDED', { product: selectedProduct.name, count: nums.length });
    setSerialInput('');
    setSelectedProduct(prev => ({ ...prev, serialNumbers: deduped }));
  };

  const removeLot = (product, lotId) => {
    const updated = (product.lots || []).filter(l => l.id !== lotId);
    updateProduct(product.id, { lots: updated });
    setSelectedProduct(prev => ({ ...prev, lots: updated }));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Lot & Serial Tracking</h1>
          <p>Track batches, expiry dates, and serial numbers for regulated products</p>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tracked Products', value: tracked.length,  color: '#4F46E5' },
          { label: 'Active Lots',      value: totalLots,        color: '#10B981' },
          { label: 'Expiring (30d)',   value: expiringLots,     color: '#F59E0B' },
          { label: 'Expired',          value: expiredLots,      color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        {/* Left: product list */}
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <input className="form-control" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
            <div className="tabs">
              {[['all','All'],['batch','Lot/Batch'],['serial','Serial']].map(([v,l]) => (
                <button key={v} className={`tab ${filterType===v?'active':''}`} onClick={()=>setFilterType(v)}>{l}</button>
              ))}
            </div>
          </div>

          {/* All products — set tracking type */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Products — Set Tracking</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {filtered.slice(0, 20).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: selectedProduct?.id === p.id ? 'rgba(79,70,229,0.1)' : 'var(--bg-tertiary)', border: `1px solid ${selectedProduct?.id === p.id ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer' }} onClick={() => setSelectedProduct(products.find(pr => pr.id === p.id))}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.sku}</div>
                  </div>
                  <select className="form-control" style={{ width: 110, fontSize: 11, padding: '3px 6px' }}
                    value={p.trackingType || 'none'}
                    onChange={e => { e.stopPropagation(); setTracking(p, e.target.value); }}>
                    <option value="none">No Track</option>
                    <option value="batch">Lot/Batch</option>
                    <option value="serial">Serial</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: lot/serial detail for selected product */}
        <div>
          {!selectedProduct ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Select a product on the left to manage its lots or serial numbers</p>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedProduct.sku} · {selectedProduct.trackingType === 'batch' ? 'Lot/Batch tracking' : selectedProduct.trackingType === 'serial' ? 'Serial tracking' : 'No tracking'}</div>
                </div>
                {(selectedProduct.trackingType === 'batch') && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddLot(true)}><Plus size={12} /> Add Lot</button>
                )}
              </div>

              {selectedProduct.trackingType === 'batch' && (
                <>
                  {showAddLot && (
                    <div style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Add New Lot</div>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Lot Number *</label>
                          <input className="form-control" placeholder="LOT-2024-001" value={lotForm.lotNumber} onChange={e => setLotForm(f => ({...f, lotNumber: e.target.value}))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quantity *</label>
                          <input className="form-control" type="number" placeholder="0" value={lotForm.quantity} onChange={e => setLotForm(f => ({...f, quantity: e.target.value}))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Expiry Date</label>
                          <input className="form-control" type="date" value={lotForm.expiryDate} onChange={e => setLotForm(f => ({...f, expiryDate: e.target.value}))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Received Date</label>
                          <input className="form-control" type="date" value={lotForm.receivedDate} onChange={e => setLotForm(f => ({...f, receivedDate: e.target.value}))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Supplier</label>
                          <input className="form-control" placeholder="PharmaCo Ltd" value={lotForm.supplier} onChange={e => setLotForm(f => ({...f, supplier: e.target.value}))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Unit Cost</label>
                          <input className="form-control" type="number" placeholder="0.00" value={lotForm.cost} onChange={e => setLotForm(f => ({...f, cost: e.target.value}))} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddLot(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={addLot}><Plus size={12} /> Save Lot</button>
                      </div>
                    </div>
                  )}
                  <div>
                    {(selectedProduct.lots || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No lots recorded. Click "Add Lot" to record a batch.</div>
                    ) : (
                      (selectedProduct.lots || []).map(lot => (
                        <div key={lot.id} style={{ position: 'relative' }}>
                          <LotBadge lot={lot} />
                          <button onClick={() => removeLot(selectedProduct, lot.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}><X size={12} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {selectedProduct.trackingType === 'serial' && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="form-label">Add Serial Numbers (one per line or comma-separated)</label>
                    <textarea className="form-control" rows={4} placeholder="SN-001&#10;SN-002&#10;SN-003" value={serialInput} onChange={e => setSerialInput(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={addSerial}><Plus size={12} /> Add Serials</button>
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {(selectedProduct.serialNumbers || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No serial numbers recorded.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(selectedProduct.serialNumbers || []).map(sn => (
                          <div key={sn} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: 11, fontFamily: 'monospace' }}>
                            <ScanLine size={10} style={{ color: 'var(--text-muted)' }} />
                            {sn}
                            <button onClick={() => { const updated = (selectedProduct.serialNumbers||[]).filter(s=>s!==sn); updateProduct(selectedProduct.id,{serialNumbers:updated}); setSelectedProduct(p=>({...p,serialNumbers:updated})); }} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:0,marginLeft:2 }}><X size={10}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    {(selectedProduct.serialNumbers||[]).length} serial numbers on record
                  </div>
                </div>
              )}

              {(!selectedProduct.trackingType || selectedProduct.trackingType === 'none') && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No tracking enabled for this product. Use the dropdown on the left to enable Lot/Batch or Serial tracking.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
