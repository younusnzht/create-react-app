import React, { useState, useMemo } from 'react';
import { Users, DollarSign, Plus, FileText, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

// 2026 Canada federal rates
const CPP_RATE        = 0.0595;
const CPP_EXEMPTION   = 3500;
const CPP_MAX_ANNUAL  = 73200;
const EI_RATE         = 0.0166;
const EI_MAX_ANNUAL   = 63200;
const BPA             = 16129; // Basic Personal Amount

function calcFederalTax(annualIncome) {
  const taxable = Math.max(0, annualIncome - BPA);
  let tax = 0;
  if (taxable <= 57375)            tax = taxable * 0.15;
  else if (taxable <= 114750)      tax = 57375 * 0.15 + (taxable - 57375)  * 0.205;
  else if (taxable <= 158519)      tax = 57375 * 0.15 + 57375 * 0.205 + (taxable - 114750) * 0.26;
  else if (taxable <= 220000)      tax = 57375 * 0.15 + 57375 * 0.205 + 43769 * 0.26 + (taxable - 158519) * 0.29;
  else                             tax = 57375 * 0.15 + 57375 * 0.205 + 43769 * 0.26 + 61481 * 0.29 + (taxable - 220000) * 0.33;
  return tax;
}

function calcDeductions(grossPay, payPeriod) {
  // Convert to annual for bracket calc
  const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
  const n = periods[payPeriod] || 26;
  const annual = grossPay * n;

  // CPP
  const cppAnnualEarnings = Math.min(annual, CPP_MAX_ANNUAL) - CPP_EXEMPTION;
  const cppAnnual = Math.max(0, cppAnnualEarnings * CPP_RATE);
  const cpp = parseFloat((cppAnnual / n).toFixed(2));

  // EI
  const eiAnnual = Math.min(annual, EI_MAX_ANNUAL) * EI_RATE;
  const ei = parseFloat((eiAnnual / n).toFixed(2));

  // Federal income tax (simplified — no provincial tax in this MVP)
  const fedAnnual = calcFederalTax(annual);
  const fedTax = parseFloat((fedAnnual / n).toFixed(2));

  const totalDeductions = cpp + ei + fedTax;
  const netPay = parseFloat((grossPay - totalDeductions).toFixed(2));

  return { cpp, ei, fedTax, totalDeductions, netPay };
}

function PayForm({ users, onSave, onClose }) {
  const [form, setForm] = useState({
    employeeId: '', employeeName: '', payPeriod: 'biweekly',
    periodStart: '', periodEnd: '', grossPay: '',
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmployee = (id) => {
    const u = users.find(u => String(u.id) === String(id));
    setF('employeeId', id);
    setF('employeeName', u?.name || '');
  };

  const gross = parseFloat(form.grossPay) || 0;
  const deductions = gross > 0 ? calcDeductions(gross, form.payPeriod) : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">New Pay Record</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select className="form-control" value={form.employeeId} onChange={e => handleEmployee(e.target.value)}>
              <option value="">Select employee…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Pay Period</label>
            <select className="form-control" value={form.payPeriod} onChange={e => setF('payPeriod', e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="semimonthly">Semi-Monthly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Period Start</label>
            <input className="form-control" type="date" value={form.periodStart} onChange={e => setF('periodStart', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Period End</label>
            <input className="form-control" type="date" value={form.periodEnd} onChange={e => setF('periodEnd', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">Gross Pay (CA$) *</label>
            <input className="form-control" type="number" min="0" step="0.01" placeholder="e.g. 1800.00" value={form.grossPay} onChange={e => setF('grossPay', e.target.value)} />
          </div>
        </div>

        {deductions && (
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Calculated Deductions (2026 rates)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Gross Pay',              `CA$${gross.toFixed(2)}`,                     ''],
                ['CPP (5.95%)',            `− CA$${deductions.cpp.toFixed(2)}`,           '#F59E0B'],
                ['EI (1.66%)',             `− CA$${deductions.ei.toFixed(2)}`,            '#F59E0B'],
                ['Federal Tax',            `− CA$${deductions.fedTax.toFixed(2)}`,        '#EF4444'],
                ['Net Pay',                `CA$${deductions.netPay.toFixed(2)}`,          '#10B981'],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4, borderBottom: label === 'Federal Tax' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: color || 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            if (!form.employeeId || !form.grossPay) return;
            const d = deductions || calcDeductions(gross, form.payPeriod);
            onSave({ ...form, ...d, grossPay: gross, id: Date.now(), createdAt: new Date().toISOString() });
          }}>
            <DollarSign size={14} /> Save Pay Record
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Payroll() {
  const { users, payrollRecords, addPayrollRecord, businessName } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [empFilter, setEmpFilter] = useState('all');

  const employees = useMemo(() => {
    const seen = new Set();
    return (payrollRecords || []).reduce((arr, r) => {
      if (!seen.has(r.employeeId)) { seen.add(r.employeeId); arr.push({ id: r.employeeId, name: r.employeeName }); }
      return arr;
    }, []);
  }, [payrollRecords]);

  const filtered = useMemo(() =>
    (payrollRecords || [])
      .filter(r => {
        const y = new Date(r.createdAt || '').getFullYear().toString();
        return (yearFilter === 'all' || y === yearFilter) && (empFilter === 'all' || r.employeeId === empFilter);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [payrollRecords, yearFilter, empFilter]
  );

  const totals = useMemo(() => filtered.reduce((s, r) => ({
    gross: s.gross + (r.grossPay || 0),
    cpp:   s.cpp   + (r.cpp     || 0),
    ei:    s.ei    + (r.ei      || 0),
    tax:   s.tax   + (r.fedTax  || 0),
    net:   s.net   + (r.netPay  || 0),
  }), { gross: 0, cpp: 0, ei: 0, tax: 0, net: 0 }), [filtered]);

  const exportT4 = () => {
    // Summarise per employee for T4 slip
    const byEmployee = {};
    (payrollRecords || [])
      .filter(r => new Date(r.createdAt || '').getFullYear().toString() === yearFilter)
      .forEach(r => {
        if (!byEmployee[r.employeeId]) byEmployee[r.employeeId] = { name: r.employeeName, box14: 0, box22: 0, box16: 0, box18: 0 };
        byEmployee[r.employeeId].box14 += r.grossPay || 0;
        byEmployee[r.employeeId].box22 += r.fedTax   || 0;
        byEmployee[r.employeeId].box16 += r.cpp      || 0;
        byEmployee[r.employeeId].box18 += r.ei       || 0;
      });
    const rows = [
      ['T4 Statement of Remuneration Paid', yearFilter],
      ['Employer', businessName || 'Arwa Enterprises'],
      [],
      ['Employee Name','Box 14 - Employment Income','Box 22 - Income Tax Deducted','Box 16 - CPP Contributions','Box 18 - EI Premiums','Box 26 - CPP Pensionable Earnings','Box 24 - EI Insurable Earnings'],
      ...Object.values(byEmployee).map(e => [
        e.name,
        e.box14.toFixed(2),
        e.box22.toFixed(2),
        e.box16.toFixed(2),
        e.box18.toFixed(2),
        e.box14.toFixed(2),  // simplified: CPP pensionable = employment income
        Math.min(e.box14, 63200).toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `T4_${yearFilter}_${businessName || 'Arwa'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const years = [...new Set((payrollRecords || []).map(r => new Date(r.createdAt || '').getFullYear()))].sort((a, b) => b - a);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Payroll</h1>
          <p>Track employee pay, CPP/EI deductions, and generate T4 slips</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportT4}><FileText size={14} /> Export T4 ({yearFilter})</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> New Pay Record</button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Gross Pay',    value: totals.gross, color: '#4F46E5' },
          { label: 'CPP Deducted',value: totals.cpp,   color: '#F59E0B' },
          { label: 'EI Deducted', value: totals.ei,    color: '#F59E0B' },
          { label: 'Income Tax',  value: totals.tax,   color: '#EF4444' },
          { label: 'Net Pay',     value: totals.net,   color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>CA${s.value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: 120 }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
            <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
          </select>
          <select className="form-control" style={{ width: 180 }} value={empFilter} onChange={e => setEmpFilter(e.target.value)}>
            <option value="all">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No pay records yet. Click "New Pay Record" to add one.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Employee','Period','Gross Pay','CPP','EI','Fed. Tax','Net Pay','Date'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.employeeName}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 11 }}>{r.periodStart} – {r.periodEnd}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>CA${(r.grossPay||0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', color: '#F59E0B' }}>CA${(r.cpp||0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', color: '#F59E0B' }}>CA${(r.ei||0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', color: '#EF4444' }}>CA${(r.fedTax||0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#10B981' }}>CA${(r.netPay||0).toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{r.createdAt?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <PayForm users={users} onSave={r => { addPayrollRecord(r); setShowForm(false); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}
