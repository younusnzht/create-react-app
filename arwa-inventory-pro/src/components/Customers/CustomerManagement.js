import React, { useState } from 'react';
import { Users, Plus, Search, X, History } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function CustomerManagement() {
  const { customers, addCustomer, showToast, currency } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', loyaltyPoints: 0 });
  const [errors, setErrors] = useState({});

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    return e;
  };

  const handleAdd = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    addCustomer({ ...form, loyaltyPoints: Number(form.loyaltyPoints) || 0, totalOrders: 0, totalSpent: 0, lastVisit: new Date().toISOString().split('T')[0] });
    showToast(`Customer "${form.name}" added successfully`);
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', loyaltyPoints: 0 });
    setErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', loyaltyPoints: 0 });
    setErrors({});
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customer Management</h1>
          <p>Manage your customers and loyalty programs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', flex: 1, maxWidth: 320,
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              placeholder="Search by name or email..."
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
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={26} /></div>
            <h3>{search ? 'No customers match your search' : 'No customers yet'}</h3>
            <p style={{ fontSize: 13 }}>{search ? 'Try a different search term' : 'Add your first customer to get started'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Last Visit</th>
                  <th>Loyalty Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>{c.name.charAt(0)}</div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                    <td>{c.totalOrders}</td>
                    <td style={{ fontWeight: 600 }}>{currency} {c.totalSpent?.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.lastVisit}</td>
                    <td>
                      <span style={{
                        background: 'rgba(79,70,229,0.12)', color: 'var(--primary-light)',
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      }}>{c.loyaltyPoints} pts</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => showToast('Customer history — coming soon', 'info')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <History size={12} /> View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add Customer</h2>
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

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
