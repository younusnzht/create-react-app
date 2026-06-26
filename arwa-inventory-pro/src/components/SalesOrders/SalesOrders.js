import React, { useState, useMemo } from 'react';
import {
  Plus, Search, X, Truck, Clock, ChevronDown,
  Eye, Trash2, ClipboardList, DollarSign,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

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

const STAT_CARDS = (orders) => {
  const pending = orders.filter(o => ['new','processing','picking'].includes(o.status)).length;
  const dispatched = orders.filter(o => o.status === 'dispatched').length;
  const totalValue = orders.reduce((s, o) => s + (o.total || 0), 0);
  return [
    { label: 'Total Orders',    value: orders.length, icon: ClipboardList, color: '#4F46E5' },
    { label: 'Pending',         value: pending,        icon: Clock,         color: '#F59E0B' },
    { label: 'Dispatched',      value: dispatched,     icon: Truck,         color: '#06B6D4' },
    { label: 'Revenue (CAD)',   value: `$${totalValue.toLocaleString('en-CA', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: '#10B981' },
  ];
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.new;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {cfg.label}
    </span>
  );
}

function OrderModal({ order, onClose, onUpdateStatus, products, customers, currency }) {
  const sym = 'CA$';
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  const handleAdvance = () => {
    if (nextStatus) onUpdateStatus(order.id, nextStatus);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 780, maxHeight: '92vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{order.id}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {order.customer} • Received {new Date(order.dateReceived).toLocaleDateString('en-CA')}
            </p>
            {order.reference && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Customer PO: <strong>{order.reference}</strong></p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={order.status} />
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Status pipeline */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {STATUS_FLOW.map((s, i) => {
            const idx = STATUS_FLOW.indexOf(order.status);
            const done = i < idx;
            const active = i === idx;
            const cfg = STATUS_CFG[s];
            return (
              <React.Fragment key={s}>
                <div style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: active ? cfg.bg : done ? 'rgba(16,185,129,0.08)' : 'var(--bg-tertiary)',
                  color: active ? cfg.color : done ? '#10B981' : 'var(--text-muted)',
                  border: active ? `1px solid ${cfg.color}33` : '1px solid transparent',
                }}>
                  {done && '✓ '}{STATUS_CFG[s].label}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontSize: 10 }}>›</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Items table */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {['Product', 'SKU', 'Qty', 'Unit Price', 'Line Total'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textAlign: h === 'Product' || h === 'SKU' ? 'left' : 'right', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{item.qty.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>{sym}{(item.unitPrice || 0).toFixed(2)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: 'var(--primary-light)' }}>{sym}{((item.qty || 0) * (item.unitPrice || 0)).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Subtotal</span><span>{sym}{(order.subtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
            </div>
            {order.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Tax (HST)</span><span>{sym}{(order.tax || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 800, borderTop: '2px solid var(--border)', marginTop: 4 }}>
              <span>Total</span><span style={{ color: 'var(--primary-light)' }}>{sym}{(order.total || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Notes:</strong> {order.notes}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {nextStatus && order.status !== 'invoiced' && order.status !== 'cancelled' && (
            <button
              className="btn-primary"
              onClick={handleAdvance}
              style={{ background: STATUS_CFG[nextStatus]?.color }}
            >
              Advance to {STATUS_CFG[nextStatus]?.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onSave, customers, products }) {
  const [customerId, setCustomerId] = useState('');
  const [reference, setReference] = useState('');
  const [dateRequired, setDateRequired] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProducts, setShowProducts] = useState(false);

  const customer = customers.find(c => String(c.id) === String(customerId));

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10),
    [products, productSearch]);

  const addItem = (product) => {
    setItems(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        unitPrice: product.salePrice || 0,
        qty: 1,
      }];
    });
    setProductSearch('');
    setShowProducts(false);
  };

  const updateItem = (productId, field, val) =>
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, [field]: parseFloat(val) || 0 } : i));
  const removeItem = (productId) =>
    setItems(prev => prev.filter(i => i.productId !== productId));

  const subtotal = items.reduce((s, i) => s + (i.unitPrice || 0) * (i.qty || 0), 0);
  const tax = subtotal * 0.13;
  const total = subtotal + tax;

  const handleSave = () => {
    if (!customerId) { alert('Please select a customer'); return; }
    if (items.length === 0) { alert('Please add at least one product'); return; }
    onSave({
      customer: customer?.name || '',
      customerId,
      reference,
      dateRequired: dateRequired || null,
      notes,
      items,
      subtotal,
      tax,
      total,
      status: 'new',
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 820, maxHeight: '92vh', overflow: 'auto', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Receive Customer Order</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Log a new inbound order from a business customer</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Customer *</label>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
            >
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Customer PO / Reference</label>
            <input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. PO-M-2026-441"
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Required By Date</label>
            <input
              type="date"
              value={dateRequired}
              onChange={e => setDateRequired(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Notes / Special Instructions</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Delivery instructions, temperature requirements..."
              style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Product search */}
        <div style={{ marginBottom: 14, position: 'relative' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Add Products</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={productSearch}
              onChange={e => { setProductSearch(e.target.value); setShowProducts(true); }}
              onFocus={() => setShowProducts(true)}
              placeholder="Search products by name or SKU..."
              style={{ flex: 1, padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
            />
          </div>
          {showProducts && productSearch && filteredProducts.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 10, maxHeight: 220, overflowY: 'auto', boxShadow: 'var(--shadow-lg)', marginTop: 4 }}>
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => addItem(p)}
                  style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{p.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.sku} · CA${p.salePrice}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {['Product', 'Qty', 'Unit Price (CA$)', 'Total', ''].map(h => (
                    <th key={h} style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textAlign: h === 'Product' ? 'left' : 'right', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productId} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13 }}>{item.productName}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <input
                        type="number" min="1" value={item.qty}
                        onChange={e => updateItem(item.productId, 'qty', e.target.value)}
                        style={{ width: 70, padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <input
                        type="number" min="0" step="0.01" value={item.unitPrice}
                        onChange={e => updateItem(item.productId, 'unitPrice', e.target.value)}
                        style={{ width: 90, padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                      CA${((item.qty || 0) * (item.unitPrice || 0)).toFixed(2)}
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

        {/* Totals */}
        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <div style={{ width: 260, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span><span>CA${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--text-secondary)' }}>
                <span>HST (13%)</span><span>CA${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontWeight: 800, fontSize: 15, borderTop: '2px solid var(--border)', marginTop: 4 }}>
                <span>Total</span><span style={{ color: 'var(--primary-light)' }}>CA${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Receive Order</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesOrders() {
  const { salesOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder, customers, products, currency, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewOrder, setViewOrder] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = salesOrders || [];
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        o.reference?.toLowerCase().includes(q) ||
        (o.items || []).some(i => i.productName?.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
  }, [salesOrders, filterStatus, search]);

  const stats = useMemo(() => STAT_CARDS(salesOrders || []), [salesOrders]);

  const handleSave = (data) => {
    addSalesOrder({
      ...data,
      id: `SO-${Date.now()}`,
      dateReceived: new Date().toISOString(),
    });
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
    <div className="page-layout">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Sales Orders</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Inbound customer orders — pick, pack, dispatch, invoice</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Receive Order
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
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
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
            placeholder="Search orders, customers, products..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...Object.keys(STATUS_CFG)].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filterStatus === s ? 'var(--primary)' : 'var(--bg-secondary)',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)', transition: 'all 0.15s',
              }}
            >
              {s === 'all' ? 'All Orders' : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <ClipboardList size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No sales orders found</p>
            <p style={{ fontSize: 13, margin: 0 }}>
              {filterStatus !== 'all' ? `No ${STATUS_CFG[filterStatus]?.label} orders.` : 'Click "Receive Order" to log the first customer order.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  {['Order #', 'Customer', 'Reference', 'Items', 'Total (CA$)', 'Required By', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr
                    key={order.id}
                    style={{ borderTop: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', whiteSpace: 'nowrap' }}>{order.id}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{order.customer}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.reference || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center' }}>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{(order.items || []).length} SKUs</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>CA${(order.total || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {order.dateRequired ? new Date(order.dateRequired).toLocaleDateString('en-CA') : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={order.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="icon-btn"
                          title="View order"
                          onClick={() => setViewOrder(order)}
                        ><Eye size={15} /></button>
                        {order.status !== 'invoiced' && order.status !== 'cancelled' && (
                          <button
                            className="icon-btn"
                            title="Advance status"
                            onClick={() => {
                              const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                              if (next) handleUpdateStatus(order.id, next);
                            }}
                            style={{ color: STATUS_CFG[STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]]?.color }}
                          ><ChevronDown size={15} /></button>
                        )}
                        <button
                          className="icon-btn"
                          title="Cancel / delete"
                          onClick={() => handleDelete(order.id)}
                          style={{ color: '#EF4444' }}
                        ><Trash2 size={15} /></button>
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
        <NewOrderModal
          onClose={() => setShowNew(false)}
          onSave={handleSave}
          customers={customers}
          products={products}
          currency={currency}
        />
      )}
      {viewOrder && (
        <OrderModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          products={products}
          customers={customers}
          currency={currency}
        />
      )}
    </div>
  );
}
