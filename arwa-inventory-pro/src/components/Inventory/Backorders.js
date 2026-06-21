import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Package, X, Plus, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function Backorders() {
  const { backorders, addBackorder, updateBackorder, products, addAuditEntry } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', customerName: '', qty: 1, notes: '', priority: 'normal' });
  const [filter, setFilter] = useState('all');

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.productId || !form.qty) return;
    const product = products.find(p => String(p.id) === String(form.productId));
    const bo = {
      ...form,
      id: Date.now(),
      boNumber: 'BO-' + Date.now().toString(36).toUpperCase(),
      productName: product?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      fulfilledAt: null,
    };
    addBackorder(bo);
    addAuditEntry('BACKORDER_CREATED', { boNumber: bo.boNumber, product: bo.productName, customer: bo.customerName });
    setShowForm(false);
    setForm({ productId: '', customerName: '', qty: 1, notes: '', priority: 'normal' });
  };

  const fulfil = (bo) => {
    updateBackorder(bo.id, { status: 'fulfilled', fulfilledAt: new Date().toISOString() });
    addAuditEntry('BACKORDER_FULFILLED', { boNumber: bo.boNumber, product: bo.productName });
  };

  const cancel = (bo) => {
    updateBackorder(bo.id, { status: 'cancelled' });
    addAuditEntry('BACKORDER_CANCELLED', { boNumber: bo.boNumber });
  };

  const filtered = useMemo(() =>
    (backorders || [])
      .filter(b => filter === 'all' || b.status === filter)
      .sort((a, b) => {
        const pri = { urgent: 0, high: 1, normal: 2 };
        return (pri[a.priority]||2) - (pri[b.priority]||2) || new Date(b.createdAt) - new Date(a.createdAt);
      }),
    [backorders, filter]
  );

  const stats = useMemo(() => ({
    pending:   (backorders||[]).filter(b=>b.status==='pending').length,
    fulfilled: (backorders||[]).filter(b=>b.status==='fulfilled').length,
    urgent:    (backorders||[]).filter(b=>b.status==='pending'&&b.priority==='urgent').length,
  }), [backorders]);

  const priConfig = { urgent:{color:'#EF4444',bg:'rgba(239,68,68,0.12)'}, high:{color:'#F59E0B',bg:'rgba(245,158,11,0.12)'}, normal:{color:'#6B7280',bg:'rgba(107,114,128,0.12)'} };

  const exportCSV = () => {
    const rows=[['BO #','Created','Product','Customer','Qty','Priority','Status','Fulfilled'],
      ...(backorders||[]).map(b=>[b.boNumber,b.createdAt?.slice(0,10),b.productName,b.customerName||'—',b.qty,b.priority,b.status,b.fulfilledAt?.slice(0,10)||''])];
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='backorders.csv';a.click();URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Backorders</h1>
          <p>Track out-of-stock orders waiting for stock replenishment</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={14}/> Export</button>
          <button className="btn btn-primary" onClick={()=>setShowForm(true)}><Plus size={14}/> New Backorder</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pending',   value: stats.pending,   color: '#F59E0B' },
          { label: 'Urgent',    value: stats.urgent,    color: '#EF4444' },
          { label: 'Fulfilled', value: stats.fulfilled, color: '#10B981' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:14, textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom:20, border:'2px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>Create Backorder</div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product *</label>
              <select className="form-control" value={form.productId} onChange={e=>setF('productId',e.target.value)}>
                <option value="">Select product…</option>
                {products.filter(p=>(p.stock||0)===0||(p.stock||0)<5).map(p=><option key={p.id} value={p.id}>{p.name} (stock: {p.stock||0})</option>)}
                {products.filter(p=>(p.stock||0)>=5).map(p=><option key={p.id} value={p.id}>{p.name} (stock: {p.stock||0})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input className="form-control" placeholder="Who is waiting for this?" value={form.customerName} onChange={e=>setF('customerName',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-control" type="number" min="1" value={form.qty} onChange={e=>setF('qty',parseInt(e.target.value)||1)} />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e=>setF('priority',e.target.value)}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Notes</label>
              <input className="form-control" placeholder="Customer notes, special instructions…" value={form.notes} onChange={e=>setF('notes',e.target.value)} />
            </div>
          </div>
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}><AlertTriangle size={14}/> Create Backorder</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="tabs" style={{ marginBottom:14 }}>
          {[['all','All'],['pending','Pending'],['fulfilled','Fulfilled'],['cancelled','Cancelled']].map(([v,l])=>(
            <button key={v} className={`tab ${filter===v?'active':''}`} onClick={()=>setFilter(v)}>{l}</button>
          ))}
        </div>
        {filtered.length===0?(
          <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-muted)' }}>
            <Package size={32} style={{ margin:'0 auto 12px',opacity:0.3 }}/>
            <p>No backorders. When stock runs out during a sale, create a backorder here to track pending fulfilment.</p>
          </div>
        ):(
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {filtered.map(bo=>{
              const pri=priConfig[bo.priority]||priConfig.normal;
              return (
                <div key={bo.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,background:'var(--bg-tertiary)',border:'1px solid var(--border)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                      <span style={{ fontWeight:800,fontSize:13 }}>{bo.boNumber}</span>
                      <span style={{ padding:'2px 7px',borderRadius:12,fontSize:10,fontWeight:700,background:pri.bg,color:pri.color }}>{bo.priority.toUpperCase()}</span>
                      <span style={{ padding:'2px 7px',borderRadius:12,fontSize:10,fontWeight:700, background:bo.status==='fulfilled'?'rgba(16,185,129,0.12)':bo.status==='cancelled'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)', color:bo.status==='fulfilled'?'#10B981':bo.status==='cancelled'?'#EF4444':'#F59E0B' }}>{bo.status}</span>
                    </div>
                    <div style={{ fontSize:13,fontWeight:600 }}>{bo.productName} × {bo.qty}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)',display:'flex',gap:10 }}>
                      {bo.customerName&&<span>Customer: {bo.customerName}</span>}
                      <span>Created: {bo.createdAt?.slice(0,10)}</span>
                      {bo.fulfilledAt&&<span>Fulfilled: {bo.fulfilledAt?.slice(0,10)}</span>}
                    </div>
                    {bo.notes&&<div style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>{bo.notes}</div>}
                  </div>
                  {bo.status==='pending'&&(
                    <div style={{ display:'flex',gap:6 }}>
                      <button className="btn btn-success btn-sm" onClick={()=>fulfil(bo)}><CheckCircle size={11}/> Fulfil</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>cancel(bo)}><X size={11}/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
