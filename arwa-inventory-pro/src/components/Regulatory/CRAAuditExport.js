import React, { useState, useMemo } from 'react';
import { Download, FileText, Shield, Search, Calendar } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function CRAAuditExport() {
  const { orders, taxConfig, businessName, currency } = useApp();
  const sym = currency === 'CAD' ? 'CA$' : '$';

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00');
    const to   = new Date(dateTo   + 'T23:59:59');
    return (orders || [])
      .filter(o => {
        const d = new Date(o.date || o.createdAt || '');
        return d >= from && d <= to;
      })
      .filter(o => !search || (o.id || '').toString().toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [orders, dateFrom, dateTo, search]);

  const totals = useMemo(() => filtered.reduce((s, o) => {
    const tb = o.taxBreakdown || {};
    return {
      subtotal: s.subtotal + (o.subtotal || o.total || 0) - (tb.total || 0),
      gst:      s.gst      + (tb.gst  || 0),
      hst:      s.hst      + (tb.hst  || 0),
      pst:      s.pst      + (tb.pst  || 0),
      qst:      s.qst      + (tb.qst  || 0),
      total:    s.total    + (o.total  || 0),
    };
  }, { subtotal: 0, gst: 0, hst: 0, pst: 0, qst: 0, total: 0 }), [filtered]);

  const exportCRACsv = () => {
    const biz = businessName || 'Arwa Enterprises';
    const rows = [
      ['CRA GST/HST Audit File'],
      ['Business Name', biz],
      ['GST/HST Number', taxConfig?.gstNumber || 'N/A'],
      ['Province', taxConfig?.province || 'ON'],
      ['Period', `${dateFrom} to ${dateTo}`],
      ['Generated', new Date().toISOString()],
      [],
      ['Receipt #','Date','Customer','Payment Method','Subtotal','GST','HST','PST','QST','Tax Total','Grand Total','Items'],
      ...filtered.map(o => {
        const tb = o.taxBreakdown || {};
        const sub = (o.subtotal || o.total || 0) - (tb.total || 0);
        const items = (o.items || o.cart || []).map(i => `${i.name || i.productName} x${i.qty || i.quantity || 1}`).join('; ');
        return [
          o.id || '',
          (o.date || o.createdAt || '').slice(0, 10),
          o.customerName || o.customer || 'Walk-in',
          o.paymentMethod || 'cash',
          sub.toFixed(2),
          (tb.gst  || 0).toFixed(2),
          (tb.hst  || 0).toFixed(2),
          (tb.pst  || 0).toFixed(2),
          (tb.qst  || 0).toFixed(2),
          (tb.total || 0).toFixed(2),
          (o.total || 0).toFixed(2),
          `"${items}"`,
        ];
      }),
      [],
      ['TOTALS','','','',
        totals.subtotal.toFixed(2),
        totals.gst.toFixed(2),
        totals.hst.toFixed(2),
        totals.pst.toFixed(2),
        totals.qst.toFixed(2),
        (totals.gst + totals.hst + totals.pst + totals.qst).toFixed(2),
        totals.total.toFixed(2),
      ],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `CRA_Audit_${dateFrom}_to_${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSAFT = () => {
    const biz = businessName || 'Arwa Enterprises';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:StandardAuditFile-Taxation:CA_2.0">
  <Header>
    <AuditFileVersion>2.0</AuditFileVersion>
    <Company>${biz}</Company>
    <TaxRegistrationNumber>${taxConfig?.gstNumber || ''}</TaxRegistrationNumber>
    <Province>${taxConfig?.province || 'ON'}</Province>
    <DateCreated>${new Date().toISOString()}</DateCreated>
    <StartDate>${dateFrom}</StartDate>
    <EndDate>${dateTo}</EndDate>
    <TotalTransactions>${filtered.length}</TotalTransactions>
    <TotalGSTCollected>${totals.gst.toFixed(2)}</TotalGSTCollected>
    <TotalHSTCollected>${totals.hst.toFixed(2)}</TotalHSTCollected>
    <TotalRevenue>${totals.total.toFixed(2)}</TotalRevenue>
  </Header>
  <SalesTransactions>
${filtered.map(o => {
  const tb = o.taxBreakdown || {};
  const sub = (o.subtotal || o.total || 0) - (tb.total || 0);
  return `    <Transaction>
      <TransactionID>${o.id || ''}</TransactionID>
      <Date>${(o.date || o.createdAt || '').slice(0, 10)}</Date>
      <Customer>${o.customerName || o.customer || 'Walk-in'}</Customer>
      <PaymentMethod>${o.paymentMethod || 'cash'}</PaymentMethod>
      <Subtotal>${sub.toFixed(2)}</Subtotal>
      <GST>${(tb.gst || 0).toFixed(2)}</GST>
      <HST>${(tb.hst || 0).toFixed(2)}</HST>
      <PST>${(tb.pst || 0).toFixed(2)}</PST>
      <QST>${(tb.qst || 0).toFixed(2)}</QST>
      <Total>${(o.total || 0).toFixed(2)}</Total>
    </Transaction>`;
}).join('\n')}
  </SalesTransactions>
</AuditFile>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SAF-T_${dateFrom}_to_${dateTo}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>CRA Audit Export</h1>
          <p>Generate CRA-compliant books &amp; records export for GST/HST audit</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportSAFT}><FileText size={14} /> SAF-T XML</button>
          <button className="btn btn-primary" onClick={exportCRACsv}><Download size={14} /> CRA CSV Export</button>
        </div>
      </div>

      {/* Business info banner */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.3)' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
          <span><Shield size={13} style={{ marginRight: 5, color: 'var(--primary-light)' }} /><strong>Business:</strong> {businessName || 'Arwa Enterprises'}</span>
          <span><strong>GST/HST #:</strong> {taxConfig?.gstNumber || <span style={{ color: '#F59E0B' }}>Not set — add in Tax Settings</span>}</span>
          {taxConfig?.qstNumber && <span><strong>QST #:</strong> {taxConfig.qstNumber}</span>}
          <span><strong>Province:</strong> {taxConfig?.province || 'ON'}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label"><Calendar size={11} /> From</label>
            <input className="form-control" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To</label>
            <input className="form-control" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label"><Search size={11} /> Receipt #</label>
            <input className="form-control" placeholder="Filter by receipt number…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ fontSize: 13, paddingBottom: 6, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> transactions in period
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Subtotal',     value: totals.subtotal, color: '#4F46E5' },
          { label: 'GST Collected',value: totals.gst,      color: '#10B981' },
          { label: 'HST Collected',value: totals.hst,      color: '#10B981' },
          { label: 'PST Collected',value: totals.pst,      color: '#3B82F6' },
          { label: 'QST Collected',value: totals.qst,      color: '#8B5CF6' },
          { label: 'Grand Total',  value: totals.total,    color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: s.color }}>{sym}{s.value.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No transactions in the selected date range.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Receipt #','Date','Customer','Payment','Subtotal','GST','HST','PST','QST','Total'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const tb = o.taxBreakdown || {};
                const sub = (o.subtotal || o.total || 0) - (tb.total || 0);
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{o.id}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{(o.date || o.createdAt || '').slice(0, 10)}</td>
                    <td style={{ padding: '7px 10px' }}>{o.customerName || o.customer || 'Walk-in'}</td>
                    <td style={{ padding: '7px 10px', textTransform: 'capitalize' }}>{o.paymentMethod || 'cash'}</td>
                    <td style={{ padding: '7px 10px' }}>{sym}{sub.toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', color: '#10B981' }}>{(tb.gst || 0) > 0 ? `${sym}${(tb.gst || 0).toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '7px 10px', color: '#10B981' }}>{(tb.hst || 0) > 0 ? `${sym}${(tb.hst || 0).toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '7px 10px', color: '#3B82F6' }}>{(tb.pst || 0) > 0 ? `${sym}${(tb.pst || 0).toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '7px 10px', color: '#8B5CF6' }}>{(tb.qst || 0) > 0 ? `${sym}${(tb.qst || 0).toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 700 }}>{sym}{(o.total || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
