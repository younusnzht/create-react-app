import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SALES_DATA, WEEKLY_SALES } from '../../data/mockData';
import { calcRealCOGS, classifyABC, findDeadStock, calcReorderAnalysis } from '../../services/costingEngine';

const COLORS = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0284C7', '#06B6D4', '#8B5CF6'];

const getCurrencySymbol = (code) => {
  const s = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥', INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼' };
  return s[code] || code + ' ';
};

const CustomTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>
          {p.name}: {(p.name === 'orders' || p.name === 'transactions') ? p.value : `${currencySymbol}${p.value?.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

const handleExportCSV = (data, filename) => {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0] || {});
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const { products, orders, currency, showToast, auditLog, stockMovements } = useApp();
  const [period, setPeriod] = useState('yearly');
  const [activeReport, setActiveReport] = useState('sales');

  const currencySymbol = getCurrencySymbol(currency);
  const sym = currencySymbol;

  const totalRevenue = SALES_DATA.reduce((s, m) => s + m.revenue, 0);
  const totalRevenueFromOrders = useMemo(() => orders.reduce((s, o) => s + (o.total || 0), 0), [orders]);
  const realCOGS = useMemo(() => calcRealCOGS(orders, products), [orders, products]);
  const grossProfit = totalRevenueFromOrders - realCOGS;
  const grossMargin = totalRevenueFromOrders > 0 ? (grossProfit / totalRevenueFromOrders * 100) : 0;
  const totalProfit = SALES_DATA.reduce((s, m) => s + m.profit, 0);
  const totalOrders = SALES_DATA.reduce((s, m) => s + m.orders, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const chartData = period === 'yearly' ? SALES_DATA : WEEKLY_SALES;

  // Inventory stats derived from real products
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Category breakdown from real products
  const categoryData = Object.entries(
    products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {})
  ).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // Recent transactions: real orders sorted by date desc, 10 most recent
  const recentTransactions = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  // Current report data for CSV export
  const getExportData = () => {
    if (activeReport === 'sales') return chartData;
    if (activeReport === 'inventory') return products.map(p => ({
      name: p.name,
      category: p.category,
      stock: p.stock,
      value: (p.stock * p.purchasePrice).toFixed(2),
      margin: (p.salePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.salePrice * 100).toFixed(0) : '0') + '%',
      status: p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'Good',
      supplier: p.supplier,
    }));
    if (activeReport === 'profit') return SALES_DATA;
    if (activeReport === 'orders') return recentTransactions;
    return chartData;
  };

  const handlePrintPDF = () => {
    showToast('Use your browser\'s "Save as PDF" option in the print dialog', 'info');
    window.print();
  };

  const tooltipWithCurrency = (props) => <CustomTooltip {...props} currencySymbol={currencySymbol} />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>Comprehensive business intelligence and performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrintPDF}><Download size={13} /> Export PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExportCSV(getExportData(), `${activeReport}-report`)}><Download size={13} /> Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            // QuickBooks IIF format
            const lines = [
              '!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO',
              '!SPL\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tMEMO',
              '!ENDTRNS',
              ...(orders||[]).flatMap(o => [
                `TRNS\tINVOICE\t${o.date}\tAccounts Receivable\t${o.customer||'Walk-in'}\t${(o.total||0).toFixed(2)}\t${o.id}\tSale`,
                `SPL\tINVOICE\t${o.date}\tSales\t-${(o.total||0).toFixed(2)}\tSale`,
                'ENDTRNS',
              ]),
            ];
            const blob = new Blob([lines.join('\n')],{type:'text/plain'});
            const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='arwa-quickbooks.iif';a.click();URL.revokeObjectURL(url);
          }}>
            QuickBooks Export
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            // Xero CSV format
            const rows = [
              ['*ContactName','*InvoiceNumber','*InvoiceDate','*DueDate','Description','*Quantity','*UnitAmount','*AccountCode','*TaxType'],
              ...(orders||[]).map(o => [
                o.customer||'Walk-in', `INV-${o.id}`, o.date, o.date,
                'Sales', '1', (o.total||0).toFixed(2), '200', 'Tax Exclusive',
              ]),
            ];
            const csv = rows.map(r=>r.join(',')).join('\n');
            const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='arwa-xero.csv';a.click();URL.revokeObjectURL(url);
          }}>
            Xero Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Annual Revenue', value: `${currencySymbol}${(totalRevenue / 1000).toFixed(0)}k`, change: '+18.3%', color: '#10B981', icon: DollarSign, bg: 'rgba(16,185,129,0.12)' },
          { label: 'Annual Profit', value: `${currencySymbol}${(totalProfit / 1000).toFixed(0)}k`, change: '+22.1%', color: '#4F46E5', icon: TrendingUp, bg: 'rgba(79,70,229,0.12)' },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), change: '+14.7%', color: '#06B6D4', icon: ShoppingCart, bg: 'rgba(6,182,212,0.12)' },
          { label: 'Profit Margin', value: `${profitMargin}%`, change: '+2.4%', color: '#F59E0B', icon: Package, bg: 'rgba(245,158,11,0.12)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <k.icon size={20} style={{ color: k.color }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>{k.change} YoY</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Type Tabs */}
      <div className="tabs">
        {['sales', 'inventory', 'profit', 'orders'].map(r => (
          <button key={r} className={`tab ${activeReport === r ? 'active' : ''}`} onClick={() => setActiveReport(r)}>
            {r.charAt(0).toUpperCase() + r.slice(1)} Report
          </button>
        ))}
        <button className={`tab ${activeReport === 'audit' ? 'active' : ''}`} onClick={() => setActiveReport('audit')}>
          Audit Trail
        </button>
        <button className={`tab ${activeReport==='advanced'?'active':''}`} onClick={()=>setActiveReport('advanced')}>Advanced Analytics</button>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 4, borderRadius: 8 }}>
          {['weekly', 'yearly'].map(p => (
            <button key={p} className={`tab ${period === p ? 'active' : ''}`} style={{ padding: '4px 14px', fontSize: 12 }} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeReport === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* COGS & Profit */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="card-title">Cost of Goods Sold (COGS)</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Based on recorded sales</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total Revenue',  value: totalRevenueFromOrders,              color: '#4F46E5' },
                { label: 'Real COGS',      value: realCOGS,                            color: '#EF4444' },
                { label: 'Gross Profit',   value: grossProfit,                         color: '#10B981' },
                { label: 'Gross Margin',   value: null, pct: grossMargin.toFixed(1),   color: '#F59E0B' },
              ].map(s => (
                <div key={s.label} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>
                    {s.pct !== undefined ? `${s.pct}%` : `${currencySymbol}${(s.value||0).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: '#059669' }}>
              ✓ COGS is calculated from actual product purchase prices. Products without purchase prices fall back to 60% of sale price.
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Revenue vs Profit Trend</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={period === 'yearly' ? 'month' : 'day'} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={tooltipWithCurrency} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                {period === 'yearly' ? (
                  <>
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fill="url(#revG)" strokeWidth={2.5} dot={false} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" fill="url(#profG)" strokeWidth={2.5} dot={false} />
                  </>
                ) : (
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#4F46E5" fill="url(#revG)" strokeWidth={2.5} dot={false} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Order Volume</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={period === 'yearly' ? 'month' : 'day'} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={tooltipWithCurrency} />
                {period === 'yearly' ? (
                  <Bar dataKey="orders" name="orders" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                ) : (
                  <Bar dataKey="transactions" name="transactions" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Inventory summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Total Products', value: totalProducts, color: '#4F46E5' },
              { label: 'Total Value', value: `${currencySymbol}${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: '#10B981' },
              { label: 'Low Stock', value: lowStockCount, color: '#F59E0B' },
              { label: 'Out of Stock', value: outOfStockCount, color: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {categoryData.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Category Breakdown</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '8px 0' }}>
                {categoryData.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><span className="card-title">Inventory Status Report</span></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Value ({currencySymbol})</th>
                    <th>Margin</th>
                    <th>Status</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const value = (p.stock * p.purchasePrice).toFixed(2);
                    const margin = ((p.salePrice - p.purchasePrice) / p.salePrice * 100).toFixed(0);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="chip">{p.category}</span></td>
                        <td style={{ fontWeight: 700 }}>{p.stock.toLocaleString()}</td>
                        <td>{currencySymbol}{parseFloat(value).toLocaleString()}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>{margin}%</td>
                        <td>
                          <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>
                            {p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'Good'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.supplier}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'profit' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Profit & Loss Analysis</span></div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={SALES_DATA} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={tooltipWithCurrency} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeReport === 'orders' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Transactions</span></div>
          {recentTransactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No transactions yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id}</td>
                    <td style={{ fontWeight: 600 }}>{o.customer}</td>
                    <td>{o.items}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{currencySymbol}{o.total.toFixed(2)}</td>
                    <td><span className="chip" style={{ textTransform: 'capitalize' }}>{o.payment}</span></td>
                    <td>
                      <span className={`badge ${o.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeReport === 'advanced' && (
        <div>
          {/* ABC Analysis */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>ABC Inventory Analysis</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              A = top 80% of revenue (high priority) · B = next 15% · C = bottom 5% (low priority)
            </p>
            {(() => {
              const abc = classifyABC(products, orders);
              const counts = { A: abc.filter(p=>p.abcClass==='A').length, B: abc.filter(p=>p.abcClass==='B').length, C: abc.filter(p=>p.abcClass==='C').length };
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
                    {[['A','#10B981','rgba(16,185,129,0.12)'],['B','#F59E0B','rgba(245,158,11,0.12)'],['C','#6B7280','rgba(107,114,128,0.12)']].map(([cls,color,bg])=>(
                      <div key={cls} style={{ padding:14, borderRadius:10, background:bg, textAlign:'center' }}>
                        <div style={{ fontSize:22,fontWeight:900,color }}>{counts[cls]} SKUs</div>
                        <div style={{ fontSize:11,color,fontWeight:700 }}>Class {cls}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ borderBottom:'1px solid var(--border)' }}>
                          {['Class','Product','Category','Stock','Revenue','% of Total'].map(h=>(
                            <th key={h} style={{ padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {abc.slice(0,20).map(p=>{
                          const clsColor = p.abcClass==='A'?'#10B981':p.abcClass==='B'?'#F59E0B':'#6B7280';
                          const clsBg   = p.abcClass==='A'?'rgba(16,185,129,0.12)':p.abcClass==='B'?'rgba(245,158,11,0.12)':'rgba(107,114,128,0.12)';
                          return (
                            <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                              <td style={{ padding:'7px 10px' }}>
                                <span style={{ padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700,background:clsBg,color:clsColor }}>{p.abcClass}</span>
                              </td>
                              <td style={{ padding:'7px 10px',fontWeight:600 }}>{p.name}</td>
                              <td style={{ padding:'7px 10px',color:'var(--text-muted)' }}>{p.category||'—'}</td>
                              <td style={{ padding:'7px 10px' }}>{p.stock||0}</td>
                              <td style={{ padding:'7px 10px',fontWeight:700 }}>{sym}{p.revenue.toFixed(2)}</td>
                              <td style={{ padding:'7px 10px' }}>{(p.revenuePct*100).toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Dead Stock */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
              <div>
                <h3 style={{ fontWeight:800,fontSize:15,marginBottom:4 }}>Dead Stock Report</h3>
                <p style={{ fontSize:12,color:'var(--text-muted)' }}>Products with stock on hand but no movement in 60+ days</p>
              </div>
            </div>
            {(() => {
              const dead = findDeadStock(products, stockMovements, 60);
              if (dead.length === 0) return <div style={{ padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:13 }}>No dead stock detected — all products have recent movement.</div>;
              const deadValue = dead.reduce((s,p) => s + (p.stock||0)*(p.purchasePrice||p.price*0.6||0), 0);
              return (
                <div>
                  <div style={{ padding:'10px 14px',marginBottom:12,borderRadius:8,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',fontSize:13,fontWeight:600,color:'#EF4444' }}>
                    {dead.length} products · ${deadValue.toFixed(2)} tied up in dead stock
                  </div>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--border)' }}>
                        {['Product','Category','Stock','Value','Days Since Movement','Last Moved'].map(h=>(
                          <th key={h} style={{ padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dead.map(p=>(
                        <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                          <td style={{ padding:'7px 10px',fontWeight:600 }}>{p.name}</td>
                          <td style={{ padding:'7px 10px',color:'var(--text-muted)' }}>{p.category||'—'}</td>
                          <td style={{ padding:'7px 10px' }}>{p.stock}</td>
                          <td style={{ padding:'7px 10px',fontWeight:700 }}>{sym}{((p.stock||0)*(p.purchasePrice||p.price*0.6||0)).toFixed(2)}</td>
                          <td style={{ padding:'7px 10px' }}>
                            <span style={{ padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700,background:'rgba(239,68,68,0.12)',color:'#EF4444' }}>{p.daysSinceMove === 999 ? 'Never' : `${p.daysSinceMove}d`}</span>
                          </td>
                          <td style={{ padding:'7px 10px',color:'var(--text-muted)' }}>{p.lastMoveDate ? p.lastMoveDate.toISOString().slice(0,10) : 'Never'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Reorder Analysis */}
          <div>
            <h3 style={{ fontWeight:800,fontSize:15,marginBottom:4 }}>Reorder Point Analysis</h3>
            <p style={{ fontSize:12,color:'var(--text-muted)',marginBottom:14 }}>Products at or near minimum stock level — sorted by urgency</p>
            {(() => {
              const reorder = calcReorderAnalysis(products, orders, 30);
              if (reorder.length === 0) return <div style={{ padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:13 }}>All products are above reorder points.</div>;
              return (
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border)' }}>
                      {['Product','Stock','Min Stock','Sold/30d','Days Until Stockout','Suggested Reorder'].map(h=>(
                        <th key={h} style={{ padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reorder.map(p=>{
                      const urgent = p.daysUntilStockout !== null && p.daysUntilStockout <= 7;
                      const warning = p.daysUntilStockout !== null && p.daysUntilStockout <= 14;
                      const dotColor = urgent ? '#EF4444' : warning ? '#F59E0B' : '#6B7280';
                      return (
                        <tr key={p.id} style={{ borderBottom:'1px solid var(--border)' }}>
                          <td style={{ padding:'7px 10px',fontWeight:600 }}>{p.name}</td>
                          <td style={{ padding:'7px 10px',color:dotColor,fontWeight:700 }}>{p.stock||0}</td>
                          <td style={{ padding:'7px 10px',color:'var(--text-muted)' }}>{p.minStock||0}</td>
                          <td style={{ padding:'7px 10px' }}>{p.soldLast30}</td>
                          <td style={{ padding:'7px 10px' }}>
                            {p.daysUntilStockout !== null ? (
                              <span style={{ padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700,background:urgent?'rgba(239,68,68,0.12)':warning?'rgba(245,158,11,0.12)':'rgba(107,114,128,0.12)',color:dotColor }}>
                                {p.daysUntilStockout}d
                              </span>
                            ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ padding:'7px 10px',fontWeight:700,color:'var(--primary-light)' }}>{p.suggestedReorder} units</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {activeReport === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>System Audit Trail</div>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const rows = [['Timestamp','User','Action','Details'], ...(auditLog||[]).map(e => [e.timestamp, e.user||'System', e.action, JSON.stringify(e)])];
              const csv = rows.map(r=>r.join(',')).join('\n');
              const blob = new Blob([csv],{type:'text/csv'});
              const url=URL.createObjectURL(blob);
              const a=document.createElement('a');a.href=url;a.download='audit-log.csv';a.click();URL.revokeObjectURL(url);
            }}>
              Export Audit CSV
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {(!auditLog || auditLog.length === 0) ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No audit entries yet. Actions will be logged here automatically.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                      {['Timestamp','User','Action','Details'].map(h=>(
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(auditLog||[]).slice(0,100).map((e,i)=>(
                      <tr key={e.id||i} style={{ borderBottom:'1px solid var(--border)' }}
                        onMouseEnter={ev=>ev.currentTarget.style.background='var(--bg-tertiary)'}
                        onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'8px 14px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(e.timestamp).toLocaleString()}</td>
                        <td style={{ padding:'8px 14px', fontWeight:600 }}>{e.user||'System'}</td>
                        <td style={{ padding:'8px 14px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:12, fontSize:10, fontWeight:700,
                            background: e.action?.includes('SALE') ? 'rgba(16,185,129,0.12)' : e.action?.includes('DELETE') ? 'rgba(239,68,68,0.12)' : 'rgba(79,70,229,0.12)',
                            color: e.action?.includes('SALE') ? '#10B981' : e.action?.includes('DELETE') ? '#EF4444' : '#4F46E5'
                          }}>{e.action}</span>
                        </td>
                        <td style={{ padding:'8px 14px', color:'var(--text-muted)', maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {Object.entries(e).filter(([k])=>!['id','timestamp','user','action'].includes(k)).map(([k,v])=>`${k}: ${v}`).join(' · ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
