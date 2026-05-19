import React, { useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, Globe, ChevronDown, ChevronUp, RefreshCw, MapPin, User, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PLATFORMS = [
  { id: 'all', label: 'All Orders', color: 'var(--primary-light)' },
  { id: 'ubereats', label: 'Uber Eats', color: '#06C167' },
  { id: 'doordash', label: 'DoorDash', color: '#FF3008' },
  { id: 'skipthedishes', label: 'Skip', color: '#FF7A00' },
  { id: 'website', label: 'Own Website', color: 'var(--primary-light)' },
  { id: 'phone', label: 'Phone / Walk-in', color: '#8B5CF6' },
];

const STATUS_CONFIG = {
  new:        { label: 'New',          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',   icon: ShoppingBag },
  confirmed:  { label: 'Confirmed',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',   icon: CheckCircle },
  preparing:  { label: 'Preparing',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   icon: RefreshCw },
  ready:      { label: 'Ready',        color: '#10B981', bg: 'rgba(16,185,129,0.12)',   icon: CheckCircle },
  pickup:     { label: 'Out / Pickup', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',    icon: Truck },
  delivered:  { label: 'Delivered',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',    color: '#EF4444', bg: 'rgba(239,68,68,0.12)',    icon: XCircle },
};

const STATUS_FLOW = ['new', 'confirmed', 'preparing', 'ready', 'pickup', 'delivered'];

const PLATFORM_LOGOS = {
  ubereats:      { bg: '#06C167', letter: 'U', text: 'Uber Eats' },
  doordash:      { bg: '#FF3008', letter: 'D', text: 'DoorDash' },
  skipthedishes: { bg: '#FF7A00', letter: 'S', text: 'Skip' },
  website:       { bg: '#4F46E5', letter: 'W', text: 'Website' },
  phone:         { bg: '#8B5CF6', letter: 'P', text: 'Phone/Walk-in' },
};

const sym = (code) => ({ USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', PKR: '₨', INR: '₹', AED: 'د.إ' }[code] || code + ' ');

function PlatformBadge({ platform }) {
  const p = PLATFORM_LOGOS[platform] || PLATFORM_LOGOS.website;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'white', flexShrink: 0 }}>
        {p.letter}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.text}</span>
    </div>
  );
}

function OrderCard({ order, onStatusChange, currencyCode }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const StatusIcon = status.icon;
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>

      {/* Status bar top */}
      <div style={{ height: 3, background: status.color }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Row 1: Order ID + Platform + Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>#{order.id}</span>
            <PlatformBadge platform={order.platform} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: status.bg, border: `1px solid ${status.color}30` }}>
            <StatusIcon size={11} style={{ color: status.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>{status.label}</span>
          </div>
        </div>

        {/* Row 2: Customer + Type + Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
            <User size={12} style={{ color: 'var(--text-muted)' }} />
            {order.customer}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            {order.type === 'delivery' ? (
              <><Truck size={12} style={{ color: '#06B6D4' }} /><span style={{ color: '#06B6D4', fontWeight: 600 }}>Delivery</span></>
            ) : order.type === 'pickup' ? (
              <><MapPin size={12} style={{ color: '#F59E0B' }} /><span style={{ color: '#F59E0B', fontWeight: 600 }}>Pickup</span></>
            ) : (
              <><ShoppingBag size={12} style={{ color: '#10B981' }} /><span style={{ color: '#10B981', fontWeight: 600 }}>Dine-in</span></>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <Clock size={11} />
            {order.time}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800, color: 'var(--success)', marginLeft: 'auto' }}>
            <DollarSign size={13} />{sym(currencyCode)}{order.total.toFixed(2)}
          </div>
        </div>

        {/* Row 3: Item summary */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          {order.items.slice(0, 2).map((it, i) => (
            <span key={i}>{i > 0 ? ' · ' : ''}{it.qty}× {it.name}</span>
          ))}
          {order.items.length > 2 && <span style={{ color: 'var(--text-muted)' }}> +{order.items.length - 2} more</span>}
        </div>

        {/* Expandable items */}
        {expanded && (
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            {order.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span>{it.qty}× {it.name}{it.note ? <span style={{ color: 'var(--text-muted)' }}> ({it.note})</span> : ''}</span>
                <span style={{ fontWeight: 600 }}>{sym(currencyCode)}{(it.price * it.qty).toFixed(2)}</span>
              </div>
            ))}
            {order.address && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 5 }}>
                <MapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                {order.address}
              </div>
            )}
            {order.note && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 12, color: '#F59E0B' }}>
                Note: {order.note}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {nextStatus && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onStatusChange(order.id, nextStatus)}>
              {STATUS_CONFIG[nextStatus]?.label} <ChevronDown size={11} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <button className="btn btn-danger btn-sm" onClick={() => onStatusChange(order.id, 'cancelled')}>
              <XCircle size={12} /> Cancel
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnlineOrders() {
  const { onlineOrders: orders, updateOnlineOrderStatus, addOnlineOrder, showToast, currency } = useApp();
  const [activePlatform, setActivePlatform] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ customer: '', platform: 'phone', type: 'pickup', note: '', items: [{ name: '', qty: 1, price: 0 }] });

  const filtered = orders.filter(o => {
    const platformOk = activePlatform === 'all' || o.platform === activePlatform;
    const statusOk = activeStatus === 'all' || o.status === activeStatus;
    return platformOk && statusOk;
  });

  const handleStatusChange = (id, newStatus) => {
    updateOnlineOrderStatus(id, newStatus);
    showToast(`Order #${id} → ${STATUS_CONFIG[newStatus]?.label}`, newStatus === 'cancelled' ? 'warning' : 'success');
    if (newStatus === 'delivered' || newStatus === 'pickup') {
      showToast('Order fulfilled. Tap to deduct inventory.', 'info');
    }
  };

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(s => [s, orders.filter(o => o.status === s).length])
  );

  const addNewOrder = (e) => {
    e.preventDefault();
    const id = `${Date.now()}`.slice(-6);
    const total = newOrder.items.reduce((s, it) => s + it.price * it.qty, 0);
    if (total === 0) {
      showToast('Order total is $0 — please add item prices', 'warning');
    }
    const orderObj = {
      id, platform: newOrder.platform, customer: newOrder.customer,
      type: newOrder.type, status: 'new',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total, items: newOrder.items.filter(it => it.name),
      note: newOrder.note, address: '',
    };
    addOnlineOrder(orderObj);
    showToast(`New order #${id} created`, 'success');
    setShowNewModal(false);
    setNewOrder({ customer: '', platform: 'phone', type: 'pickup', note: '', items: [{ name: '', qty: 1, price: 0 }] });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Online Orders</h1>
          <p>Uber Eats · DoorDash · Skip · Website · Phone — all in one queue</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { showToast('Syncing all platforms...', 'info'); }}>
            <RefreshCw size={14} /> Sync
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <ShoppingBag size={14} /> New Order
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'New', key: 'new', color: '#3B82F6' },
          { label: 'Preparing', key: 'preparing', color: '#F59E0B' },
          { label: 'Ready', key: 'ready', color: '#10B981' },
          { label: 'Out/Pickup', key: 'pickup', color: '#06B6D4' },
          { label: 'Delivered', key: 'delivered', color: '#6B7280' },
          { label: 'Cancelled', key: 'cancelled', color: '#EF4444' },
        ].map(s => (
          <button key={s.key}
            onClick={() => setActiveStatus(activeStatus === s.key ? 'all' : s.key)}
            style={{ padding: '12px 10px', borderRadius: 10, border: `1px solid ${activeStatus === s.key ? s.color : 'var(--border)'}`, background: activeStatus === s.key ? `${s.color}18` : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{counts[s.key] || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Platform filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {PLATFORMS.map(p => {
          const count = p.id === 'all' ? orders.length : orders.filter(o => o.platform === p.id).length;
          return (
            <button key={p.id}
              onClick={() => setActivePlatform(p.id)}
              style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${activePlatform === p.id ? p.color : 'var(--border)'}`, background: activePlatform === p.id ? `${p.color}18` : 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: activePlatform === p.id ? p.color : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
              {p.label}
              <span style={{ background: activePlatform === p.id ? p.color : 'var(--bg-tertiary)', color: activePlatform === p.id ? 'white' : 'var(--text-muted)', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <ShoppingBag size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No orders found</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try a different filter or create a new order</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(o => (
            <OrderCard key={o.id} order={o} onStatusChange={handleStatusChange} currencyCode={currency} />
          ))}
        </div>
      )}

      {/* Integration info banner */}
      <div className="card" style={{ marginTop: 20, background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))', border: '1px solid rgba(79,70,229,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe size={18} style={{ color: 'var(--primary-light)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Third-Party Platform Integrations</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Live API sync with Uber Eats, DoorDash, Skip the Dishes, and your own website requires the Professional or Enterprise plan. Orders currently shown are demo data.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Uber Eats', color: '#06C167' },
              { label: 'DoorDash', color: '#FF3008' },
              { label: 'Skip', color: '#FF7A00' },
              { label: 'Website', color: '#4F46E5' },
              { label: 'Phone', color: '#8B5CF6' },
            ].map(pl => (
              <div key={pl.label} style={{ padding: '4px 10px', borderRadius: 6, background: `${pl.color}18`, border: `1px solid ${pl.color}40`, fontSize: 11, fontWeight: 700, color: pl.color }}>
                {pl.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Manual Order</h3>
              <button className="icon-btn" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <form onSubmit={addNewOrder}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input className="form-control" required value={newOrder.customer} onChange={e => setNewOrder(o => ({ ...o, customer: e.target.value }))} placeholder="Customer name or phone" />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform *</label>
                  <select className="form-control" value={newOrder.platform} onChange={e => setNewOrder(o => ({ ...o, platform: e.target.value }))}>
                    <option value="phone">Phone / Walk-in</option>
                    <option value="website">Own Website</option>
                    <option value="ubereats">Uber Eats</option>
                    <option value="doordash">DoorDash</option>
                    <option value="skipthedishes">Skip the Dishes</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Order Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['pickup', 'delivery', 'dinein'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setNewOrder(o => ({ ...o, type: t }))}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${newOrder.type === t ? 'var(--primary)' : 'var(--border)'}`, background: newOrder.type === t ? 'rgba(79,70,229,0.1)' : 'var(--bg-tertiary)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: newOrder.type === t ? 'var(--primary-light)' : 'var(--text-secondary)', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                      {t === 'dinein' ? 'Dine-in' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Items</label>
                {newOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="form-control" placeholder="Item name" value={item.name} onChange={e => setNewOrder(o => ({ ...o, items: o.items.map((it, j) => j === i ? { ...it, name: e.target.value } : it) }))} style={{ flex: 2 }} />
                    <input className="form-control" type="number" placeholder="Qty" min="1" value={item.qty} onChange={e => setNewOrder(o => ({ ...o, items: o.items.map((it, j) => j === i ? { ...it, qty: parseInt(e.target.value) || 1 } : it) }))} style={{ width: 70 }} />
                    <input className="form-control" type="number" placeholder="Price" step="0.01" min="0" value={item.price} onChange={e => setNewOrder(o => ({ ...o, items: o.items.map((it, j) => j === i ? { ...it, price: parseFloat(e.target.value) || 0 } : it) }))} style={{ width: 90 }} />
                    {newOrder.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => setNewOrder(o => ({ ...o, items: o.items.filter((_, j) => j !== i) }))}>×</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNewOrder(o => ({ ...o, items: [...o.items, { name: '', qty: 1, price: 0 }] }))}>
                  + Add Item
                </button>
              </div>
              <div className="form-group">
                <label className="form-label">Order Note (optional)</label>
                <input className="form-control" placeholder="Allergies, special instructions..." value={newOrder.note} onChange={e => setNewOrder(o => ({ ...o, note: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  Total: {sym(currency)}{newOrder.items.reduce((s, it) => s + it.price * it.qty, 0).toFixed(2)}
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><ShoppingBag size={14} /> Create Order</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
