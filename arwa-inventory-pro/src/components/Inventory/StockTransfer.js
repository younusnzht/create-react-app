import React, { useState, useMemo } from 'react';
import { ArrowRight, Plus, CheckCircle, Clock, X, Download, Truck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const LOCATIONS = ['Main Store', 'Branch B', 'Warehouse A', 'Warehouse B', 'Cold Storage', 'Dry Goods'];

export default function StockTransfer() {
  const { products, stockTransfers, addStockTransfer, updateProduct, addAuditEntry } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromLocation: 'Main Store', toLocation: 'Warehouse A', notes: '', items: [] });
  const [itemRow, setItemRow] = useState({ productId: '', qty: 1 });
  const [filter, setFilter] = useState('all');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (k, v) => setItemRow(f => ({ ...f, [k]: v }));

  const addItem = () => {
    if (!itemRow.productId) return;
    const product = products.find(p => String(p.id) === String(itemRow.productId));
    if (!product) return;
    if (form.items.find(i => i.productId === itemRow.productId)) return;
    setForm(f => ({ ...f, items: [...f.items, { ...itemRow, id: Date.now(), productName: product.name, availableStock: product.stock || 0 }] }));
    setItemRow({ productId: '', qty: 1 });
  };

  const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

  const handleTransfer = () => {
    if (!form.fromLocation || !form.toLocation || form.fromLocation === form.toLocation || form.items.length === 0) return;
    const transfer = {
      ...form,
      id: Date.now(),
      transferNumber: 'TRF-' + Date.now().toString(36).toUpperCase(),
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    // Deduct from origin stock (simple model — no per-location tracking yet)
    form.items.forEach(item => {
      const product = products.find(p => String(p.id) === String(item.productId));
      if (product) {
        updateProduct(product.id, { stock: Math.max(0, (product.stock || 0) - item.qty) });
      }
    });
    addStockTransfer(transfer);
    addAuditEntry('STOCK_TRANSFER', { from: form.fromLocation, to: form.toLocation, items: form.items.length });
    setShowForm(false);
    setForm({ fromLocation: 'Main Store', toLocation: 'Warehouse A', notes: '', items: [] });
  };

  const transfers = useMemo(() =>
    (stockTransfers || [])
      .filter(t => filter === 'all' || t.status === filter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [stockTransfers, filter]
  );

  const exportCSV = () => {
    const rows = [['Transfer #','Date','From','To','Items','Status','Notes'],
      ...transfers.map(t=>[t.transferNumber,t.createdAt?.slice(0,10),t.fromLocation,t.toLocation,t.items?.length,t.status,t.notes||''])];
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='stock-transfers.csv';a.click();URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Stock Transfers</h1>
          <p>Move inventory between locations — Main Store, Branch B, Warehouses</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={14} /> Export</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> New Transfer</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Transfers', value: (stockTransfers||[]).length, color: '#4F46E5' },
          { label: 'Completed',       value: (stockTransfers||[]).filter(t=>t.status==='completed').length, color: '#10B981' },
          { label: 'Pending',         value: (stockTransfers||[]).filter(t=>t.status==='pending').length, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '2px solid rgba(79,70,229,0.3)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>New Stock Transfer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">From Location</label>
              <select className="form-control" value={form.fromLocation} onChange={e => setF('fromLocation', e.target.value)}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--primary-light)', marginTop: 20, flexShrink: 0 }} />
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">To Location</label>
              <select className="form-control" value={form.toLocation} onChange={e => setF('toLocation', e.target.value)}>
                {LOCATIONS.filter(l => l !== form.fromLocation).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              <label className="form-label">Notes</label>
              <input className="form-control" placeholder="Reason for transfer…" value={form.notes} onChange={e => setF('notes', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px auto', gap: 8, marginBottom: 10 }}>
            <select className="form-control" value={itemRow.productId} onChange={e => setItem('productId', e.target.value)}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock||0})</option>)}
            </select>
            <input className="form-control" type="number" min="1" placeholder="Qty" value={itemRow.qty} onChange={e => setItem('qty', parseInt(e.target.value)||1)} />
            <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={12} /> Add</button>
          </div>

          {form.items.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              {form.items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{item.productName}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Available: {item.availableStock}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: item.qty > item.availableStock ? '#EF4444' : 'var(--primary-light)' }}>→ {item.qty} units</span>
                  <button onClick={() => removeItem(item.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><X size={12}/></button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleTransfer} disabled={form.items.length === 0 || form.fromLocation === form.toLocation}>
              <Truck size={14} /> Confirm Transfer
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="tabs" style={{ marginBottom: 14 }}>
          {[['all','All'],['completed','Completed'],['pending','Pending']].map(([v,l])=>(
            <button key={v} className={`tab ${filter===v?'active':''}`} onClick={()=>setFilter(v)}>{l}</button>
          ))}
        </div>
        {transfers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Truck size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No transfers yet. Click "New Transfer" to move stock between locations.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Transfer #','Date','From','','To','Items','Status','Notes'].map(h=>(
                    <th key={h} style={{ padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id} style={{ borderBottom:'1px solid var(--border)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-tertiary)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'8px 10px', fontWeight:700 }}>{t.transferNumber}</td>
                    <td style={{ padding:'8px 10px', color:'var(--text-muted)' }}>{t.createdAt?.slice(0,10)}</td>
                    <td style={{ padding:'8px 10px' }}>{t.fromLocation}</td>
                    <td style={{ padding:'8px 10px' }}><ArrowRight size={12} style={{ color:'var(--text-muted)' }}/></td>
                    <td style={{ padding:'8px 10px' }}>{t.toLocation}</td>
                    <td style={{ padding:'8px 10px', color:'var(--primary-light)', fontWeight:700 }}>{t.items?.length || 0}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700, background:t.status==='completed'?'rgba(16,185,129,0.12)':'rgba(245,158,11,0.12)', color:t.status==='completed'?'#10B981':'#F59E0B' }}>
                        {t.status==='completed'?<><CheckCircle size={9}/> Completed</>:<><Clock size={9}/> Pending</>}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px', color:'var(--text-muted)', fontSize:12 }}>{t.notes||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
