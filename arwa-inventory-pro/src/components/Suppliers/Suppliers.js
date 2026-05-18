import React, { useState } from 'react';
import { Plus, Star, Truck, Phone, Mail, Globe, X, Edit2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '' });

  // FIX 2: Edit supplier state
  const [editSupplier, setEditSupplier] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', country: '' });

  // FIX 3: Purchase Order state
  const [poSupplier, setPoSupplier] = useState(null);
  const [poNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [poForm, setPoForm] = useState({ deliveryDate: '', notes: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
  const setPo = (k, v) => setPoForm(f => ({ ...f, [k]: v }));

  // FIX 4: Use addSupplier from context
  const handleAdd = (e) => {
    e.preventDefault();
    addSupplier({ ...form, id: Date.now(), rating: 4.0, totalOrders: 0, balance: 0 });
    showToast('Supplier added');
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', country: '' });
  };

  // FIX 2: Edit supplier handler
  const openEdit = (s) => {
    setEditSupplier(s);
    setEditForm({ name: s.name, email: s.email, phone: s.phone, country: s.country });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateSupplier(editSupplier.id, editForm);
    showToast('Supplier updated', 'success');
    setEditSupplier(null);
  };

  // FIX 3: Purchase Order handler
  const handlePO = (e) => {
    e.preventDefault();
    showToast(`Purchase Order ${poNumber} sent to ${poSupplier.name}`, 'success');
    setPoSupplier(null);
    setPoForm({ deliveryDate: '', notes: '' });
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
              {/* FIX 2: Wire Edit button */}
              <button className="btn btn-secondary btn-sm w-full" style={{ justifyContent: 'center' }} onClick={() => openEdit(s)}>
                <Edit2 size={12} /> Edit
              </button>
              {/* FIX 3: Wire + Order button */}
              <button className="btn btn-primary btn-sm w-full" style={{ justifyContent: 'center' }} onClick={() => setPoSupplier(s)}>
                + Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
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

      {/* FIX 2: Edit Supplier Modal */}
      {editSupplier && (
        <div className="modal-overlay" onClick={() => setEditSupplier(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Supplier</h3>
              <button className="icon-btn" onClick={() => setEditSupplier(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-control" required value={editForm.name} onChange={e => setEdit('name', e.target.value)} placeholder="Supplier company name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" required value={editForm.email} onChange={e => setEdit('email', e.target.value)} placeholder="orders@supplier.com" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={editForm.phone} onChange={e => setEdit('phone', e.target.value)} placeholder="+1-555-0000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-control" value={editForm.country} onChange={e => setEdit('country', e.target.value)} placeholder="USA" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditSupplier(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Edit2 size={14} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 3: Purchase Order Modal */}
      {poSupplier && (
        <div className="modal-overlay" onClick={() => setPoSupplier(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Purchase Order</h3>
              <button className="icon-btn" onClick={() => setPoSupplier(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handlePO}>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input className="form-control" value={poSupplier.name} readOnly style={{ opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label">PO Number</label>
                <input className="form-control" value={poNumber} readOnly style={{ opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Delivery Date</label>
                <input className="form-control" type="date" value={poForm.deliveryDate} onChange={e => setPo('deliveryDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Items</label>
                <textarea className="form-control" rows={4} value={poForm.notes} onChange={e => setPo('notes', e.target.value)} placeholder="List items, quantities, and any special instructions..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPoSupplier(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Truck size={14} /> Send Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
