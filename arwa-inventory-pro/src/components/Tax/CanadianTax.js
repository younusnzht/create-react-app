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
    </div>
  );
}
