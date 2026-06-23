import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Minus, Trash2,
  ShoppingCart, CheckCircle, Printer, Tag, User, RotateCcw, Clock, Package,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const QUICK_DISCOUNTS = [5, 10, 15, 20];

const getCurrencySymbol = (code) => {
  const symbols = {
    USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥',
    INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼', CNY: '¥', KRW: '₩',
    BRL: 'R$', MXN: '$', ZAR: 'R', CHF: 'Fr', SEK: 'kr', NOK: 'kr',
    DKK: 'kr', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', THB: '฿', TRY: '₺',
    RUB: '₽', NGN: '₦', GHS: '₵', KES: 'KSh', EGP: 'E£', MAD: 'MAD',
    QAR: 'QR', OMR: 'OMR', KWD: 'KD', BHD: 'BD', JOD: 'JD',
  };
  return symbols[code] || code + ' ';
};

export default function POS() {
  const { products, updateProduct, addOrder, showToast, currentUser, currency, orders, calcOrderTax, addAuditEntry, taxConfig, customers, updateCustomer, subscription } = useApp();
  const isRestaurant = subscription?.businessType === 'restaurant';

  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'return'
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState([{ method: 'cash', amount: '' }]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef(null);

  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldPanel, setShowHeldPanel] = useState(false);

  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnError, setReturnError] = useState('');

  const sym = getCurrencySymbol(currency || 'USD');

  const visibleProducts = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.sku.toLowerCase().includes(q);
  }).slice(0, 20);

  const addToCart = (product) => {
    const currentProduct = products.find(p => p.id === product.id);
    if (!currentProduct || currentProduct.stock <= 0) {
      showToast('Out of stock', 'warning');
      return;
    }
    // Apply customer-specific contract price if set
    const customPrice = selectedCustomer?.customPrices?.[String(product.id)];
    const priceToUse = customPrice !== undefined ? customPrice : product.salePrice;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const maxQty = currentProduct.stock;
        if (existing.qty >= maxQty) { showToast('Insufficient stock', 'warning'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, salePrice: priceToUse, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return null;
      const currentProduct = products.find(p => p.id === id);
      const maxStock = currentProduct ? currentProduct.stock : i.stock;
      if (newQty > maxStock) { showToast('Insufficient stock', 'warning'); return i; }
      return { ...i, qty: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const taxAmt = cart.reduce((s, i) => s + i.salePrice * i.qty * (i.tax / 100), 0);
  const taxedTotal = subtotal - discountAmt + taxAmt;

  // Loyalty points
  const selectedCustomer = customers.find(c => String(c.id) === String(selectedCustomerId));
  const availablePoints = selectedCustomer ? (selectedCustomer.loyaltyPoints || 0) : 0;
  const pointsDiscount = pointsToRedeem / 100;
  const total = Math.max(0, taxedTotal - pointsDiscount);

  // Auto-fill payment amount when cart total changes (single-payment mode only)
  useEffect(() => {
    if (payments.length === 1) {
      setPayments([{ method: payments[0].method, amount: total > 0 ? total.toFixed(2) : '' }]);
    }
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  // Split payments
  const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const remaining = total - totalPaid;
  const isPaymentComplete = remaining <= 0.01;


  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && barcodeInput) {
      const product = products.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
      if (product) { addToCart(product); setBarcodeInput(''); }
      else showToast(`Product not found: ${barcodeInput}`, 'error');
    }
  };

  const processPayment = () => {
    if (cart.length === 0) { showToast('Cart is empty', 'warning'); return; }

    if (!isPaymentComplete) {
      showToast(`Payment incomplete — ${sym}${remaining.toFixed(2)} still remaining`, 'error');
      return;
    }

    // Validate cash entries: if any payment entry is cash, check it has an amount
    for (const pay of payments) {
      if (!pay.amount || parseFloat(pay.amount) <= 0) {
        showToast('Please enter an amount for each payment entry', 'error');
        return;
      }
    }

    for (const item of cart) {
      const currentProduct = products.find(p => p.id === item.id);
      if (!currentProduct) {
        showToast(`Product not found: ${item.name}`, 'error');
        return;
      }
      if (currentProduct.stock - item.qty < 0) {
        showToast(`Insufficient stock for ${item.name}`, 'warning');
        return;
      }
    }

    // All checks passed — commit stock updates
    cart.forEach(item => {
      const currentProduct = products.find(p => p.id === item.id);
      if (!currentProduct) return;
      const newStock = currentProduct.stock - item.qty;
      updateProduct(item.id, { stock: newStock });
    });

    const orderId = `POS-${Date.now()}`;

    const cartSubtotal = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
    const taxBreakdown = calcOrderTax(cartSubtotal);

    const primaryMethod = payments[0]?.method || 'cash';
    const changeAmt = Math.max(0, totalPaid - total);

    const receiptData = {
      id: orderId,
      customer: selectedCustomer?.name || 'Walk-in Customer',
      items: [...cart],
      subtotal,
      discountAmt,
      taxAmt,
      total,
      payment: primaryMethod,
      payments: payments.filter(p => parseFloat(p.amount) > 0),
      change: changeAmt,
      cashGiven: totalPaid,
      pointsDiscount,
      pointsToRedeem,
      time: new Date().toLocaleString(),
    };

    const newOrder = {
      id: orderId,
      customer: selectedCustomer?.name || 'Walk-in Customer',
      items: cart.length,
      total: parseFloat(total.toFixed(2)),
      subtotal: parseFloat(cartSubtotal.toFixed(2)),
      taxBreakdown,
      status: 'completed',
      date: new Date().toISOString(),
      payment: primaryMethod,
      payments: payments.filter(p => parseFloat(p.amount) > 0),
      cashier: currentUser?.name || 'Cashier',
      platform: 'pos',
      loyaltyPointsEarned: Math.floor(total),
      loyaltyPointsRedeemed: pointsToRedeem,
    };
    addOrder(newOrder);
    addAuditEntry('POS_SALE', { orderId: newOrder.id, total: newOrder.total, tax: taxBreakdown.total });

    // Update customer loyalty points
    if (selectedCustomer) {
      const earned = Math.floor(total);
      const newPoints = Math.max(0, (availablePoints - pointsToRedeem) + earned);
      updateCustomer(selectedCustomer.id, { loyaltyPoints: newPoints });
    }

    setReceipt(receiptData);
    setCart([]);
    setDiscount(0);
    setSelectedCustomerId('');
    setPointsToRedeem(0);
    setPayments([{ method: 'cash', amount: '' }]);
    showToast(`Payment processed! Order ${orderId}`, 'success');
  };

  const printerConfig = {
    paperWidth: localStorage.getItem('arwa_printerPaperWidth') || '80mm',
    businessName: localStorage.getItem('arwa_businessName')?.replace(/^"|"$/g,'') || 'Arwa Enterprises',
    businessAddress: '',
    gstNumber: (() => { try { return JSON.parse(localStorage.getItem('arwa_taxConfig') || '{}').gstNumber || ''; } catch(e) { return ''; }})(),
  };

  const handlePrintReceipt = async () => {
    if (!receipt) return;
    const { printReceipt: doPrint } = await import('../../services/thermalPrinter');
    await doPrint({
      ...receipt,
      receiptId: receipt.id,
      businessName: printerConfig.businessName,
      businessAddress: printerConfig.businessAddress,
      gstNumber: printerConfig.gstNumber,
      date: new Date().toLocaleString(),
      sym,
    }, printerConfig);
  };

  const holdSale = () => {
    if (cart.length === 0) { showToast('Cart is empty', 'warning'); return; }
    const label = `Sale – ${new Date().toLocaleTimeString()}`;
    setHeldCarts(prev => [...prev, { label, cart: [...cart], discount }]);
    setCart([]);
    setDiscount(0);
    setShowHeldPanel(false);
    showToast('Sale held', 'info');
  };

  const restoreHeldCart = (index) => {
    const held = heldCarts[index];
    if (!held) return;
    setCart(held.cart);
    setDiscount(held.discount);
    setHeldCarts(prev => prev.filter((_, i) => i !== index));
    setShowHeldPanel(false);
    showToast('Sale restored', 'success');
  };

  const lookupReturnOrder = () => {
    setReturnError('');
    setReturnOrder(null);
    setReturnItems([]);
    if (!returnOrderId.trim()) { setReturnError('Enter an order ID'); return; }
    const found = orders.find(o => o.id === returnOrderId.trim());
    if (!found) { setReturnError(`Order "${returnOrderId}" not found`); return; }
    // POS orders store items array; mock orders only store item count — handle both
    if (!found.items || typeof found.items === 'number') {
      setReturnError('Item details not available for this order');
      return;
    }
    setReturnOrder(found);
    setReturnItems(found.items.map(i => ({ ...i, returnQty: 0 })));
  };

  const updateReturnQty = (id, delta) => {
    setReturnItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(0, Math.min(i.qty, i.returnQty + delta));
      return { ...i, returnQty: newQty };
    }));
  };

  const processReturn = () => {
    const toReturn = returnItems.filter(i => i.returnQty > 0);
    if (toReturn.length === 0) { showToast('Select items to return', 'warning'); return; }

    const refundTotal = toReturn.reduce((s, i) => s + i.salePrice * i.returnQty, 0);

    toReturn.forEach(item => {
      const currentProduct = products.find(p => p.id === item.id);
      if (currentProduct) {
        updateProduct(item.id, { stock: currentProduct.stock + item.returnQty });
      }
    });

    addOrder({
      id: `RTN-${Date.now()}`,
      customer: returnOrder.customer || 'Walk-in Customer',
      items: toReturn.length,
      total: -parseFloat(refundTotal.toFixed(2)),
      status: 'refunded',
      date: new Date().toISOString(),
      payment: returnOrder.payment || 'cash',
      cashier: currentUser?.name || 'Cashier',
      platform: 'pos',
      refundFor: returnOrder.id,
    });

    showToast(`Refund of ${sym}${refundTotal.toFixed(2)} processed`, 'success');
    setReturnOrderId('');
    setReturnOrder(null);
    setReturnItems([]);
    setReturnError('');
  };

  // ─── Receipt screen ───────────────────────────────────────────────────────
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
              <span style={{ fontSize: 12 }}>{sym}{receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ color: 'var(--success)', fontSize: 12 }}>Discount</span>
                <span style={{ fontSize: 12, color: 'var(--success)' }}>-{sym}{receipt.discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Tax</span>
              <span style={{ fontSize: 12 }}>{sym}{receipt.taxAmt.toFixed(2)}</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>TOTAL</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--success)' }}>{sym}{receipt.total.toFixed(2)}</span>
            </div>
            {receipt.pointsDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#10B981', fontSize: 12 }}>Points Redeemed ({receipt.pointsToRedeem} pts)</span>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>-{sym}{receipt.pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            {receipt.payments && receipt.payments.length > 1 ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Split Payment:</div>
                {receipt.payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'capitalize' }}>{p.method}</span>
                    <span style={{ fontSize: 12 }}>{sym}{parseFloat(p.amount).toFixed(2)}</span>
                  </div>
                ))}
                {receipt.change > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Change</span>
                    <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 700 }}>{sym}{receipt.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : receipt.payment === 'cash' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cash Given</span>
                  <span style={{ fontSize: 12 }}>{sym}{receipt.cashGiven.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Change</span>
                  <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 700 }}>{sym}{receipt.change.toFixed(2)}</span>
                </div>
              </>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary w-full" onClick={() => setReceipt(null)}>
              <RotateCcw size={14} /> New Sale
            </button>
            <button className="btn btn-primary w-full" onClick={handlePrintReceipt}>
              <Printer size={14} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tab bar ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 14 }}>
        {[
          { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
          { id: 'return', label: 'Return / Refund', icon: Package },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -2, cursor: 'pointer', fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 13, transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── POS Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'pos' && (
        <div className="pos-layout">
          {/* Products Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: isRestaurant ? 'repeat(auto-fill, minmax(180px, 1fr))' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              {visibleProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: isRestaurant ? 0 : 14, cursor: 'pointer',
                    transition: 'all 0.15s', overflow: 'hidden',
                    opacity: p.stock === 0 ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (p.stock > 0) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {isRestaurant ? (
                    <>
                      <div style={{ width: '100%', height: 110, background: p.image ? 'transparent' : 'rgba(79,70,229,0.08)', position: 'relative', overflow: 'hidden' }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽️</div>
                        }
                        {p.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>SOLD OUT</div>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)' }}>{sym}{p.salePrice.toFixed(2)}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: p.image ? 'transparent' : 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden', flexShrink: 0 }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                          : <ShoppingCart size={18} style={{ color: 'var(--primary-light)' }} />
                        }
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.name}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>{sym}{p.salePrice.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: p.stock <= p.minStock ? 'var(--warning)' : 'var(--text-muted)', marginTop: 2 }}>
                        Stock: {p.stock}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cart Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
              {/* Customer Selector */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <User size={14} style={{ color: 'var(--text-muted)' }} />
                  <select
                    className="form-control"
                    style={{ fontSize: 12, flex: 1 }}
                    value={selectedCustomerId}
                    onChange={e => { setSelectedCustomerId(e.target.value); setPointsToRedeem(0); }}
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints || 0} pts)</option>
                    ))}
                  </select>
                </div>
                {/* Loyalty Points Redemption */}
                {selectedCustomer && availablePoints > 0 && (
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Loyalty Points: {availablePoints} pts</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>100 pts = {sym}1.00 off</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="form-control"
                        type="number"
                        min="0"
                        max={Math.min(availablePoints, Math.floor(taxedTotal * 100))}
                        step="100"
                        placeholder="Points to redeem"
                        value={pointsToRedeem || ''}
                        onChange={e => setPointsToRedeem(Math.min(parseInt(e.target.value) || 0, availablePoints))}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        = {sym}{(pointsToRedeem / 100).toFixed(2)} off
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Cart ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowHeldPanel(v => !v)}
                      title="Held Sales"
                    >
                      <Clock size={12} />
                      {heldCarts.length > 0 && (
                        <span style={{ marginLeft: 3, background: 'var(--primary)', color: '#fff', borderRadius: 9, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                          {heldCarts.length}
                        </span>
                      )}
                    </button>
                    {showHeldPanel && (
                      <div style={{
                        position: 'absolute', top: '110%', right: 0, zIndex: 100,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 8, minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', padding: 8,
                      }}>
                        {heldCarts.length === 0 ? (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 8px' }}>No held sales</p>
                        ) : heldCarts.map((h, idx) => (
                          <button
                            key={idx}
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4, fontSize: 11 }}
                            onClick={() => restoreHeldCart(idx)}
                          >
                            <RotateCcw size={10} /> {h.label} ({h.cart.length} items)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={holdSale} title="Hold Sale">
                    Hold
                  </button>
                  {cart.length > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={() => setCart([])}>
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
                </div>
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
                      <div style={{ fontSize: 11, color: 'var(--success)' }}>{sym}{item.salePrice.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }} onClick={() => updateQty(item.id, -1)}><Minus size={11} /></button>
                      <span style={{ fontSize: 13, fontWeight: 700, width: 24, textAlign: 'center' }}>{item.qty}</span>
                      <button className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }} onClick={() => updateQty(item.id, 1)}><Plus size={11} /></button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, width: 64, textAlign: 'right' }}>
                      {sym}{(item.salePrice * item.qty).toFixed(2)}
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
                  { label: 'Subtotal', value: `${sym}${subtotal.toFixed(2)}` },
                  discount > 0 && { label: `Discount (${discount}%)`, value: `-${sym}${discountAmt.toFixed(2)}`, color: 'var(--success)' },
                  { label: 'Tax', value: `${sym}${taxAmt.toFixed(2)}` },
                  pointsDiscount > 0 && { label: `Points Redemption (${pointsToRedeem} pts)`, value: `-${sym}${pointsDiscount.toFixed(2)}`, color: '#10B981' },
                ].filter(Boolean).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: r.color || 'var(--text-muted)' }}>{r.label}</span>
                    <span style={{ color: r.color || 'var(--text-primary)', fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
                {taxConfig && taxConfig.province && (() => {
                  const cartSubtotalDisplay = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
                  const tax = calcOrderTax(cartSubtotalDisplay);
                  return tax.total > 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {tax.GST > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST ({tax.province.GST}%)</span><span>{sym}{tax.GST.toFixed(2)}</span></div>}
                      {tax.HST > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>HST ({tax.province.HST}%)</span><span>{sym}{tax.HST.toFixed(2)}</span></div>}
                      {tax.PST > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PST ({tax.province.PST}%)</span><span>{sym}{tax.PST.toFixed(2)}</span></div>}
                      {tax.QST > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>QST ({tax.province.QST.toFixed(3)}%)</span><span>{sym}{tax.QST.toFixed(2)}</span></div>}
                    </div>
                  ) : null;
                })()}
                <div className="divider" style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>TOTAL</span>
                  <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--success)' }}>{sym}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card" style={{ padding: 16 }}>
              {/* Split Payment UI */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>Payment</p>
                  <button
                    style={{ fontSize: 11, color: 'var(--primary-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setPayments(p => [...p, { method: 'cash', amount: '' }])}
                  >+ Split</button>
                </div>
                {payments.map((pay, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <select
                      className="form-control"
                      style={{ flex: 1, fontSize: 12 }}
                      value={pay.method}
                      onChange={e => setPayments(p => p.map((x, j) => j === i ? { ...x, method: e.target.value } : x))}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mobile">Mobile Pay</option>
                      <option value="credit">Store Credit</option>
                    </select>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      style={{ width: 90, fontSize: 12 }}
                      value={pay.amount}
                      onChange={e => setPayments(p => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                    />
                    {payments.length > 1 && (
                      <button
                        onClick={() => setPayments(p => p.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', fontSize: 16, lineHeight: 1 }}
                      >×</button>
                    )}
                  </div>
                ))}
                {/* Remaining / change indicator */}
                {cart.length > 0 && (() => {
                  if (remaining > 0.01) {
                    return (
                      <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, textAlign: 'right' }}>
                        Remaining: {sym}{remaining.toFixed(2)}
                      </div>
                    );
                  } else if (remaining < -0.01) {
                    return (
                      <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, textAlign: 'right' }}>
                        Change due: {sym}{Math.abs(remaining).toFixed(2)}
                      </div>
                    );
                  } else {
                    return (
                      <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, textAlign: 'right' }}>✓ Payment complete</div>
                    );
                  }
                })()}
              </div>
              <button
                className="btn btn-primary w-full btn-lg"
                style={{ justifyContent: 'center', fontWeight: 800 }}
                onClick={processPayment}
                disabled={cart.length === 0 || !isPaymentComplete}
              >
                <CheckCircle size={16} /> Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Return / Refund Tab ───────────────────────────────────── */}
      {activeTab === 'return' && (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Return / Refund</h3>

            {/* Order ID lookup */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                className="form-control"
                placeholder="Enter Order ID (e.g. POS-1234567890)"
                value={returnOrderId}
                onChange={e => { setReturnOrderId(e.target.value); setReturnError(''); }}
                onKeyDown={e => e.key === 'Enter' && lookupReturnOrder()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={lookupReturnOrder}>
                <Search size={14} /> Lookup
              </button>
            </div>

            {returnError && (
              <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{returnError}</div>
            )}

            {returnOrder && returnItems.length > 0 && (
              <>
                <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                  Order <strong>{returnOrder.id}</strong> — {returnOrder.customer}
                </div>

                {returnItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {sym}{item.salePrice.toFixed(2)} × {item.qty} purchased
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }} onClick={() => updateReturnQty(item.id, -1)} disabled={item.returnQty === 0}><Minus size={11} /></button>
                      <span style={{ fontSize: 13, fontWeight: 700, width: 28, textAlign: 'center' }}>{item.returnQty}</span>
                      <button className="btn btn-secondary btn-sm" style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }} onClick={() => updateReturnQty(item.id, 1)} disabled={item.returnQty >= item.qty}><Plus size={11} /></button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, width: 70, textAlign: 'right', color: item.returnQty > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                      {item.returnQty > 0 ? `-${sym}${(item.salePrice * item.returnQty).toFixed(2)}` : '—'}
                    </div>
                  </div>
                ))}

                {/* Refund total */}
                {returnItems.some(i => i.returnQty > 0) && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Refund Total</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--error)' }}>
                      -{sym}{returnItems.reduce((s, i) => s + i.salePrice * i.returnQty, 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <button
                  className="btn btn-danger w-full btn-lg"
                  style={{ marginTop: 14, justifyContent: 'center', fontWeight: 800 }}
                  onClick={processReturn}
                  disabled={!returnItems.some(i => i.returnQty > 0)}
                >
                  <RotateCcw size={16} /> Confirm Return
                </button>
              </>
            )}

            {returnOrder && returnItems.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No returnable items found on this order.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
