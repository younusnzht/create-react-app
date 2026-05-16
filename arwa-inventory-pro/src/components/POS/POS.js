import React, { useState, useRef } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  ShoppingCart, CheckCircle, Printer, Tag, User, RotateCcw
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'mobile', label: 'Mobile Pay', icon: Smartphone },
];

const QUICK_DISCOUNTS = [5, 10, 15, 20];

export default function POS() {
  const { products, updateProduct, showToast } = useApp();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef(null);

  const visibleProducts = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.sku.toLowerCase().includes(q);
  }).slice(0, 20);

  const addToCart = (product) => {
    if (product.stock <= 0) { showToast('Product out of stock', 'error'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { showToast('Insufficient stock', 'warning'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > i.stock) { showToast('Insufficient stock', 'warning'); return i; }
      return { ...i, qty: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const taxAmt = cart.reduce((s, i) => s + i.salePrice * i.qty * (i.tax / 100), 0);
  const total = subtotal - discountAmt + taxAmt;
  const change = parseFloat(cashGiven) - total;

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && barcodeInput) {
      const product = products.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
      if (product) { addToCart(product); setBarcodeInput(''); }
      else showToast(`Product not found: ${barcodeInput}`, 'error');
    }
  };

  const processPayment = () => {
    if (cart.length === 0) { showToast('Cart is empty', 'warning'); return; }
    if (paymentMethod === 'cash' && cashGiven && parseFloat(cashGiven) < total) {
      showToast('Insufficient cash given', 'error'); return;
    }

    cart.forEach(item => {
      updateProduct(item.id, { stock: item.stock - item.qty });
    });

    const receiptData = {
      id: `ORD-${Date.now()}`,
      customer: customerName || 'Walk-in Customer',
      items: [...cart],
      subtotal, discountAmt, taxAmt, total,
      payment: paymentMethod,
      change: paymentMethod === 'cash' ? Math.max(0, change) : 0,
      cashGiven: parseFloat(cashGiven) || total,
      time: new Date().toLocaleString(),
    };

    setReceipt(receiptData);
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCashGiven('');
    showToast(`Payment processed! Order ${receiptData.id}`, 'success');
  };

  if (receipt) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={30} style={{ color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: 4 }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{receipt.id}</p>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Customer</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{receipt.customer}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Items</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{receipt.items.reduce((s, i) => s + i.qty, 0)}</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Subtotal</span>
              <span style={{ fontSize: 12 }}>${receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: 'var(--success)', fontSize: 12 }}>Discount</span>
                <span style={{ fontSize: 12, color: 'var(--success)' }}>-${receipt.discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Tax</span>
              <span style={{ fontSize: 12 }}>${receipt.taxAmt.toFixed(2)}</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--success)' }}>${receipt.total.toFixed(2)}</span>
            </div>
            {receipt.payment === 'cash' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cash Given</span>
                  <span style={{ fontSize: 12 }}>${receipt.cashGiven.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Change</span>
                  <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 700 }}>${receipt.change.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary w-full" onClick={() => setReceipt(null)}>
              <RotateCcw size={14} /> New Sale
            </button>
            <button className="btn btn-primary w-full" onClick={() => showToast('Receipt printed!', 'info')}>
              <Printer size={14} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      {/* Products Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Barcode scanner input */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input
            ref={barcodeRef}
            className="form-control"
            style={{ width: 200, fontFamily: 'monospace' }}
            placeholder="Scan barcode..."
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeScan}
          />
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {visibleProducts.map(p => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 14, cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: p.stock === 0 ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (p.stock > 0) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <ShoppingCart size={18} style={{ color: 'var(--primary-light)' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>${p.salePrice.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: p.stock <= p.minStock ? 'var(--warning)' : 'var(--text-muted)', marginTop: 2 }}>
                Stock: {p.stock}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
          {/* Customer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <User size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              style={{ fontSize: 12 }}
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
            {cart.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => setCart([])}>
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 10px' }}>
                <ShoppingCart size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add products to cart</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--success)' }}>${item.salePrice.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }} onClick={() => updateQty(item.id, -1)}><Minus size={11} /></button>
                  <span style={{ fontSize: 13, fontWeight: 700, width: 24, textAlign: 'center' }}>{item.qty}</span>
                  <button className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }} onClick={() => updateQty(item.id, 1)}><Plus size={11} /></button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, width: 58, textAlign: 'right' }}>
                  ${(item.salePrice * item.qty).toFixed(2)}
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }} onClick={() => removeFromCart(item.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />Quick Discount
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {QUICK_DISCOUNTS.map(d => (
                <button
                  key={d}
                  className={`btn btn-sm ${discount === d ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setDiscount(discount === d ? 0 : d)}
                >
                  {d}%
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
            {[
              { label: 'Subtotal', value: `$${subtotal.toFixed(2)}` },
              discount > 0 && { label: `Discount (${discount}%)`, value: `-$${discountAmt.toFixed(2)}`, color: 'var(--success)' },
              { label: 'Tax', value: `$${taxAmt.toFixed(2)}` },
            ].filter(Boolean).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: r.color || 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ color: r.color || 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
            <div className="divider" style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}>TOTAL</span>
              <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--success)' }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Payment Method</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
            {PAYMENT_METHODS.map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  className={`btn btn-sm ${paymentMethod === m.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flexDirection: 'column', gap: 4, height: 52, justifyContent: 'center' }}
                  onClick={() => setPaymentMethod(m.id)}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: 11 }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          {paymentMethod === 'cash' && (
            <div style={{ marginBottom: 10 }}>
              <input
                className="form-control"
                type="number"
                step="0.01"
                placeholder="Cash given by customer"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
              />
              {cashGiven && parseFloat(cashGiven) >= total && (
                <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 700, marginTop: 6, textAlign: 'center' }}>
                  Change: ${Math.max(0, change).toFixed(2)}
                </div>
              )}
            </div>
          )}
          <button
            className="btn btn-primary w-full btn-lg"
            style={{ justifyContent: 'center', fontWeight: 800 }}
            onClick={processPayment}
            disabled={cart.length === 0}
          >
            <CheckCircle size={16} /> Process Payment
          </button>
        </div>
      </div>
    </div>
  );
}
