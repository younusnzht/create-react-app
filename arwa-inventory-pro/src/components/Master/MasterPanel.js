import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Shield, Users, Building2, CheckCircle, XCircle, Clock, AlertTriangle, Copy, Eye, EyeOff, Lock, Key } from 'lucide-react';
import { useApp, SUPER_ADMIN_EMAIL } from '../../contexts/AppContext';
import { BUSINESS_TYPES, SUBSCRIPTION_PLANS } from '../../data/mockData';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  trial:     { label: 'Trial',     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  suspended: { label: 'Suspended', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

const BUSINESS_TYPE_OPTIONS = Object.entries(BUSINESS_TYPES).map(([key, val]) => ({ key, label: val.name || val.label, emoji: val.emoji }));
const PLAN_OPTIONS = Object.keys(SUBSCRIPTION_PLANS);

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'ARWA-' + Array.from({length: 4}, () => Array.from({length: 4}, () => chars[Math.floor(Math.random()*chars.length)]).join('')).join('-');
}

function ClientModal({ client, onClose, onSave }) {
  const isEdit = Boolean(client?.id);
  const [form, setForm] = useState(client || {
    clientName: '', email: '', domain: '', loginPassword: '',
    businessType: 'general_retail', plan: 'intermediate',
    status: 'active', notes: '',
    moduleOverrides: {},
    accessCode: generateAccessCode(),
    createdAt: new Date().toISOString().split('T')[0],
  });
  const [showPw, setShowPw] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const copyText = (text) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Client' : 'Add New Client'}</h3>
          <button className="icon-btn" onClick={onClose}><span style={{ fontSize: 18 }}>×</span></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Business / Client Name *</label>
              <input className="form-control" required value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="e.g. Sunrise Pharmacy" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Login credentials box */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(91,95,207,0.06)', border: '1px solid rgba(91,95,207,0.25)', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key size={12} /> Login Credentials (client uses these to log in)
            </div>
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Login Email *</label>
                <input className="form-control" type="email" required value={form.email}
                  onChange={e => set('email', e.target.value)} placeholder="owner@business.com" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isEdit ? 'New Password (leave blank to keep)' : 'Login Password *'}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    required={!isEdit}
                    value={form.loginPassword}
                    onChange={e => set('loginPassword', e.target.value)}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'Set a strong password'}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPw(v => !v)} style={{ flexShrink: 0 }}>
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}
                    onClick={() => copyText(form.loginPassword)} title="Copy password">
                    <Copy size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Share this password with the client securely
                </p>
              </div>
            </div>
          </div>

          {/* Optional domain access */}
          <div className="form-group">
            <label className="form-label">Company Domain (optional — grants access to any @domain.com login)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span style={{ padding: '9px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '7px 0 0 7px', fontSize: 13, color: 'var(--text-muted)' }}>@</span>
              <input className="form-control" value={form.domain}
                onChange={e => set('domain', e.target.value.replace('@', ''))}
                placeholder="business.com"
                style={{ borderRadius: '0 7px 7px 0' }} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Business Type *</label>
              <select className="form-control" value={form.businessType} onChange={e => set('businessType', e.target.value)}>
                {BUSINESS_TYPE_OPTIONS.filter(b => b.key !== 'platform_admin').map(b => (
                  <option key={b.key} value={b.key}>{b.emoji} {b.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subscription Plan *</label>
              <select className="form-control" value={form.plan} onChange={e => set('plan', e.target.value)}>
                {PLAN_OPTIONS.map(p => (
                  <option key={p} value={p}>{SUBSCRIPTION_PLANS[p].name} — ${SUBSCRIPTION_PLANS[p].monthlyPrice}/mo</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <textarea className="form-control" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notes about this client (visible only to you)..."
              style={{ resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Client Reference Code</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-control" readOnly
                value={showCode ? form.accessCode : '••••-••••-••••-••••'}
                style={{ fontFamily: 'monospace', letterSpacing: 2 }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCode(v => !v)} style={{ flexShrink: 0 }}>
                {showCode ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => copyText(form.accessCode)} style={{ flexShrink: 0 }}>
                <Copy size={13} />
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => set('accessCode', generateAccessCode())} style={{ flexShrink: 0 }}>
                New
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              For your records only — the client logs in with email + password above
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Shield size={14} /> {isEdit ? 'Update Client' : 'Create Client & Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MasterPanel() {
  const { clientConfigs, setClientConfigs, showToast, currentUser, isSuperAdmin, setUsers } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState(null); // null | 'add' | {client}
  const [deleteId, setDeleteId] = useState(null);

  if (!isSuperAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <Lock size={48} style={{ color: 'var(--danger)' }} />
        <h2 style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Master Control Panel is restricted to the platform owner only.</p>
      </div>
    );
  }

  const filtered = useMemo(() => { // eslint-disable-line react-hooks/rules-of-hooks
    let list = clientConfigs;
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.clientName?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q));
    }
    return list;
  }, [clientConfigs, search, filterStatus]);

  const stats = useMemo(() => ({ // eslint-disable-line react-hooks/rules-of-hooks
    total: clientConfigs.length,
    active: clientConfigs.filter(c => c.status === 'active').length,
    trial: clientConfigs.filter(c => c.status === 'trial').length,
    suspended: clientConfigs.filter(c => c.status === 'suspended').length,
  }), [clientConfigs]);

  const handleSave = (form) => {
    const isEdit = modal && modal !== 'add';
    const clientId = isEdit ? form.id : Date.now();
    const saved = { ...form, id: clientId };

    // Create or update login account in users array
    if (form.email) {
      setUsers(prev => {
        const existing = prev.find(u => u.email === form.email);
        if (existing) {
          // Update existing user — only change password if a new one was provided
          return prev.map(u => u.email === form.email ? {
            ...u,
            name: form.clientName,
            role: 'client',
            ...(form.loginPassword ? { password: form.loginPassword } : {}),
          } : u);
        }
        // Create new user account
        return [...prev, {
          id: clientId,
          name: form.clientName,
          email: form.email,
          password: form.loginPassword,
          role: 'client',
          status: 'active',
          lastLogin: null,
          branch: 'Main Store',
          permissions: ['pos', 'inventory', 'reports'],
        }];
      });
    }

    if (isEdit) {
      setClientConfigs(prev => prev.map(c => c.id === form.id ? saved : c));
      showToast(`"${form.clientName}" updated`, 'success');
    } else {
      setClientConfigs(prev => [...prev, saved]);
      showToast(`"${form.clientName}" created — login ready`, 'success');
    }
    setModal(null);
  };

  const handleDelete = (id) => {
    const c = clientConfigs.find(x => x.id === id);
    setClientConfigs(prev => prev.filter(x => x.id !== id));
    if (c?.email) setUsers(prev => prev.filter(u => u.email !== c.email));
    setDeleteId(null);
    showToast(`"${c?.clientName}" removed`, 'success');
  };

  const toggleStatus = (id) => {
    setClientConfigs(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.status === 'active' ? 'suspended' : 'active';
      return { ...c, status: next };
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Master Control Panel</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage all client tenants — only visible to {SUPER_ADMIN_EMAIL}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Clients', value: stats.total, icon: Building2, color: '#5B5FCF' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: '#10B981' },
          { label: 'On Trial', value: stats.trial, icon: Clock, color: '#F59E0B' },
          { label: 'Suspended', value: stats.suspended, icon: XCircle, color: '#EF4444' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input placeholder="Search by name, email, or domain..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'trial', 'suspended', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>{clientConfigs.length === 0 ? 'No clients yet — add your first client to get started' : 'No clients match your search'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email / Domain</th>
                  <th>Business Type</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const bt = BUSINESS_TYPES[c.businessType];
                  const plan = SUBSCRIPTION_PLANS[c.plan];
                  const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.active;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.clientName}</div>
                        {c.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.notes}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          {c.email && <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{c.email}</div>}
                          {c.loginPassword && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Key size={10} style={{ color: 'var(--text-muted)' }} />
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{'•'.repeat(Math.min(c.loginPassword.length, 8))}</span>
                            </div>
                          )}
                          {!c.loginPassword && c.email && (
                            <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2 }}>⚠ No password set</div>
                          )}
                          {c.domain && <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>@{c.domain}</div>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {bt?.emoji} {bt?.label || c.businessType}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                          {plan?.name || c.plan}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${plan?.monthlyPrice}/mo</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.createdAt}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(c)} title="Edit">
                            <Edit2 size={12} />
                          </button>
                          <button
                            className={`btn btn-sm ${c.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleStatus(c.id)}
                            title={c.status === 'active' ? 'Suspend' : 'Activate'}
                          >
                            {c.status === 'active' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(c.id)} title="Delete">
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

      {/* Owner Info Card */}
      <div className="card" style={{ background: 'rgba(91,95,207,0.06)', border: '1px solid rgba(91,95,207,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>You are logged in as the Platform Owner</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentUser?.name} · {currentUser?.email} · Master access is restricted to this account only. Clients cannot access this panel or change their business type.
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === 'add' || (modal && modal.id)) && (
        <ClientModal client={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <AlertTriangle size={40} style={{ color: 'var(--danger)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Delete Client?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>This will permanently remove this client's configuration. Their login access will revert to defaults.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary w-full" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger w-full" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
