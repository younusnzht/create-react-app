import React, { useState, useMemo } from 'react';
import { Plus, FileText, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Send, Package, X, Edit2, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const STATUS_CONFIG = {
  draft:    { label: 'Draft',         color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: FileText  },
  sent:     { label: 'Sent',          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: Send      },
  partial:  { label: 'Partial Recv.', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock     },
  received: { label: 'Received',      color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  cancelled:{ label: 'Cancelled',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle   },
};

function genPONumber() {
  return 'PO-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);
}

function POForm({ po, suppliers, products, onSave, onClose }) {
  const isEdit = !!po;
  const [form, setForm] = useState(po || {
    poNumber: genPONumber(),
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    expectedDelivery: '',
    notes: '',
    items: [],
  });
  const [itemRow, setItemRow] = useState({ productId: '', productName: '', qty: 1, unitCost: '', received: 0 });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setItem = (k, v) => setItemRow(f => ({ ...f, [k]: v }));

  const subtotal = form.items.reduce((s, i) => s + i.qty * parseFloat(i.unitCost || 0), 0);
  const tax      = subtotal * 0.05; // GST estimate
  const total    = subtotal + tax;

  const addItem = () => {
    if (!itemRow.productId || !itemRow.unitCost) return;
    setForm(f => ({ ...f, items: [...f.items, { ...itemRow, id: Date.now(), received: 0 }] }));
    setItemRow({ productId: '', productName: '', qty: 1, unitCost: '', received: 0 });
  };

  const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

  const handleSupplier = (suppId) => {
    const s = suppliers.find(s => String(s.id) === String(suppId));
    setF('supplierId', suppId);
    setF('supplierName', s?.name || '');
  };

  const handleProduct = (pid) => {
    const p = products.find(p => String(p.id) === String(pid));
    setItem('productId', pid);
    setItem('productName', p?.name || '');
    setItem('unitCost', p?.costPrice || p?.price * 0.6 || '');
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680, width: '95%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">PO Number</label>
            <input className="form-control" value={form.poNumber} onChange={e => setF('poNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier *</label>
            <select className="form-control" value={form.supplierId} onChange={e => handleSupplier(e.target.value)}>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Expected Delivery</label>
            <input className="form-control" type="date" value={form.expectedDelivery} onChange={e => setF('expectedDelivery', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-control" placeholder="Special instructions…" value={form.notes} onChange={e => setF('notes', e.target.value)} />
          </div>
        </div>

        {/* Line items */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Line Items</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px auto', gap: 6, marginBottom: 8 }}>
            <select className="form-control" style={{ fontSize: 12 }} value={itemRow.productId} onChange={e => handleProduct(e.target.value)}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="form-control" style={{ fontSize: 12 }} type="number" placeholder="Qty" min="1" value={itemRow.qty} onChange={e => setItem('qty', parseInt(e.target.value) || 1)} />
            <input className="form-control" style={{ fontSize: 12 }} type="number" placeholder="Unit Cost" value={itemRow.unitCost} onChange={e => setItem('unitCost', e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={12} /></button>
          </div>

          {form.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 8 }}>No items added yet</div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ background: 'var(--bg-tertiary)' }}>
                  <tr>
                    {['Product','Qty','Unit Cost','Total',''].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map(item => (
                    <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 10px' }}>{item.productName}</td>
                      <td style={{ padding: '7px 10px' }}>{item.qty}</td>
                      <td style={{ padding: '7px 10px' }}>${parseFloat(item.unitCost||0).toFixed(2)}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>${(item.qty * parseFloat(item.unitCost||0)).toFixed(2)}</td>
                      <td style={{ padding: '7px 10px' }}><button onClick={() => removeItem(item.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:2 }}><X size={11}/></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: 'var(--bg-tertiary)' }}>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td colSpan={3} style={{ padding: '7px 10px', fontWeight: 700, textAlign: 'right' }}>Subtotal</td>
                    <td colSpan={2} style={{ padding: '7px 10px', fontWeight: 700 }}>${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ padding: '4px 10px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>GST (5% est.)</td>
                    <td colSpan={2} style={{ padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)' }}>${tax.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td colSpan={3} style={{ padding: '7px 10px', fontWeight: 900, textAlign: 'right' }}>Total</td>
                    <td colSpan={2} style={{ padding: '7px 10px', fontWeight: 900, color: 'var(--primary-light)' }}>${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!form.supplierId || form.items.length === 0) return;
            onSave({ ...form, subtotal, tax, total, status: isEdit ? form.status : 'draft', createdAt: isEdit ? form.createdAt : new Date().toISOString() });
          }}>
            <FileText size={14} /> {isEdit ? 'Save Changes' : 'Create PO'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiveModal({ po, products, onReceive, onClose }) {
  const [received, setReceived] = useState(
    Object.fromEntries(po.items.map(i => [i.id, i.received || 0]))
  );
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">Receive Items — {po.poNumber}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Enter the quantity actually received for each item. Stock will be updated automatically.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {po.items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ordered: {item.qty} · Previously received: {item.received || 0}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Receiving:</label>
                <input className="form-control" type="number" min="0" max={item.qty - (item.received||0)}
                  value={received[item.id]} onChange={e => setReceived(r => ({...r, [item.id]: parseInt(e.target.value)||0}))}
                  style={{ width: 70, textAlign: 'center' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onReceive(received)}>
            <Package size={14} /> Confirm Receipt & Update Stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrders() {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, suppliers, products, updateProduct, addAuditEntry, currency } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [receivePO, setReceivePO] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const sym = currency === 'CAD' ? 'CA$' : '$';

  const filtered = useMemo(() =>
    (purchaseOrders || []).filter(po => statusFilter === 'all' || po.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [purchaseOrders, statusFilter]
  );

  const stats = useMemo(() => ({
    total:    (purchaseOrders||[]).length,
    draft:    (purchaseOrders||[]).filter(p=>p.status==='draft').length,
    pending:  (purchaseOrders||[]).filter(p=>['sent','partial'].includes(p.status)).length,
    received: (purchaseOrders||[]).filter(p=>p.status==='received').length,
    spend:    (purchaseOrders||[]).filter(p=>p.status!=='cancelled').reduce((s,p)=>s+(p.total||0),0),
  }), [purchaseOrders]);

  const handleSave = (po) => {
    if (editPO) {
      updatePurchaseOrder(po.id, po);
      addAuditEntry('PO_UPDATED', { poNumber: po.poNumber, supplier: po.supplierName });
    } else {
      addPurchaseOrder({ ...po, id: Date.now() });
      addAuditEntry('PO_CREATED', { poNumber: po.poNumber, supplier: po.supplierName, total: po.total });
    }
    setShowForm(false); setEditPO(null);
  };

  const handleReceive = (po, receivedQtys) => {
    const updatedItems = po.items.map(item => ({
      ...item,
      received: (item.received || 0) + (receivedQtys[item.id] || 0),
    }));
    const allReceived = updatedItems.every(i => i.received >= i.qty);
    const anyReceived = updatedItems.some(i => i.received > 0);
    const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : po.status;

    // Update stock for each received item
    updatedItems.forEach(item => {
      const qty = receivedQtys[item.id] || 0;
      if (qty > 0) {
        const product = products.find(p => String(p.id) === String(item.productId));
        if (product) updateProduct(product.id, { stock: (product.stock || 0) + qty });
      }
    });

    updatePurchaseOrder(po.id, { ...po, items: updatedItems, status: newStatus, receivedAt: allReceived ? new Date().toISOString() : po.receivedAt });
    addAuditEntry('PO_RECEIVED', { poNumber: po.poNumber, status: newStatus });
    setReceivePO(null);
  };

  const advanceStatus = (po, status) => {
    updatePurchaseOrder(po.id, { ...po, status, sentAt: status === 'sent' ? new Date().toISOString() : po.sentAt });
    addAuditEntry('PO_STATUS', { poNumber: po.poNumber, status });
  };

  const exportCSV = () => {
    const rows = [
      ['PO Number','Supplier','Status','Items','Subtotal','Tax','Total','Created','Expected Delivery'],
      ...(purchaseOrders||[]).map(po => [po.poNumber, po.supplierName, po.status, po.items?.length||0, po.subtotal?.toFixed(2), po.tax?.toFixed(2), po.total?.toFixed(2), po.createdAt?.slice(0,10), po.expectedDelivery||'']),
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='purchase-orders.csv';a.click();URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Purchase Orders</h1>
          <p>Create, send, and receive purchase orders from suppliers</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          <button className="btn btn-primary" onClick={() => { setEditPO(null); setShowForm(true); }}><Plus size={14} /> New Purchase Order</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total POs',   value: stats.total,                              color: '#4F46E5' },
          { label: 'Drafts',      value: stats.draft,                              color: '#6B7280' },
          { label: 'In Progress', value: stats.pending,                            color: '#F59E0B' },
          { label: 'Received',    value: stats.received,                           color: '#10B981' },
          { label: 'Total Spend', value: `${sym}${stats.spend.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, color: '#EF4444', raw: true },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: s.raw ? 16 : 26, fontWeight: 900, color: s.color }}>{s.raw ? s.value : s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tabs" style={{ marginBottom: 14 }}>
          {[['all','All'],['draft','Draft'],['sent','Sent'],['partial','Partial'],['received','Received'],['cancelled','Cancelled']].map(([v,l])=>(
            <button key={v} className={`tab ${statusFilter===v?'active':''}`} onClick={()=>setStatusFilter(v)}>{l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No purchase orders yet. Click "New Purchase Order" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(po => {
              const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft;
              const StatusIcon = cfg.icon;
              const isOpen = expanded === po.id;
              return (
                <div key={po.id} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-tertiary)', cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : po.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{po.poNumber}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StatusIcon size={10}/> {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                        <span><Truck size={10} style={{ marginRight: 3 }}/>{po.supplierName}</span>
                        <span>{po.items?.length||0} items</span>
                        {po.expectedDelivery && <span>Expected: {po.expectedDelivery}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary-light)' }}>{sym}{(po.total||0).toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{po.createdAt?.slice(0,10)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {po.status === 'draft' && <button className="btn btn-secondary btn-sm" onClick={e=>{e.stopPropagation();advanceStatus(po,'sent');}}><Send size={11}/> Send</button>}
                      {['sent','partial'].includes(po.status) && <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();setReceivePO(po);}}><Package size={11}/> Receive</button>}
                      {po.status === 'draft' && <button className="btn btn-secondary btn-sm" onClick={e=>{e.stopPropagation();setEditPO(po);setShowForm(true);}}><Edit2 size={11}/></button>}
                      {['draft','sent'].includes(po.status) && <button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();advanceStatus(po,'cancelled');}}><XCircle size={11}/></button>}
                    </div>
                    {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </div>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Product','Ordered','Received','Unit Cost','Total'].map(h=>(
                              <th key={h} style={{ padding:'6px 8px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(po.items||[]).map(item=>(
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding:'6px 8px' }}>{item.productName}</td>
                              <td style={{ padding:'6px 8px' }}>{item.qty}</td>
                              <td style={{ padding:'6px 8px', color: item.received>=item.qty ? 'var(--success)' : item.received>0 ? '#F59E0B' : 'var(--text-muted)' }}>{item.received||0}</td>
                              <td style={{ padding:'6px 8px' }}>{sym}{parseFloat(item.unitCost||0).toFixed(2)}</td>
                              <td style={{ padding:'6px 8px',fontWeight:700 }}>{sym}{(item.qty*parseFloat(item.unitCost||0)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {po.notes && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>Notes: {po.notes}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <POForm po={editPO} suppliers={suppliers} products={products} onSave={handleSave} onClose={() => { setShowForm(false); setEditPO(null); }} />}
      {receivePO && <ReceiveModal po={receivePO} products={products} onReceive={(r) => handleReceive(receivePO, r)} onClose={() => setReceivePO(null)} />}
    </div>
  );
}
