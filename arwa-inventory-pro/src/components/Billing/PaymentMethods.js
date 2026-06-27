import React, { useState } from 'react';
import { ExternalLink, AlertCircle, Download, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PAYMENT_PROCESSORS = [
  {
    id: 'stripe',
    name: 'Stripe',
    logo: '💳',
    color: '#635BFF',
    desc: 'Credit & debit cards, Apple Pay, Google Pay. Most popular globally.',
    currencies: 'CAD, USD, EUR, GBP, 135+ currencies',
    countries: 'Canada, USA, Global',
    fee: '2.9% + 30¢ per transaction',
    popular: true,
    setupUrl: '#',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    logo: '🅿️',
    color: '#003087',
    desc: 'Pay with your PayPal balance, bank, or card. 400M+ users worldwide.',
    currencies: 'CAD, USD, EUR and 25+ currencies',
    countries: 'Canada, USA, Global',
    fee: '3.49% + fixed fee',
    setupUrl: '#',
  },
  {
    id: 'square',
    name: 'Square',
    logo: '⬛',
    color: '#3E4348',
    desc: 'Online and in-person payments. Strong in Canada and USA.',
    currencies: 'CAD, USD, AUD, GBP, JPY',
    countries: 'Canada, USA, UK, Australia, Japan',
    fee: '2.65% per tap/chip · 2.9% + 30¢ online',
    setupUrl: '#',
  },
  {
    id: 'wave',
    name: 'Wave',
    logo: '🌊',
    color: '#2196F3',
    desc: 'Free Canadian accounting software with built-in payments. Beloved by Canadian SMBs.',
    currencies: 'CAD, USD',
    countries: 'Canada, USA',
    fee: '2.9% + 30¢ (Visa/MC) · 3.4% + 30¢ (Amex)',
    setupUrl: '#',
  },
  {
    id: 'wise',
    name: 'Wise',
    logo: '🌍',
    color: '#00B9FF',
    desc: 'International bank transfers at real exchange rate. Best for cross-border payments.',
    currencies: 'CAD, USD, EUR, GBP, 40+ currencies',
    countries: 'Global',
    fee: '0.41%–2% depending on currency pair',
    setupUrl: '#',
  },
  {
    id: 'interac',
    name: 'Interac e-Transfer',
    logo: '🍁',
    color: '#FFB700',
    desc: 'Canadian bank-to-bank transfer. Free, instant, and trusted by all major Canadian banks.',
    currencies: 'CAD only',
    countries: 'Canada only',
    fee: 'Free (bank fees may apply)',
    canadian: true,
    setupUrl: '#',
  },
  {
    id: 'cheque',
    name: 'Cheque / Invoice',
    logo: '📄',
    color: '#6B7280',
    desc: 'Traditional billing. Receive monthly invoice by email, pay by cheque or EFT. NET-30 terms.',
    currencies: 'CAD, USD',
    countries: 'Canada, USA',
    fee: 'No processing fee',
    setupUrl: '#',
  },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-006', date: '2026-06-01', amount: 149.00, plan: 'Growth', status: 'paid', method: 'Stripe' },
  { id: 'INV-2026-005', date: '2026-05-01', amount: 149.00, plan: 'Growth', status: 'paid', method: 'Stripe' },
  { id: 'INV-2026-004', date: '2026-04-01', amount: 149.00, plan: 'Growth', status: 'paid', method: 'Stripe' },
  { id: 'INV-2026-003', date: '2026-03-01', amount: 49.00, plan: 'Starter', status: 'paid', method: 'PayPal' },
  { id: 'INV-2026-002', date: '2026-02-01', amount: 49.00, plan: 'Starter', status: 'paid', method: 'PayPal' },
  { id: 'INV-2026-001', date: '2026-01-01', amount: 0.00, plan: 'Trial', status: 'free', method: '—' },
];

export default function PaymentMethods() {
  const { subscription, setSubscription, showToast } = useApp();
  const [connecting, setConnecting] = useState(null);
  const connectedMethod = subscription.connectedPaymentMethod || null;

  const handleConnect = (processor) => {
    setConnecting(processor.id);
    setTimeout(() => {
      setSubscription(prev => ({ ...prev, connectedPaymentMethod: processor.id }));
      setConnecting(null);
      showToast(`${processor.name} connected as your payment method!`, 'success');
    }, 1400);
  };

  const handleDisconnect = (processor) => {
    setSubscription(prev => ({ ...prev, connectedPaymentMethod: null }));
    showToast(`${processor.name} disconnected`, 'info');
  };

  const activeProcessor = PAYMENT_PROCESSORS.find(p => p.id === connectedMethod);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Payment Methods</h1>
          <p>Choose how you pay for your Arwa subscription — connect your preferred processor</p>
        </div>
      </div>

      {/* Active payment method banner */}
      {activeProcessor ? (
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.06))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: activeProcessor.color + '22', border: `2px solid ${activeProcessor.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {activeProcessor.logo}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Active: {activeProcessor.name}</h3>
              <span className="badge badge-success">● Connected</span>
              {activeProcessor.canadian && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(255,183,0,0.15)', color: '#D97706' }}>🍁 CANADIAN</span>}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{activeProcessor.desc}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Processing fee</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{activeProcessor.fee}</div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={20} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No payment method connected. Connect one below to enable automatic billing for your Arwa subscription.</p>
        </div>
      )}

      {/* Payment processor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
        {PAYMENT_PROCESSORS.map(p => {
          const isConnected = connectedMethod === p.id;
          const isConnecting = connecting === p.id;
          return (
            <div key={p.id} style={{
              background: isConnected ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))' : 'var(--bg-secondary)',
              border: `2px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              transition: 'all 0.2s',
              position: 'relative',
            }}>
              {p.popular && !isConnected && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(79,70,229,0.15)', color: 'var(--primary-light)' }}>POPULAR</div>
              )}
              {p.canadian && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(255,183,0,0.15)', color: '#D97706' }}>🍁 CANADIAN</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: p.color + '18', border: `1px solid ${p.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {p.logo}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{p.name}</div>
                  {isConnected && <span className="badge badge-success" style={{ fontSize: 10 }}>● Connected</span>}
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{p.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Currencies: </span>{p.currencies}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Available in: </span>{p.countries}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fee: </span>
                  <span style={{ color: p.fee.startsWith('Free') ? '#10B981' : 'var(--text-muted)' }}>{p.fee}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isConnected ? (
                  <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDisconnect(p)}>
                    Disconnect
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', background: isConnecting ? undefined : p.color }}
                    onClick={() => handleConnect(p)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : <><CheckCircle size={13} /> Connect {p.name}</>}
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" style={{ padding: '5px 10px' }} title="Learn more" onClick={() => showToast(`${p.name} integration docs opening...`, 'info')}>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice History */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Invoice History</span>
          <button className="btn btn-secondary btn-sm" onClick={() => showToast('Downloading all invoices...', 'info')}>
            <Download size={13} /> Export All
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Invoice #', 'Date', 'Plan', 'Amount', 'Method', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_INVOICES.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>{inv.id}</td>
                <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{inv.date}</td>
                <td style={{ padding: '12px', fontSize: 13 }}>{inv.plan}</td>
                <td style={{ padding: '12px', fontSize: 13, fontWeight: 700 }}>CA${inv.amount.toFixed(2)}</td>
                <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-muted)' }}>{inv.method}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: inv.status === 'paid' ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)', color: inv.status === 'paid' ? '#10B981' : '#6B7280' }}>
                    {inv.status === 'paid' ? '✓ Paid' : 'Free'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '3px 10px' }} onClick={() => showToast(`Downloading ${inv.id}...`, 'info')}>
                    <Download size={11} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          Invoices are generated on the 1st of each month. PDF copies are emailed automatically to your registered address.
        </p>
      </div>
    </div>
  );
}
