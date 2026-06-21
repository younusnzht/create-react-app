import React, { useState } from 'react';
import { Plus, Edit2, Shield, UserCheck, UserX, Clock, Activity, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ROLES = ['admin', 'manager', 'cashier', 'warehouse', 'accountant', 'salesperson'];
const BRANCHES = ['All Branches', 'Main Store', 'Branch B', 'Warehouse A', 'Warehouse B'];

const ROLE_CONFIG = {
  admin: { color: '#4F46E5', bg: 'rgba(79,70,229,0.12)', label: 'Admin' },
  manager: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', label: 'Manager' },
  cashier: { color: '#059669', bg: 'rgba(5,150,105,0.12)', label: 'Cashier' },
  warehouse: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Warehouse' },
  accountant: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Accountant' },
  salesperson: { color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Salesperson' },
};

const PERMISSIONS_BY_ROLE = {
  admin: ['Full system access', 'User management', 'Financial reports', 'AI controls', 'Subscription management'],
  manager: ['Inventory management', 'Staff reports', 'POS access', 'Supplier management'],
  cashier: ['POS terminal', 'Basic product lookup'],
  warehouse: ['Inventory receive', 'Stock transfers', 'Barcode scanning'],
  accountant: ['Financial reports', 'Purchase orders', 'Supplier payments'],
  salesperson: ['POS access', 'Customer management', 'Basic inventory view'],
};

const PLAN_LIMITS = { basic: 3, intermediate: 15, super: -1 };

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || {
    name: '', email: '', role: 'cashier', status: 'active', branch: 'Main Store',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{user ? 'Edit Staff Account' : 'Create Staff Account'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, id: user?.id || Date.now(), lastLogin: new Date().toISOString(), permissions: PERMISSIONS_BY_ROLE[form.role] || [] }); }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Staff member name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-control" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <select className="form-control" value={form.branch} onChange={e => set('branch', e.target.value)}>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {form.role && (
            <div style={{ background: 'rgba(79,70,229,0.08)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permissions for {form.role}</p>
              {(PERMISSIONS_BY_ROLE[form.role] || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <Shield size={11} style={{ color: 'var(--primary-light)' }} /> {p}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <UserCheck size={14} /> {user ? 'Update' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { users, addUser, deleteUser: ctxDeleteUser, setUsers, showToast, currentUser, subscription } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (statusFilter === 'all' || u.status === statusFilter)
  );

  const limit = PLAN_LIMITS[subscription?.plan] ?? -1;
  const nearLimit = limit > 0 && users.length >= limit - 1;
  const atLimit = limit > 0 && users.length >= limit;

  const handleSave = (userData) => {
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? userData : u));
      showToast('User updated successfully');
    } else {
      addUser(userData);
    }
    setShowModal(false);
    setEditUser(null);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this staff account?')) {
      ctxDeleteUser(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>
            {users.filter(u => u.status === 'active').length} active staff across all branches
            {' · '}
            <strong>{users.length} / {limit === -1 ? '∞' : limit} users</strong>
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { if (!atLimit) { setEditUser(null); setShowModal(true); } }}
          disabled={atLimit}
          title={atLimit ? 'User limit reached for your plan' : undefined}
        >
          <Plus size={14} /> Create Staff Account
        </button>
      </div>

      {atLimit && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserX size={15} /> User limit reached for your plan — upgrade to add more staff accounts
        </div>
      )}
      {!atLimit && nearLimit && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={15} /> You're at {users.length}/{limit} users — upgrade to add more
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Staff', value: users.length, color: '#4F46E5' },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: '#10B981' },
          { label: 'Inactive', value: users.filter(u => u.status === 'inactive').length, color: '#F59E0B' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Role</div>
          <div className="tabs" style={{ marginBottom: 10 }}>
            {['all', 'admin', 'manager', 'cashier', 'warehouse', 'accountant'].map(r => (
              <button key={r} className={`tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</div>
          <div className="tabs">
            {['all', 'active', 'inactive'].map(s => (
              <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(user => {
            const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.cashier;
            return (
              <div key={user.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: roleCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: roleCfg.color, flexShrink: 0 }}>
                  {(user.name || '?').charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</span>
                    {user.id === currentUser.id && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(79,70,229,0.2)', color: 'var(--primary-light)', fontWeight: 700 }}>YOU</span>}
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: roleCfg.bg, color: roleCfg.color }}>{roleCfg.label}</span>
                    <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                      {user.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{user.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Activity size={10} /> {user.branch}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(user); setShowModal(true); }}>
                    <Edit2 size={12} />
                  </button>
                  {user.id !== currentUser.id && (
                    <>
                      <button
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => toggleStatus(user.id)}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)} title="Remove account">
                        <X size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
