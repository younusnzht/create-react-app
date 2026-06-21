import React, { useState, useMemo } from 'react';
import { Receipt, Save, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PROVINCES, calcTax, formatTaxLabel } from '../../services/taxEngine';

const getCurrencySymbol = (code) => {
  const symbols = {
    USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥',
    INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼', CNY: '¥', KRW: '₩',
    BRL: 'R$', MXN: '$', ZAR: 'R', CHF: 'Fr', SEK: 'kr', NOK: 'kr',
    DKK: 'kr', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', THB: '฿', TRY: '₺',
    RUB: '₽', NGN: '₦', GHS: '₵', KES: 'KSh', EGP: 'E£', MAD: 'MAD',
    QAR: 'QR', OMR: 'OMR', KWD: 'KD', BHD: 'BD', JOD: 'JD',
  };
  return symbols[code] || code + ' ';
};

// ── Tax Number Validators ────────────────────────────────────────────────────
function validateGSTNumber(num) {
  const clean = (num || '').replace(/[\s-]/g, '').toUpperCase();
  return /^\d{9}RT\d{4}$/.test(clean);
}
function validateQSTNumber(num) {
  const clean = (num || '').replace(/[\s-]/g, '').toUpperCase();
  return /^\d{10}TQ\d{4}$/.test(clean) || /^1\d{9}TQ\d{4}$/.test(clean);
}
function validatePSTNumber(num) {
  return num && num.trim().length >= 4;
}

