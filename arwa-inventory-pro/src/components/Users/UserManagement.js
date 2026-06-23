import React, { useState } from 'react';
import { Plus, Edit2, Shield, UserCheck, UserX, Clock, Activity, X, Eye, EyeOff, DollarSign, Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

const STAFF_ROLES = ['manager', 'cashier', 'warehouse', 'accountant', 'salesperson'];
const BRANCHES = ['All Branches', 'Main Store', 'Branch B', 'Warehouse A', 'Warehouse B'];

const ROLE_CONFIG = {
  admin:       { color: '#4F46E5', bg: 'rgba(79,70,229,0.12)',  label: 'Admin' },
  client:      { color: '#4F46E5', bg: 'rgba(79,70,229,0.12)',  label: 'Admin' },
  manager:     { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', label: 'Manager' },
  cashier:     { color: '#059669', bg: 'rgba(5,150,105,0.12)',  label: 'Cashier' },
  warehouse:   { color: '#D97706', bg: 'rgba(217,119,6,0.12)',  label: 'Warehouse' },
  accountant:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Accountant' },
  salesperson: { color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Salesperson' },
};

const MODULE_LABELS = {
  '/':                'Dashboard',
  '/pos':             'Point of Sale',
  '/inventory':       'Inventory',
  '/cash-counter':    'Cash Counter',
  '/online-orders':   'Online Orders',
  '/barcode':         'Barcode System',
  '/suppliers':       'Suppliers',
  '/customers':       'Customers',
  '/quotes':          'Quotes',
  '/reports':         'Reports',
  '/tax':             'Canadian Tax',
  '/lot-tracking':    'Lot & Serial',
  '/purchase-orders': 'Purchase Orders',
  '/stock-transfers': 'Stock Transfers',
  '/backorders':      'Backorders',
  '/payroll':         'Payroll / T4',
  '/accounting':      'Accounting',
  '/cra-audit':       'CRA Audit Export',
  '/ai-guardian':     'AI Guardian',
  '/users':           'User Management',
};

function UserModal({ user, onClose, onSave, enabledModules }) {
  const isEdit = !!user;
  const allAvailable = enabledModules
    ? enabledModules.filter(p => MODULE_LABELS[p])
    : Object.keys(MODULE_LABELS);

  const [form, setForm] = useState(() => {
    const defaults = { name: '', email: '', password: '', role: 'cashier', status: 'active', branch: 'Main Store', allowedModules: allAvailable };
    if (user) return { ...defaults, ...user, password: '' };
    return defaults;
  });
  const [showPass, setShowPass] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleModule = (path) => {
    setForm(f => {
      const cur = f.allowedModules || [];
      return { ...f, allowedModules: cur.includes(path) ? cur.filter(p => p !== path) : [...cur, path] };
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Staff Account' : 'Create Staff Account'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          if (!isEdit && !form.password) { alert('Password is required'); return; }
          const saved = { ...form, id: user?.id || Date.now(), lastLogin: user?.lastLogin || null, permissions: [] };
          if (!saved.password) delete saved.password;
          onSave(saved);
        }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Staff member name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-control" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="staff@company.com" />
          </div>
          <div className="form-group">
            <label className="form-label">{isEdit ? 'Password (leave blank to keep current)' : 'Password *'}</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                required={!isEdit}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Set a login password'}
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
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

          <div className="form-group">
            <label className="form-label">Module Access</label>
            <div style={{ background: 'rgba(79,70,229,0.06)', borderRadius: 8, padding: 12, border: '1px solid rgba(79,70,229,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Select modules this staff can access</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => set('allowedModules', [...allAvailable])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--primary-light)', fontWeight: 600 }}>All</button>
                  <button type="button" onClick={() => set('allowedModules', [])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>None</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {allAvailable.map(path => {
                  const checked = (form.allowedModules || []).includes(path);
                  return (
                    <label key={path} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', padding: '5px 8px', borderRadius: 6, background: checked ? 'rgba(79,70,229,0.12)' : 'transparent', userSelect: 'none' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleModule(path)} style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
                      {MODULE_LABELS[path]}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <UserCheck size={14} /> {isEdit ? 'Update' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { users, addUser, deleteUser: ctxDeleteUser, setUsers, showToast, currentUser, subscription, getEnabledModules, isSuperAdmin } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const plan = SUBSCRIPTION_PLANS[subscription?.plan] || SUBSCRIPTION_PLANS.basic;
  const enabledModules = getEnabledModules();
  const isCompanyAdmin = isSuperAdmin || currentUser?.role === 'admin' || currentUser?.role === 'client';

  const visibleUsers = users.filter(u => u.role !== 'superadmin');
  const adminUsers = visibleUsers.filter(u => u.role === 'admin' || u.role === 'client');
  const staffUsers = visibleUsers.filter(u => u.role !== 'admin' && u.role !== 'client');

  const staffLimit = plan.staffUsers ?? 2;
  const atStaffLimit = staffLimit !== -1 && staffUsers.length >= staffLimit;
  const isEnterprise = subscription?.plan === 'super';
  const overageStaff = isEnterprise && staffUsers.length > 20 ? staffUsers.length - 20 : 0;

  const filtered = visibleUsers.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (statusFilter === 'all' || u.status === statusFilter)
  );

  const handleSave = (userData) => {
    const isEdit = !!editUser;
    if (isEdit) {
      setUsers(prev => prev.map(u => {
        if (u.id !== editUser.id) return u;
        const updated = { ...u, ...userData };
        if (!userData.password) delete updated.password;
        return updated;
      }));
      showToast('Staff account updated');
    } else {
      if (atStaffLimit && !isEnterprise) {
        showToast(`Staff limit reached for ${plan.name} plan (${staffLimit} staff). Upgrade to add more.`, 'warning');
        return;
      }
      addUser({ ...userData, role: userData.role || 'cashier' });
    }
    setShowModal(false);
    setEditUser(null);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this staff account?')) ctxDeleteUser(id);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>User Management</h1>
          <p>
            {adminUsers.length} admin · {staffUsers.length} / {staffLimit === -1 ? '∞' : staffLimit} staff
            {overageStaff > 0 && (
              <span style={{ color: '#F59E0B', fontWeight: 600 }}> · +{overageStaff} extra @ $5/staff</span>
            )}
          </p>
        </div>
        {isCompanyAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => { setEditUser(null); setShowModal(true); }}
            disabled={atStaffLimit && !isEnterprise}
            title={atStaffLimit && !isEnterprise ? `Staff limit reached (${staffLimit} on ${plan.name})` : undefined}
          >
            <Plus size={14} /> Add Staff
          </button>
        )}
      </div>

      {atStaffLimit && !isEnterprise && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserX size={15} /> Staff limit reached — {plan.name} plan allows {staffLimit} staff accounts. Upgrade to add more.
        </div>
      )}
      {overageStaff > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={15} /> {overageStaff} extra staff beyond 20 — additional ${overageStaff * 5}/month will be charged
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Users', value: visibleUsers.length, color: '#4F46E5' },
          { label: 'Active',      value: visibleUsers.filter(u => u.status === 'active').length, color: '#10B981' },
          { label: 'Staff',       value: staffUsers.length, sub: `/ ${staffLimit === -1 ? '∞' : staffLimit}`, color: '#7C3AED' },
          { label: 'Admins',      value: adminUsers.length, sub: '/ 1', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>
              {s.value}
              {s.sub && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{s.sub}</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 10, background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
        <Shield size={15} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>{plan.name} Plan:</strong>{' '}
          1 Admin + {staffLimit === -1 ? 'Unlimited' : staffLimit} Staff
          {isEnterprise && ` · extra staff billed at $${plan.extraStaffCost}/month each`}
        </span>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div className="tabs" style={{ marginBottom: 10 }}>
            {['all', 'admin', 'client', 'manager', 'cashier', 'warehouse', 'accountant', 'salesperson'].map(r => (
              <button key={r} className={`tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
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
            const isCurrentUser = user.id === currentUser.id;
            const isAdminRow = user.role === 'admin' || user.role === 'client';
            return (
              <div key={user.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: roleCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: roleCfg.color, flexShrink: 0 }}>
                  {(user.name || '?').charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</span>
                    {isCurrentUser && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(79,70,229,0.2)', color: 'var(--primary-light)', fontWeight: 700 }}>YOU</span>}
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: roleCfg.bg, color: roleCfg.color }}>{roleCfg.label}</span>
                    <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{user.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>{user.email}</span>
                    {user.branch && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Activity size={10} /> {user.branch}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never logged in'}</span>
                    {!isAdminRow && user.allowedModules && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Lock size={10} /> {user.allowedModules.length} modules</span>
                    )}
                  </div>
                </div>
                {isCompanyAdmin && !isAdminRow && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(user); setShowModal(true); }} title="Edit">
                      <Edit2 size={12} />
                    </button>
                    {!isCurrentUser && (
                      <>
                        <button
                          className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                          onClick={() => toggleStatus(user.id)}
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)} title="Remove">
                          <X size={12} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              No users match the current filters
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSave}
          enabledModules={enabledModules}
        />
      )}
    </div>
  );
}
