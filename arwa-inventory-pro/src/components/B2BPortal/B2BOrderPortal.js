import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, Send, Package, CheckCircle, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function B2BOrderPortal() {
  const { products, addSalesOrder, subscription, businessName, showToast } = useApp();
  const config = subscription.b2bPortal || {};
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('browse'); // browse | checkout | submitted
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', notes: '' });

  const availableProducts = useMemo(() =>
    products.filter(p => p.status !== 'out_of_stock' && p.stock > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()))
    ), [products, search]);

  const cartTotal = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
  const cartQty = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, product.stock) } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const submitOrder = () => {
    if (!form.company || !form.name || !form.email) { showToast('Please fill in company, name and email', 'warning'); return; }
    const minOrder = Number(config.minOrderValue);
    if (minOrder && cartTotal < minOrder) { showToast(`Minimum order value is CA$${minOrder.toFixed(2)}`, 'warning'); return; }

    addSalesOrder({
      id: `SO-B2B-${Date.now()}`,
      customer: form.company,
      contactName: form.name,
      contactEmail: form.email,
      contactPhone: form.phone,
      notes: form.notes,
      items: cart.map(i => ({ productId: i.id, name: i.name, sku: i.sku, qty: i.qty, unitPrice: i.salePrice })),
      total: cartTotal,
      status: config.requireApproval ? 'new' : 'processing',
      source: 'b2b_portal',
      dateReceived: new Date().toISOString(),
    });
    setStep('submitted');
  };

  if (!config.enabled) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Package size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Portal Offline</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>This order portal is currently unavailable. Please contact the supplier directly.</p>
        </div>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 440, padding: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} style={{ color: '#10B981' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Order Submitted!</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            {config.requireApproval
              ? `Thank you ${form.name}. Your order has been received and is pending approval. You will receive a confirmation email at ${form.email} within 24 hours.`
              : `Thank you ${form.name}. Your order is confirmed and being processed. You will receive updates at ${form.email}.`}
          </p>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Order total</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>CA${cartTotal.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{cartQty} items</div>
          </div>
          <button onClick={() => { setCart([]); setForm({ company:'',name:'',email:'',phone:'',notes:'' }); setStep('browse'); }} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#4F46E5', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: 'white' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>{config.portalName || (businessName || 'Arwa') + ' Order Portal'}</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{config.welcomeMessage || 'Browse our catalogue and place your wholesale order'}</p>
        </div>
        {cartQty > 0 && (
          <button onClick={() => setStep(step === 'checkout' ? 'browse' : 'checkout')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 10, background: '#4F46E5', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <ShoppingCart size={16} /> {cartQty} items · CA${cartTotal.toFixed(2)}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: step === 'checkout' ? '1fr 420px' : '1fr', maxWidth: 1200, margin: '0 auto', padding: '24px 32px', gap: 24 }}>
        {/* Product catalogue */}
        <div>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or SKU..." style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {availableProducts.map(p => {
              const inCart = cart.find(i => i.id === p.id);
              return (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${inCart ? 'rgba(79,70,229,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 16, transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontFamily: 'monospace' }}>{p.sku}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{p.category} · {p.stock} in stock</div>
                  {config.showPrices && (
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#4F46E5', marginBottom: 12 }}>CA${p.salePrice?.toFixed(2)}</div>
                  )}
                  {inCart ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => updateQty(p.id, inCart.qty - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                      <span style={{ fontSize: 14, fontWeight: 700, flex: 1, textAlign: 'center' }}>{inCart.qty}</span>
                      <button onClick={() => updateQty(p.id, inCart.qty + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#4F46E5', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(p)} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: 'rgba(79,70,229,0.2)', color: '#818CF8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <Plus size={13} style={{ display: 'inline', marginRight: 4 }} /> Add to Order
                    </button>
                  )}
                </div>
              );
            })}
            {availableProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
                <Package size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p>No products match your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Checkout panel */}
        {step === 'checkout' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, height: 'fit-content', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Your Order</h3>
              <button onClick={() => setStep('browse')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, maxHeight: 220, overflowY: 'auto' }}>
              {cart.map(i => (
                <div key={i.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>CA${i.salePrice?.toFixed(2)} × {i.qty}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#818CF8', minWidth: 70, textAlign: 'right' }}>CA${(i.salePrice * i.qty).toFixed(2)}</div>
                  <button onClick={() => updateQty(i.id, 0)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
            {config.minOrderValue && cartTotal < Number(config.minOrderValue) && (
              <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 12, color: '#F59E0B', marginBottom: 12 }}>
                Minimum order: CA${Number(config.minOrderValue).toFixed(2)} (CA${(Number(config.minOrderValue) - cartTotal).toFixed(2)} more needed)
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#818CF8' }}>
                <span>Total</span><span>CA${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Your Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'company', label: 'Company Name *', placeholder: 'Metro Ontario Inc.', type: 'text' },
                { key: 'name', label: 'Your Name *', placeholder: 'John Smith', type: 'text' },
                { key: 'email', label: 'Email Address *', placeholder: 'orders@company.com', type: 'email' },
                { key: 'phone', label: 'Phone Number', placeholder: '+1 (416) 555-0100', type: 'tel' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Order Notes</label>
                <textarea placeholder="Delivery instructions, special requirements..." value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <button onClick={submitOrder} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                <Send size={15} /> Submit Order
              </button>
              {config.requireApproval && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8 }}>Your order will be reviewed before confirmation.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