export default function CanadianTax() {
  const { taxConfig, setTaxConfig, showToast, currency, auditLog, orders, purchaseOrders } = useApp();
  const sym = getCurrencySymbol(currency || 'USD');

  const [activeTab, setActiveTab] = useState('config');
  const [form, setForm] = useState({ ...taxConfig });
  const [previewAmount, setPreviewAmount] = useState('100');

  // ── Filing Summary state ─────────────────────────────────────────────────
  const [filingPeriod, setFilingPeriod] = useState('monthly');
  const [filingDate, setFilingDate] = useState(() => new Date().toISOString().slice(0, 7));

  const handleSave = () => {
    setTaxConfig(form);
    showToast('Tax configuration saved', 'success');
  };

  const previewTax = calcTax(parseFloat(previewAmount) || 0, form.province);
  const taxSaleEntries = auditLog.filter(e => e.action === 'POS_SALE').slice(0, 20);

  // ── Filing Summary computation ───────────────────────────────────────────
  const filingSummary = useMemo(() => {
    const periodOrders = (orders || []).filter(o => {
      const d = new Date(o.date || o.createdAt || '');
      if (!filingPeriod || !filingDate) return true;
      if (filingPeriod === 'monthly') {
        return d.toISOString().slice(0, 7) === filingDate;
      } else {
        const month = d.getMonth() + 1;
        const year  = d.getFullYear();
        const [selYear, selMonth] = filingDate.split('-').map(Number);
        const selQ = Math.ceil(selMonth / 3);
        const orderQ = Math.ceil(month / 3);
        return year === selYear && orderQ === selQ;
      }
    });

    const collected = periodOrders.reduce((s, o) => {
      const tb = o.taxBreakdown || {};
      return {
        gst:   s.gst   + (tb.gst   || 0),
        hst:   s.hst   + (tb.hst   || 0),
        pst:   s.pst   + (tb.pst   || 0),
        qst:   s.qst   + (tb.qst   || 0),
        total: s.total + (tb.total  || 0),
      };
    }, { gst: 0, hst: 0, pst: 0, qst: 0, total: 0 });

    const periodPOs = (purchaseOrders || []).filter(po => {
      if (!['received', 'partial'].includes(po.status)) return false;
      const d = new Date(po.receivedAt || po.createdAt || '');
      if (filingPeriod === 'monthly') {
        return d.toISOString().slice(0, 7) === filingDate;
      } else {
        const month = d.getMonth() + 1;
        const year  = d.getFullYear();
        const [selYear, selMonth] = filingDate.split('-').map(Number);
        return year === selYear && Math.ceil(month / 3) === Math.ceil(selMonth / 3);
      }
    });
    const itc = periodPOs.reduce((s, po) => s + (po.tax || 0), 0);

    const federalCollected = collected.gst + collected.hst;
    const netRemittance = Math.max(0, federalCollected - itc);

    let deadline = '';
    if (filingPeriod === 'monthly') {
      const [y, m] = filingDate.split('-').map(Number);
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear  = m === 12 ? y + 1 : y;
      deadline = `${nextYear}-${String(nextMonth).padStart(2, '0')}-28`;
    } else {
      const [y, m] = filingDate.split('-').map(Number);
      const quarter = Math.ceil(m / 3);
      const endMonth = quarter * 3;
      const dueMonth = endMonth === 12 ? 1 : endMonth + 1;
      const dueYear  = endMonth === 12 ? y + 1 : y;
      deadline = `${dueYear}-${String(dueMonth).padStart(2, '0')}-28`;
    }

    return { collected, itc, federalCollected, netRemittance, deadline, orderCount: periodOrders.length, poCount: periodPOs.length };
  }, [orders, purchaseOrders, filingPeriod, filingDate]);

  // ── Compliance Tab computations ──────────────────────────────────────────
  const annualRevenue = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return (orders || [])
      .filter(o => new Date(o.date || o.createdAt || '').getFullYear() === thisYear)
      .reduce((s, o) => s + (o.total || 0), 0);
  }, [orders]);

  const filingFrequency = annualRevenue >= 6000000 ? 'Monthly'
    : annualRevenue >= 1500000 ? 'Quarterly'
    : 'Annually';
  const filingFrequencyNote = annualRevenue >= 6000000
    ? 'Required by CRA for businesses with >$6M annual taxable supplies. Due by 28th of the following month.'
    : annualRevenue >= 1500000
    ? 'Required by CRA for businesses with $1.5M–$6M annual taxable supplies. Due 28 days after quarter end.'
    : 'For businesses with <$1.5M annual taxable supplies. Due 3 months after fiscal year end.';

  const remittanceCalendar = useMemo(() => {
    const year = new Date().getFullYear();
    if (filingFrequency === 'Monthly') {
      return Array.from({ length: 12 }, (_, i) => {
        const dueMonth = i + 2 > 12 ? 1 : i + 2;
        const dueYear  = i + 2 > 12 ? year + 1 : year;
        const due = new Date(dueYear, dueMonth - 1, 28);
        return { label: new Date(year, i, 1).toLocaleString('default', { month: 'long' }), due, period: `${year}-${String(i+1).padStart(2,'0')}` };
      });
    }
    if (filingFrequency === 'Quarterly') {
      return [
        { label: 'Q1 (Jan–Mar)', due: new Date(year, 3, 28), period: `Jan–Mar ${year}` },
        { label: 'Q2 (Apr–Jun)', due: new Date(year, 6, 28), period: `Apr–Jun ${year}` },
        { label: 'Q3 (Jul–Sep)', due: new Date(year, 9, 28), period: `Jul–Sep ${year}` },
        { label: 'Q4 (Oct–Dec)', due: new Date(year + 1, 0, 28), period: `Oct–Dec ${year}` },
      ];
    }
    return [{ label: `Annual ${year}`, due: new Date(year + 1, 2, 31), period: `${year}` }];
  }, [filingFrequency]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Receipt size={20} style={{ color: 'var(--primary-light)' }} />
        </div>
        <div>
          <h2 style={{ fontWeight: 800, margin: 0 }}>Canadian Tax Engine</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Configure GST / HST / PST / QST for your province</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 4 }}>
        <button className={`tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
          Configuration
        </button>
        <button className={`tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          Audit Log
        </button>
        <button className={`tab ${activeTab === 'filing' ? 'active' : ''}`} onClick={() => setActiveTab('filing')}>
          Filing Summary
        </button>
        <button className={`tab ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>
          Compliance Guide
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Tax Configuration</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Province / Territory</label>
              <select
                className="form-control"
                value={form.province}
                onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
              >
                {Object.values(PROVINCES).map(p => (
                  <option key={p.code} value={p.code}>{p.name} ({p.code}) — {formatTaxLabel(p.code)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>GST / HST Number</label>
              <input
                className="form-control"
                placeholder="e.g. 123456789RT0001"
                value={form.gstNumber}
                onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))}
              />
            </div>

            {form.province === 'QC' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>QST Number</label>
                <input
                  className="form-control"
                  placeholder="e.g. 1234567890TQ0001"
                  value={form.qstNumber}
                  onChange={e => setForm(f => ({ ...f, qstNumber: e.target.value }))}
                />
              </div>
            )}

            {['BC', 'MB', 'SK'].includes(form.province) && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>PST Number</label>
                <input
                  className="form-control"
                  placeholder="PST registration number"
                  value={form.pstNumber}
                  onChange={e => setForm(f => ({ ...f, pstNumber: e.target.value }))}
                />
              </div>
            )}

            <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 8 }} onClick={handleSave}>
              <Save size={14} /> Save Configuration
            </button>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Tax Preview</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Sample Amount</label>
              <input
                className="form-control"
                type="number"
                step="0.01"
                min="0"
                value={previewAmount}
                onChange={e => setPreviewAmount(e.target.value)}
              />
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>{sym}{(parseFloat(previewAmount) || 0).toFixed(2)}</span>
              </div>
              {previewTax.GST > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST ({previewTax.province.GST}%)</span>
                  <span>{sym}{previewTax.GST.toFixed(2)}</span>
                </div>
              )}
              {previewTax.HST > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>HST ({previewTax.province.HST}%)</span>
                  <span>{sym}{previewTax.HST.toFixed(2)}</span>
                </div>
              )}
              {previewTax.PST > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>PST ({previewTax.province.PST}%)</span>
                  <span>{sym}{previewTax.PST.toFixed(2)}</span>
                </div>
              )}
              {previewTax.QST > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>QST ({previewTax.province.QST.toFixed(3)}%)</span>
                  <span>{sym}{previewTax.QST.toFixed(2)}</span>
                </div>
              )}
              <div className="divider" style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Total Tax ({previewTax.rate}%)</span>
                <span style={{ color: 'var(--primary-light)' }}>{sym}{previewTax.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 15, marginTop: 6 }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--success)' }}>{sym}{((parseFloat(previewAmount) || 0) + previewTax.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(79,70,229,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={12} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
              {PROVINCES[form.province]?.name} — {formatTaxLabel(form.province)}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div>
          {taxSaleEntries.length > 0 ? (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Recent POS Sales (Audit)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Time', 'Order ID', 'Total', 'Tax'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {taxSaleEntries.map(entry => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{entry.orderId}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{sym}{(entry.total || 0).toFixed(2)}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--primary-light)' }}>{sym}{(entry.tax || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No POS sale audit entries found.
            </div>
          )}
        </div>
      )}

      {/* Filing Summary Tab */}
      {activeTab === 'filing' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Filing Period</label>
              <select className="form-control" value={filingPeriod} onChange={e => setFilingPeriod(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Period</label>
              <input className="form-control" type="month" value={filingDate} onChange={e => setFilingDate(e.target.value)} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingBottom: 6 }}>
              Filing deadline: <strong style={{ color: '#F59E0B' }}>{filingSummary.deadline}</strong>
              {taxConfig.gstNumber && <span style={{ marginLeft: 12 }}>GST/HST #: <strong>{taxConfig.gstNumber}</strong></span>}
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Sales Transactions',  value: filingSummary.orderCount,                                                  color: '#4F46E5', prefix: '' },
              { label: 'GST Collected',       value: filingSummary.collected.gst.toFixed(2),                                    color: '#10B981', prefix: '$' },
              { label: 'HST Collected',       value: filingSummary.collected.hst.toFixed(2),                                    color: '#10B981', prefix: '$' },
              { label: 'PST/QST Collected',   value: (filingSummary.collected.pst + filingSummary.collected.qst).toFixed(2),    color: '#3B82F6', prefix: '$' },
              { label: 'Total Tax Collected', value: filingSummary.collected.total.toFixed(2),                                  color: '#8B5CF6', prefix: '$' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.prefix}{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ITC Section */}
          <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: '#10B981' }}>
              Input Tax Credits (ITC) — GST/HST Paid to Suppliers
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Purchase Orders Received ({filingSummary.poCount})</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GST/HST paid on supplier invoices — recoverable as ITC</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#10B981' }}>${filingSummary.itc.toFixed(2)}</div>
            </div>
            <div style={{ padding: '10px 0', fontSize: 12, color: 'var(--text-muted)' }}>
              ITC reduces your federal remittance. Only GST/HST on legitimate business purchases qualifies.
              PST/QST paid to suppliers is generally <em>not</em> recoverable.
            </div>
          </div>

          {/* Net Remittance */}
          <div className="card" style={{ background: 'rgba(79,70,229,0.08)', border: '2px solid rgba(79,70,229,0.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>GST/HST Net Remittance to CRA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>Federal Tax Collected (GST + HST)</span>
                <span style={{ fontWeight: 700 }}>${filingSummary.federalCollected.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>Less: Input Tax Credits (ITC)</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>− ${filingSummary.itc.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>Net Amount Owing to CRA</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: filingSummary.netRemittance > 0 ? '#EF4444' : '#10B981' }}>
                  ${filingSummary.netRemittance.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 12, color: 'var(--text-muted)' }}>
              File and remit by <strong style={{ color: '#F59E0B' }}>{filingSummary.deadline}</strong>.
              Use CRA My Business Account or NETFILE to submit your GST/HST return.
            </div>
          </div>
        </div>
      )}

      {/* Compliance Guide Tab */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Section A — Tax Number Validator */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>A — GST/HST &amp; QST Number Validator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* GST/HST */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120 }}>GST/HST Number</span>
                  {taxConfig.gstNumber
                    ? validateGSTNumber(taxConfig.gstNumber)
                      ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Valid format</span>
                      : <span style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✗ Format invalid</span>
                    : <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>— Not entered</span>
                  }
                  {taxConfig.gstNumber && <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{taxConfig.gstNumber}</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 130 }}>Format: 9 digits + RT + 4 digits (e.g. 123456789RT0001)</div>
              </div>
              {/* QST */}
              {taxConfig.province === 'QC' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120 }}>QST Number</span>
                    {taxConfig.qstNumber
                      ? validateQSTNumber(taxConfig.qstNumber)
                        ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Valid format</span>
                        : <span style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✗ Format invalid</span>
                      : <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>— Not entered</span>
                    }
                    {taxConfig.qstNumber && <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{taxConfig.qstNumber}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 130 }}>Format: 10 digits + TQ + 4 digits (e.g. 1234567890TQ0001)</div>
                </div>
              )}
              {/* PST */}
              {['BC', 'MB', 'SK'].includes(taxConfig.province) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120 }}>PST Number</span>
                    {taxConfig.pstNumber
                      ? validatePSTNumber(taxConfig.pstNumber)
                        ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Valid format</span>
                        : <span style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✗ Too short</span>
                      : <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>— Not entered</span>
                    }
                    {taxConfig.pstNumber && <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{taxConfig.pstNumber}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 130 }}>PST formats vary by province — at least 4 characters required</div>
                </div>
              )}
            </div>
          </div>

          {/* Section B — Filing Frequency Recommendation */}
          <div className="card" style={{ padding: 20, border: '2px solid rgba(79,70,229,0.3)', background: 'rgba(79,70,229,0.05)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>B — Filing Frequency Recommendation</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary-light)' }}>{filingFrequency}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Based on {new Date().getFullYear()} revenue of <strong>{sym}{annualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{filingFrequencyNote}</div>
          </div>

          {/* Section C — Annual Remittance Calendar */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>C — Annual Remittance Calendar ({new Date().getFullYear()})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Period', 'Filing For', 'Due Date', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {remittanceCalendar.map((row, i) => {
                    const today = new Date();
                    const daysUntil = Math.ceil((row.due - today) / (1000 * 60 * 60 * 24));
                    const isPast = row.due < today;
                    const isSoon = !isPast && daysUntil <= 14;
                    const statusColor = isPast ? '#10B981' : isSoon ? '#F59E0B' : 'var(--text-muted)';
                    const statusLabel = isPast ? '✓ Filed' : isSoon ? '⚠ Due Soon' : 'Upcoming';
                    const statusBg = isPast ? 'rgba(16,185,129,0.1)' : isSoon ? 'rgba(245,158,11,0.12)' : 'var(--bg-tertiary)';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{row.label}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{row.period}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>{row.due.toISOString().slice(0, 10)}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{statusLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D — CRA Invoice Requirements */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>D — CRA Tax Invoice Requirements</h3>
            <div style={{ overflowX: 'auto', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '7px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, width: 200 }}>Transaction Amount</th>
                    <th style={{ textAlign: 'left', padding: '7px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Required on Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { amount: 'Any amount', required: 'Date, supplier name, description of goods/services' },
                    { amount: '$30 or more', required: 'Total amount paid, GST/HST paid OR statement that GST/HST is included, your GST/HST registration number' },
                    { amount: '$150 or more', required: 'Customer name/business name, payment terms' },
                  ].map(row => (
                    <tr key={row.amount} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--primary-light)' }}>{row.amount}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>+ {row.required}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid rgba(16,185,129,0.2)' }}>
              Your receipts currently include: <strong>✓ Date</strong> &nbsp;·&nbsp; <strong>✓ Total</strong> &nbsp;·&nbsp; <strong>✓ GST/HST breakdown</strong> &nbsp;·&nbsp; <strong>{taxConfig.gstNumber ? '✓' : '—'} GST# {taxConfig.gstNumber ? `(${taxConfig.gstNumber})` : '(not set)'}</strong>
            </div>
          </div>

          {/* Section E — Zero-Rated vs Exempt */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>E — Zero-Rated vs Exempt Distinction</h3>
            <p style={{ fontSize: 12, color: '#F59E0B', marginBottom: 14, fontWeight: 600 }}>Critical distinction — these are NOT the same. Confusing them affects your Input Tax Credit claims.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 14, background: 'rgba(16,185,129,0.04)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#10B981', marginBottom: 10 }}>Zero-Rated (0%)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, marginBottom: 12 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tax charged:</span> <strong>0%</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>ITC claimable:</span> <strong style={{ color: '#10B981' }}>✅ YES — you CAN claim Input Tax Credits</strong></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Examples:</div>
                  {['Basic groceries', 'Prescription drugs', 'Medical devices', 'Agricultural products', 'Exports', 'Fishing equipment & supplies'].map(e => (
                    <div key={e} style={{ padding: '2px 0' }}>• {e}</div>
                  ))}
                </div>
              </div>
              <div style={{ border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 14, background: 'rgba(239,68,68,0.03)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#EF4444', marginBottom: 10 }}>Exempt (No Tax)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, marginBottom: 12 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tax charged:</span> <strong>None</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>ITC claimable:</span> <strong style={{ color: '#EF4444' }}>❌ NO — you CANNOT claim ITC</strong></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Examples:</div>
                  {['Residential rent', 'Financial services (loans, deposits, life insurance)', 'Healthcare services (doctors, dentists)', 'Educational services (tuition)', 'Legal aid services'].map(e => (
                    <div key={e} style={{ padding: '2px 0' }}>• {e}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section F — Provincial Remittance Authorities */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>F — Provincial Remittance Authorities</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Tax', 'Authority', 'Filing Method'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tax: 'GST (federal)', authority: 'Canada Revenue Agency (CRA)', method: 'NETFILE, My Business Account', provinces: ['AB','BC','MB','NT','NU','ON','PE','SK','YT','NB','NL','NS'] },
                    { tax: 'HST (harmonized)', authority: 'Canada Revenue Agency (CRA)', method: 'NETFILE, My Business Account', provinces: ['ON','NB','NL','NS','PE'] },
                    { tax: 'QST (Quebec)', authority: 'Revenu Québec', method: 'clicSEQUR-entreprises', provinces: ['QC'] },
                    { tax: 'PST (BC)', authority: 'BC Ministry of Finance', method: 'eTaxBC', provinces: ['BC'] },
                    { tax: 'RST (Manitoba)', authority: 'Manitoba Tax Administration', method: 'TAXcess', provinces: ['MB'] },
                    { tax: 'PST (Saskatchewan)', authority: 'Saskatchewan Finance', method: 'Saskatchewan eTax Services', provinces: ['SK'] },
                  ].map(row => {
                    const isActive = row.provinces.includes(taxConfig.province);
                    return (
                      <tr key={row.tax} style={{
                        borderBottom: '1px solid var(--border)',
                        background: isActive ? 'rgba(79,70,229,0.08)' : 'transparent',
                      }}>
                        <td style={{ padding: '8px 10px', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                          {isActive && <span style={{ marginRight: 6 }}>▶</span>}{row.tax}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{row.authority}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{row.method}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              ▶ Highlighted rows apply to your selected province: <strong>{taxConfig.province}</strong>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
