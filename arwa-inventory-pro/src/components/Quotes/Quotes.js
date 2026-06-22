import React, { useState, useMemo } from 'react';
import { Plus, FileText, Send, CheckCircle, XCircle, ShoppingCart, Trash2, Download, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { exportQuotePDF } from '../../services/pdfExport';

const STATUS_CFG = {
  draft:     { label: 'Draft',     color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  sent:      { label: 'Sent',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  approved:  { label: 'Approved',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  rejected:  { label: 'Rejected',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  converted: { label: 'Converted', color: '#4F46E5', bg: 'rgba(79,70,229,0.12)'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {cfg.label}
    </span>
  );
}

function QuoteFormModal({ onClose, onSave, customers, products, currency }) {
  const sym = currency === 'CAD' ? 'CA$' : '$';
  const [customerId, setCustomerId] = useState('');
  const [items, setItems]           = useState([]);
  const [notes, setNotes]           = useState('');
  const [validDays, setValidDays]   = useState(30);
  const [taxRate, setTaxRate]       = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [showProducts, setShowProducts]   = useState(false);

  const customer = customers.find(c => String(c.id) === String(customerId));

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 12),
    [products, productSearch]);

  const addItem = (product) => {
    const customPrice = customer?.customPrices?.[String(product.id)];
    const price = customPrice !== undefined ? customPrice : (product.salePrice || 0);
    setItems(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, sku: product.sku || '', unitPrice: price, qty: 1 }];
    });
    setProductSearch('');
    setShowProducts(false);
  };

  const updateItem = (productId, field, value) =>
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, [field]: parseFloat(value) || value } : i));
  const removeItem = (productId) => setItems(prev => prev.filter(i => i.productId !== productId));

  const subtotal = items.reduce((s, i) => s + (i.unitPrice || 0) * (i.qty || 1), 0);
  const taxAmt   = subtotal * (taxRate / 100);
  const total    = subtotal + taxAmt;

  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];

  const handleSave = (status = 'draft') => {
    if (!customerId) { alert('Please select a customer'); return; }
    if (items.length === 0) { alert('Please add at least one product'); return; }
    onSave({ customerId, customerName: customer?.name || '', items, notes, taxRate, validUntil, status, subtotal, taxAmt, total });
    onClose();
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--bg-secondary)',borderRadius:16,padding:28,width:'100%',maxWidth:820,maxHeight:'92vh',overflow:'auto',border:'1px solid var(--border)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <div>
            <h2 style={{ margin:0,fontSize:18,fontWeight:800 }}>New Quote</h2>
            <p style={{ margin:'4px 0 0',fontSize:12,color:'var(--text-muted)' }}>Create a B2B quote for a customer</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18}/></button>
        </div>

        {/* Customer + settings row */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20 }}>
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Valid for (days)</label>
            <input className="form-control" type="number" min={1} value={validDays} onChange={e => setValidDays(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input className="form-control" type="number" min={0} max={30} step={0.5} value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {customer?.customPrices && Object.keys(customer.customPrices).length > 0 && (
          <div style={{ padding:'8px 12px',borderRadius:8,background:'rgba(79,70,229,0.1)',border:'1px solid rgba(79,70,229,0.3)',fontSize:12,color:'var(--primary-light)',marginBottom:14 }}>
            ✓ Contract pricing active for {customer.name} — custom prices will auto-apply
          </div>
        )}

        {/* Product search */}
        <div style={{ marginBottom:16,position:'relative' }}>
          <label className="form-label">Add Products</label>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }} />
            <input
              className="form-control" style={{ paddingLeft:32 }}
              placeholder="Search products by name or SKU…"
              value={productSearch}
              onChange={e => { setProductSearch(e.target.value); setShowProducts(true); }}
              onFocus={() => setShowProducts(true)}
            />
          </div>
          {showProducts && productSearch && (
            <div style={{ position:'absolute',top:'100%',left:0,right:0,background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:8,zIndex:50,maxHeight:200,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
              {filteredProducts.length === 0
                ? <div style={{ padding:12,color:'var(--text-muted)',fontSize:13 }}>No products found</div>
                : filteredProducts.map(p => (
                    <div key={p.id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)' }}
                      onMouseDown={() => addItem(p)}>
                      <div>
                        <div style={{ fontWeight:600,fontSize:13 }}>{p.name}</div>
                        <div style={{ fontSize:11,color:'var(--text-muted)' }}>{p.sku} · Stock: {p.stock}</div>
                      </div>
                      <div style={{ fontWeight:700,color:'var(--success)',fontSize:13 }}>
                        {customer?.customPrices?.[String(p.id)] !== undefined
                          ? <>{sym}{customer.customPrices[String(p.id)].toFixed(2)} <span style={{ fontSize:10,color:'var(--primary-light)' }}>contract</span></>
                          : `${sym}${(p.salePrice||0).toFixed(2)}`}
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>

        {/* Items table */}
        {items.length > 0 ? (
          <table style={{ width:'100%',borderCollapse:'collapse',marginBottom:16,fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border)' }}>
                {['Product','SKU','Qty','Unit Price','Total',''].map(h => (
                  <th key={h} style={{ padding:'8px 10px',textAlign:h==='Qty'||h==='Unit Price'||h==='Total'?'center':'left',fontSize:11,fontWeight:700,textTransform:'uppercase',color:'var(--text-muted)',letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.productId} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'8px 10px',fontWeight:600 }}>{item.name}</td>
                  <td style={{ padding:'8px 10px',fontFamily:'monospace',fontSize:11,color:'var(--text-muted)' }}>{item.sku}</td>
                  <td style={{ padding:'8px 10px',textAlign:'center' }}>
                    <input type="number" min={1} value={item.qty} onChange={e => updateItem(item.productId,'qty',e.target.value)}
                      style={{ width:56,textAlign:'center',padding:'4px 6px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-tertiary)',color:'var(--text)' }} />
                  </td>
                  <td style={{ padding:'8px 10px',textAlign:'center' }}>
                    <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={e => updateItem(item.productId,'unitPrice',e.target.value)}
                      style={{ width:80,textAlign:'center',padding:'4px 6px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-tertiary)',color:'var(--text)' }} />
                  </td>
                  <td style={{ padding:'8px 10px',textAlign:'center',fontWeight:700,color:'var(--success)' }}>{sym}{((item.unitPrice||0)*(item.qty||1)).toFixed(2)}</td>
                  <td style={{ padding:'8px 10px',textAlign:'center' }}>
                    <button className="icon-btn" onClick={() => removeItem(item.productId)}><Trash2 size={13} style={{ color:'#EF4444' }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding:'24px',textAlign:'center',color:'var(--text-muted)',fontSize:13,background:'var(--bg-tertiary)',borderRadius:10,marginBottom:16,border:'1px dashed var(--border)' }}>
            Search and add products above
          </div>
        )}

        {/* Totals + notes */}
        <div style={{ display:'flex',gap:20,marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <label className="form-label">Notes / Terms</label>
            <textarea className="form-control" rows={3} placeholder="Payment terms, delivery notes, special conditions…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div style={{ minWidth:220 }}>
            <div style={{ background:'var(--bg-tertiary)',borderRadius:10,padding:14,border:'1px solid var(--border)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13 }}><span>Subtotal</span><span style={{ fontWeight:600 }}>{sym}{subtotal.toFixed(2)}</span></div>
              {taxRate > 0 && <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13 }}><span>Tax ({taxRate}%)</span><span>{sym}{taxAmt.toFixed(2)}</span></div>}
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:800,borderTop:'1px solid var(--border)',paddingTop:8,color:'var(--primary-light)' }}><span>Total</span><span>{sym}{total.toFixed(2)}</span></div>
              <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:6 }}>Valid until: {new Date(validUntil).toLocaleDateString('en-CA')}</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={items.length === 0 || !customerId}>Save as Draft</button>
          <button className="btn btn-primary" onClick={() => handleSave('sent')} disabled={items.length === 0 || !customerId}>
            <Send size={14} style={{ marginRight:6 }} /> Send Quote
          </button>
        </div>
      </div>
    </div>
  );
}

function QuoteDetailPanel({ quote, customer, onClose, onAction, currency, businessName, taxConfig }) {
  const sym = currency === 'CAD' ? 'CA$' : '$';
  const subtotal = (quote.items || []).reduce((s, i) => s + (i.unitPrice || 0) * (i.qty || 1), 0);
  const taxAmt   = subtotal * ((quote.taxRate || 0) / 100);
  const total    = subtotal + taxAmt;

  const actions = {
    draft:     [{ label: 'Send to Customer', icon: Send,        next: 'sent',      cls: 'btn-primary' }],
    sent:      [{ label: 'Mark Approved',    icon: CheckCircle, next: 'approved',  cls: 'btn-success' },
                { label: 'Mark Rejected',    icon: XCircle,     next: 'rejected',  cls: 'btn-danger'  }],
    approved:  [{ label: 'Convert to Order', icon: ShoppingCart,next: 'converted', cls: 'btn-primary' }],
    rejected:  [],
    converted: [],
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--bg-secondary)',borderRadius:16,padding:28,width:'100%',maxWidth:680,maxHeight:'92vh',overflow:'auto',border:'1px solid var(--border)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
              <h2 style={{ margin:0,fontSize:18,fontWeight:800 }}>{quote.quoteNumber}</h2>
              <StatusBadge status={quote.status} />
            </div>
            <p style={{ fontSize:12,color:'var(--text-muted)' }}>
              Customer: <strong>{customer?.name || quote.customerName}</strong> ·
              Created: {new Date(quote.createdAt).toLocaleDateString('en-CA')} ·
              Valid until: {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-CA') : '—'}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18}/></button>
        </div>

        <table style={{ width:'100%',borderCollapse:'collapse',marginBottom:16,fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid var(--border)' }}>
              {['Product','SKU','Qty','Unit Price','Total'].map(h => (
                <th key={h} style={{ padding:'8px 10px',textAlign:h==='Qty'||h==='Unit Price'||h==='Total'?'right':'left',fontSize:11,fontWeight:700,textTransform:'uppercase',color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(quote.items || []).map((item, i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'9px 10px',fontWeight:600 }}>{item.name}</td>
                <td style={{ padding:'9px 10px',fontFamily:'monospace',fontSize:11,color:'var(--text-muted)' }}>{item.sku || '—'}</td>
                <td style={{ padding:'9px 10px',textAlign:'right' }}>{item.qty}</td>
                <td style={{ padding:'9px 10px',textAlign:'right' }}>{sym}{(item.unitPrice||0).toFixed(2)}</td>
                <td style={{ padding:'9px 10px',textAlign:'right',fontWeight:700,color:'var(--success)' }}>{sym}{((item.unitPrice||0)*(item.qty||1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:16 }}>
          <div style={{ background:'var(--bg-tertiary)',borderRadius:10,padding:14,minWidth:200,border:'1px solid var(--border)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13 }}><span>Subtotal</span><span style={{ fontWeight:600 }}>{sym}{subtotal.toFixed(2)}</span></div>
            {quote.taxRate > 0 && <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13 }}><span>Tax ({quote.taxRate}%)</span><span>{sym}{taxAmt.toFixed(2)}</span></div>}
            <div style={{ display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:15,borderTop:'1px solid var(--border)',paddingTop:8,color:'var(--primary-light)' }}><span>Total</span><span>{sym}{total.toFixed(2)}</span></div>
          </div>
        </div>

        {quote.notes && (
          <div style={{ padding:12,borderRadius:8,background:'var(--bg-tertiary)',border:'1px solid var(--border)',marginBottom:16,fontSize:13 }}>
            <div style={{ fontWeight:700,fontSize:11,textTransform:'uppercase',color:'var(--text-muted)',marginBottom:4 }}>Notes</div>
            {quote.notes}
          </div>
        )}

        <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
          <button className="btn btn-secondary" onClick={() => exportQuotePDF(quote, customer, businessName, taxConfig)}>
            <Download size={14} style={{ marginRight:6 }} /> Export PDF
          </button>
          {(actions[quote.status] || []).map(a => (
            <button key={a.next} className={`btn ${a.cls}`} onClick={() => { onAction(quote.id, a.next); onClose(); }}>
              <a.icon size={14} style={{ marginRight:6 }} /> {a.label}
            </button>
          ))}
          <button className="btn btn-secondary" style={{ marginLeft:'auto' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Quotes() {
  const { quotes, addQuote, updateQuote, deleteQuote, addOrder,
          customers, products, currency, businessName, taxConfig, showToast } = useApp();

  const sym = currency === 'CAD' ? 'CA$' : '$';
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [expandedId, setExpandedId]     = useState(null);

  const filtered = useMemo(() =>
    quotes.filter(q =>
      (statusFilter === 'all' || q.status === statusFilter) &&
      (!search || q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
       q.customerName?.toLowerCase().includes(search.toLowerCase()))
    ), [quotes, statusFilter, search]);

  const stats = useMemo(() => ({
    total:     quotes.length,
    draft:     quotes.filter(q => q.status === 'draft').length,
    sent:      quotes.filter(q => q.status === 'sent').length,
    approved:  quotes.filter(q => q.status === 'approved').length,
    converted: quotes.filter(q => q.status === 'converted').length,
    value:     quotes.filter(q => ['sent','approved'].includes(q.status)).reduce((s, q) => s + (q.total || 0), 0),
  }), [quotes]);

  const handleAction = (id, nextStatus) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;
    if (nextStatus === 'converted') {
      addOrder({
        id: `ORD-${Date.now()}`,
        customer: quote.customerName,
        customerId: quote.customerId,
        items: quote.items,
        subtotal: quote.subtotal || 0,
        total: quote.total || 0,
        status: 'completed',
        source: 'quote',
        quoteRef: quote.quoteNumber,
        date: new Date().toISOString(),
      });
      showToast(`Quote ${quote.quoteNumber} converted to order`, 'success');
    }
    updateQuote(id, { status: nextStatus });
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:900,margin:0 }}>Quotes</h1>
          <p style={{ fontSize:13,color:'var(--text-muted)',marginTop:4 }}>Create, send, and convert B2B quotes to orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} style={{ marginRight:6 }} /> New Quote
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:24 }}>
        {[
          { label:'Total Quotes', value: stats.total,     color:'#4F46E5' },
          { label:'Draft',        value: stats.draft,     color:'#6B7280' },
          { label:'Sent',         value: stats.sent,      color:'#F59E0B' },
          { label:'Approved',     value: stats.approved,  color:'#10B981' },
          { label:'Converted',    value: stats.converted, color:'#4F46E5' },
          { label:'Pipeline Value',value:`${sym}${stats.value.toFixed(0)}`, color:'#10B981' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:14,textAlign:'center' }}>
            <div style={{ fontSize:22,fontWeight:900,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11,color:'var(--text-muted)',marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft:32 }} placeholder="Search quote # or customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tabs">
          {['all','draft','sent','approved','rejected','converted'].map(s => (
            <button key={s} className={`tab ${statusFilter===s?'active':''}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quote list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding:48,textAlign:'center' }}>
          <FileText size={40} style={{ color:'var(--text-muted)',margin:'0 auto 16px',display:'block' }} />
          <h3 style={{ fontWeight:700,marginBottom:8 }}>No quotes yet</h3>
          <p style={{ color:'var(--text-muted)',marginBottom:20,fontSize:13 }}>Create your first B2B quote to get started</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} style={{ marginRight:6 }} /> New Quote</button>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {filtered.map(q => {
            const customer = customers.find(c => String(c.id) === String(q.customerId));
            const isExpanded = expandedId === q.id;
            const total = q.total || (q.items||[]).reduce((s,i)=>s+(i.unitPrice||0)*(i.qty||1),0);
            return (
              <div key={q.id} className="card" style={{ padding:0,overflow:'hidden' }}>
                <div style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 18px',cursor:'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}>
                  <div style={{ width:40,height:40,borderRadius:10,background:'rgba(79,70,229,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <FileText size={18} style={{ color:'var(--primary-light)' }} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:2 }}>
                      <span style={{ fontWeight:800,fontSize:14 }}>{q.quoteNumber}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div style={{ fontSize:12,color:'var(--text-muted)' }}>
                      {customer?.name || q.customerName} · {q.items?.length || 0} items · Valid until {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-CA') : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontWeight:800,fontSize:15,color:'var(--success)' }}>{sym}{total.toFixed(2)}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>{new Date(q.createdAt).toLocaleDateString('en-CA')}</div>
                  </div>
                  <div style={{ display:'flex',gap:6,marginLeft:8 }}>
                    <button className="icon-btn" title="View / Actions" onClick={e => { e.stopPropagation(); setSelectedQuote(q); }}>
                      <FileText size={15} />
                    </button>
                    <button className="icon-btn" title="Export PDF" onClick={e => { e.stopPropagation(); exportQuotePDF(q, customer, businessName, taxConfig); }}>
                      <Download size={15} />
                    </button>
                    {q.status === 'draft' && (
                      <button className="icon-btn" title="Delete" onClick={e => { e.stopPropagation(); deleteQuote(q.id); }}>
                        <Trash2 size={15} style={{ color:'#EF4444' }} />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={15} style={{ color:'var(--text-muted)' }} /> : <ChevronDown size={15} style={{ color:'var(--text-muted)' }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop:'1px solid var(--border)',padding:'12px 18px',background:'var(--bg-tertiary)' }}>
                    <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                      <thead>
                        <tr>
                          {['Product','Qty','Unit Price','Total'].map(h => (
                            <th key={h} style={{ padding:'5px 8px',textAlign:h==='Product'?'left':'right',fontWeight:700,textTransform:'uppercase',fontSize:10,color:'var(--text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(q.items||[]).map((item,i) => (
                          <tr key={i}>
                            <td style={{ padding:'5px 8px' }}>{item.name}</td>
                            <td style={{ padding:'5px 8px',textAlign:'right' }}>{item.qty}</td>
                            <td style={{ padding:'5px 8px',textAlign:'right' }}>{sym}{(item.unitPrice||0).toFixed(2)}</td>
                            <td style={{ padding:'5px 8px',textAlign:'right',fontWeight:700 }}>{sym}{((item.unitPrice||0)*(item.qty||1)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display:'flex',gap:8,marginTop:10,flexWrap:'wrap' }}>
                      {(({ draft:[{label:'Send to Customer',icon:Send,next:'sent',cls:'btn-primary'}], sent:[{label:'Mark Approved',icon:CheckCircle,next:'approved',cls:'btn-success'},{label:'Mark Rejected',icon:XCircle,next:'rejected',cls:'btn-danger'}], approved:[{label:'Convert to Order',icon:ShoppingCart,next:'converted',cls:'btn-primary'}] })[q.status]||[]).map(a => (
                        <button key={a.next} className={`btn btn-sm ${a.cls}`} onClick={() => handleAction(q.id, a.next)}>
                          <a.icon size={12} style={{ marginRight:4 }} /> {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <QuoteFormModal
          onClose={() => setShowForm(false)}
          onSave={addQuote}
          customers={customers}
          products={products}
          currency={currency}
        />
      )}

      {selectedQuote && (
        <QuoteDetailPanel
          quote={selectedQuote}
          customer={customers.find(c => String(c.id) === String(selectedQuote.customerId))}
          onClose={() => setSelectedQuote(null)}
          onAction={handleAction}
          currency={currency}
          businessName={businessName}
          taxConfig={taxConfig}
        />
      )}
    </div>
  );
}
