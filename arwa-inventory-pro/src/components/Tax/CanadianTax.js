import React, { useState } from 'react';
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
  const { taxConfig, setTaxConfig, showToast, currency, auditLog } = useApp();
  const sym = getCurrencySymbol(currency || 'USD');

  const [form, setForm] = useState({ ...taxConfig });
  const [previewAmount, setPreviewAmount] = useState('100');

  const handleSave = () => {
    setTaxConfig(form);
    showToast('Tax configuration saved', 'success');
  };

  const previewTax = calcTax(parseFloat(previewAmount) || 0, form.province);
  const taxSaleEntries = auditLog.filter(e => e.action === 'POS_SALE').slice(0, 20);

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

      {taxSaleEntries.length > 0 && (
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
      )}
    </div>
  );
}
