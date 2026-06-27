import React, { useState } from 'react';
import { Globe, Copy, Eye, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function B2BPortalSettings() {
  const { subscription, setSubscription, showToast, businessName } = useApp();
  const portalConfig = subscription.b2bPortal || {};
  const [config, setConfig] = useState({
    enabled: portalConfig.enabled ?? false,
    portalName: portalConfig.portalName || (businessName || 'Arwa Wholesale') + ' Order Portal',
    welcomeMessage: portalConfig.welcomeMessage || 'Welcome! Browse our catalogue and place your order below.',
    requireApproval: portalConfig.requireApproval ?? true,
    showPrices: portalConfig.showPrices ?? true,
    minOrderValue: portalConfig.minOrderValue || '',
    allowedEmails: portalConfig.allowedEmails || '',
    primaryColor: portalConfig.primaryColor || '#4F46E5',
  });

  const portalUrl = `${window.location.origin}/b2b-order`;
  const shortCode = btoa((businessName || 'arwa').slice(0, 6)).slice(0, 8).toLowerCase();

  const save = () => {
    setSubscription(prev => ({ ...prev, b2bPortal: { ...config } }));
    showToast('B2B Portal settings saved!', 'success');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl).then(() => showToast('Portal link copied!', 'success'));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>B2B Order Portal</h1>
          <p>Let your wholesale clients browse your catalogue and place orders online</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => window.open('/b2b-order', '_blank')}>
            <Eye size={14} /> Preview Portal
          </button>
          <button className="btn btn-primary" onClick={save}>
            <CheckCircle size={14} /> Save Settings
          </button>
        </div>
      </div>

      {/* Portal link */}
      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.08))', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Globe size={18} style={{ color: 'var(--primary-light)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Your B2B Order Portal Link</h3>
          <span style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: config.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', color: config.enabled ? '#10B981' : '#EF4444' }}>
              {config.enabled ? '● LIVE' : '● OFFLINE'}
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <code style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
            {portalUrl}?ref={shortCode}
          </code>
          <button className="btn btn-secondary" onClick={copyLink}><Copy size={14} /> Copy</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          Share this link with your wholesale clients — they can browse your products and submit orders without needing an Arwa account.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* General settings */}
        <div className="card">
          <div className="card-header"><span className="card-title">Portal Settings</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Enable Portal</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Make the portal accessible to clients</div>
              </div>
              <button onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))} style={{ width: 44, height: 24, borderRadius: 12, background: config.enabled ? 'var(--primary)' : 'var(--bg-tertiary)', border: `1px solid ${config.enabled ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: config.enabled ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Require Order Approval</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Review orders before confirming</div>
              </div>
              <button onClick={() => setConfig(c => ({ ...c, requireApproval: !c.requireApproval }))} style={{ width: 44, height: 24, borderRadius: 12, background: config.requireApproval ? 'var(--primary)' : 'var(--bg-tertiary)', border: `1px solid ${config.requireApproval ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: config.requireApproval ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Show Prices</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Display wholesale prices on catalogue</div>
              </div>
              <button onClick={() => setConfig(c => ({ ...c, showPrices: !c.showPrices }))} style={{ width: 44, height: 24, borderRadius: 12, background: config.showPrices ? 'var(--primary)' : 'var(--bg-tertiary)', border: `1px solid ${config.showPrices ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: config.showPrices ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Portal Name</label>
              <input className="form-control" value={config.portalName} onChange={e => setConfig(c => ({ ...c, portalName: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Welcome Message</label>
              <textarea className="form-control" rows={3} value={config.welcomeMessage} onChange={e => setConfig(c => ({ ...c, welcomeMessage: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Minimum Order Value (CA$)</label>
              <input className="form-control" type="number" placeholder="e.g. 500" value={config.minOrderValue} onChange={e => setConfig(c => ({ ...c, minOrderValue: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Allowed Client Emails (optional)</label>
              <textarea className="form-control" rows={3} placeholder="Leave blank for open access, or enter one email per line to restrict access" value={config.allowedEmails} onChange={e => setConfig(c => ({ ...c, allowedEmails: e.target.value }))} style={{ resize: 'vertical', fontSize: 12, fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">How It Works</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              {[
                { step: '1', icon: '🔗', title: 'Share the link', desc: 'Send your portal URL to Metro, Sobeys, Amazon CA or any wholesale client' },
                { step: '2', icon: '🛍️', title: 'Client browses & orders', desc: 'They see your live product catalogue with prices and place an order online' },
                { step: '3', icon: '📥', title: 'Order arrives in Sales Orders', desc: 'Instantly appears in your Sales Orders module for review and processing' },
                { step: '4', icon: '✅', title: 'Confirm & dispatch', desc: 'Approve the order, deduct inventory, and track through to delivery' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'white', flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{s.icon} {s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#10B981' }}>✓ Included in your plan</div>
            {['Live product catalogue with real-time stock', 'Customer info + company capture on order', 'Minimum order value enforcement', 'Orders flow directly into Sales Orders module', 'Email notifications on new orders', 'Restricts by email list for private portals'].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 7, fontSize: 12, color: 'var(--text-secondary)' }}>
                <CheckCircle size={12} style={{ color: '#10B981', flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
