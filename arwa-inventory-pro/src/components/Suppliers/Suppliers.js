import React, { useState } from 'react';
import { Plus, Star, Truck, Phone, Mail, Globe, X, Edit2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SUPPLIERS } from '../../data/mockData';

export default function Suppliers() {
  const { showToast } = useApp();
  const [suppliers, setSuppliers] = useState(SUPPLIERS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = (e) => {
    e.preventDefault();
    setSuppliers(prev => [...prev, { ...form, id: Date.now(), rating: 4.0, totalOrders: 0, balance: 0 }]);
    showToast('Supplier added');
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', country: '' });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Supplier Management</h1>
          <p>Manage vendor relationships and purchase orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {suppliers.map(s => (
          <div key={s.id} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={20} style={{ color: 'var(--primary-light)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <Globe size={10} style={{ display: 'inline', marginRight: 3 }} />
                    {s.country}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={13} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.rating}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                {s.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                {s.phone}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-light)' }}>{s.totalOrders}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Orders</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>${s.balance.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Balance</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm w-full" style={{ justifyContent: 'center' }}>
                <Edit2 size={12} /> Edit
              </button>
              <button className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }} onClick={() => showToast(`Purchase order created for ${s.name}`, 'info')}>
                + Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Supplier</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Supplier company name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="orders@supplier.com" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-control" value={form.country} onChange={e => set('country', e.target.value)} placeholder="USA" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Truck size={14} /> Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
