import React, { useState } from 'react';
import { Users, Plus, Search, X, Edit2, Trash2, Star, Tag } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const getCurrencySymbol = (code) => {
  const s = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥', INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼' };
  return s[code] || code + ' ';
};

const BLANK_FORM = { name: '', email: '', phone: '', loyaltyPoints: 0, gstExempt: false, exemptionCertificate: '' };

export default function CustomerManagement() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, currency, products } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [customPrices, setCustomPrices] = useState({});
  const [priceSearch, setPriceSearch] = useState('');

  const sym = getCurrencySymbol(currency);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    return e;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, email: c.email, phone: c.phone || '', loyaltyPoints: c.loyaltyPoints || 0, gstExempt: c.gstExempt || false, exemptionCertificate: c.exemptionCertificate || '' });
    setCustomPrices(c.customPrices || {});
    setErrors({});
    setShowPricing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(BLANK_FORM);
    setCustomPrices({});
    setShowPricing(false);
    setPriceSearch('');
    setErrors({});
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editingId) {
      updateCustomer(editingId, { name: form.name, email: form.email, phone: form.phone, loyaltyPoints: Number(form.loyaltyPoints) || 0, gstExempt: form.gstExempt, exemptionCertificate: form.exemptionCertificate, customPrices });
    } else {
      addCustomer({
        ...form,
        loyaltyPoints: Number(form.loyaltyPoints) || 0,
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: new Date().toISOString().split('T')[0],
      });
    }
    closeModal();
  };

  const handleDelete = (c) => setConfirmDelete(c);

  const confirmDeleteCustomer = () => {
    if (confirmDelete) {
      deleteCustomer(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const tierBadge = (spent) => {
    if (spent >= 3000) return { label: 'Gold', color: '#D97706', bg: 'rgba(217,119,6,0.12)' };
    if (spent >= 1000) return { label: 'Silver', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };
    return { label: 'Bronze', color: '#92400E', bg: 'rgba(146,64,14,0.1)' };
  };

  const totalSpend = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.totalOrders || 0), 0);
  const goldCustomers = customers.filter(c => (c.totalSpent || 0) >= 3000).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customer Management</h1>
          <p>{customers.length} customer{customers.length !== 1 ? 's' : ''} · {sym}{totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} lifetime revenue</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} /> Add Customer
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: '#4F46E5' },
          { label: 'Total Revenue', value: `${sym}${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: '#10B981' },
          { label: 'Total Orders', value: totalOrders, color: '#06B6D4' },
          { label: 'Gold Members', value: goldCustomers, color: '#D97706' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', flex: 1, maxWidth: 340,
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%', fontFamily: 'var(--font-family)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} of {customers.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={26} /></div>
            <h3>{search ? 'No customers match your search' : 'No customers yet'}</h3>
            <p style={{ fontSize: 13 }}>{search ? 'Try a different search term' : 'Add your first customer to get started'}</p>
            {!search && <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 12 }}><Plus size={14} /> Add Customer</button>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Visit</th>
                  <th>Loyalty</th>
                  <th>Tier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const tier = tierBadge(c.totalSpent || 0);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>{c.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {c.name}
                              {c.gstExempt && (
                                <span style={{ background: 'rgba(249,115,22,0.12)', color: '#EA580C', padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Tax Exempt</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.email}</div>
                        {c.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.totalOrders}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{sym}{(c.totalSpent || 0).toFixed(2)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.lastVisit || '—'}</td>
                      <td>
                        <span style={{
                          background: 'rgba(79,70,229,0.12)', color: 'var(--primary-light)',
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <Star size={9} fill="currentColor" />
                          {(c.loyaltyPoints || 0).toLocaleString()} pts
                        </span>
                      </td>
                      <td>
                        <span style={{ background: tier.bg, color: tier.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {tier.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(c)}
                            title="Edit customer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(c)}
                            title="Delete customer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="icon-btn" onClick={closeModal}><X size={16} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="Customer name"
                style={{ borderColor: errors.name ? 'var(--danger)' : undefined }}
              />
              {errors.name && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                placeholder="customer@email.com"
                style={{ borderColor: errors.email ? 'var(--danger)' : undefined }}
              />
              {errors.email && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                placeholder="+1-555-0000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Loyalty Points</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.loyaltyPoints}
                onChange={e => setField('loyaltyPoints', e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">GST/HST Exempt</label>
              <select className="form-control" value={form.gstExempt || false} onChange={e => setField('gstExempt', e.target.value === 'true')}>
                <option value="false">Taxable (default)</option>
                <option value="true">Exempt — has exemption certificate</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Exemption Certificate #</label>
              <input className="form-control" placeholder="e.g. First Nations Band #, diplomatic, etc."
                value={form.exemptionCertificate || ''}
                onChange={e => setField('exemptionCertificate', e.target.value)}
                disabled={!form.gstExempt} />
            </div>

            {/* Contract Pricing — only visible when editing */}
            {editingId && (
              <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'var(--bg-tertiary)',border:'none',cursor:'pointer',color:'var(--text)',fontWeight:700,fontSize:13 }}
                  onClick={() => setShowPricing(v => !v)}
                >
                  <span style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <Tag size={14} style={{ color:'var(--primary-light)' }} />
                    Contract Pricing
                    {Object.keys(customPrices).length > 0 && (
                      <span style={{ fontSize:11,padding:'2px 8px',borderRadius:10,background:'rgba(79,70,229,0.15)',color:'var(--primary-light)',fontWeight:700 }}>
                        {Object.keys(customPrices).length} custom price{Object.keys(customPrices).length !== 1 ? 's' : ''} set
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize:11,color:'var(--text-muted)' }}>{showPricing ? '▲ Hide' : '▼ Set custom prices per product'}</span>
                </button>

                {showPricing && (
                  <div style={{ padding:14 }}>
                    <p style={{ fontSize:12,color:'var(--text-muted)',marginBottom:10 }}>
                      Set a contract price for any product. Leave blank to use the standard sale price. These prices auto-apply in POS and Quotes.
                    </p>
                    <input className="form-control" placeholder="Search products…" value={priceSearch}
                      onChange={e => setPriceSearch(e.target.value)} style={{ marginBottom:10 }} />
                    <div style={{ maxHeight:240,overflowY:'auto',display:'flex',flexDirection:'column',gap:6 }}>
                      {products
                        .filter(p => !priceSearch || p.name?.toLowerCase().includes(priceSearch.toLowerCase()) || p.sku?.toLowerCase().includes(priceSearch.toLowerCase()))
                        .slice(0, 30)
                        .map(p => (
                          <div key={p.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,background:'var(--bg-tertiary)',border:`1px solid ${customPrices[String(p.id)] !== undefined ? 'var(--primary)' : 'var(--border)'}` }}>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ fontWeight:600,fontSize:12,truncate:'ellipsis' }}>{p.name}</div>
                              <div style={{ fontSize:11,color:'var(--text-muted)' }}>Standard: {sym}{(p.salePrice||0).toFixed(2)}</div>
                            </div>
                            <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
                              <span style={{ fontSize:11,color:'var(--text-muted)' }}>{sym}</span>
                              <input
                                type="number" min={0} step="0.01" placeholder="contract price"
                                value={customPrices[String(p.id)] !== undefined ? customPrices[String(p.id)] : ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setCustomPrices(prev => {
                                    const next = { ...prev };
                                    if (val === '' || val === null) { delete next[String(p.id)]; }
                                    else { next[String(p.id)] = parseFloat(val); }
                                    return next;
                                  });
                                }}
                                style={{ width:90,padding:'4px 8px',borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',fontSize:12 }}
                              />
                              {customPrices[String(p.id)] !== undefined && (
                                <span style={{ fontSize:10,color:'var(--primary-light)',fontWeight:700 }}>✓</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Customer</h2>
              <button className="icon-btn" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Remove <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.name}</strong> from the system?
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
              This will delete all records for this customer. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDeleteCustomer}>
                <Trash2 size={13} /> Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
