import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart,
  AlertTriangle, Activity, Zap, ArrowRight, Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SALES_DATA, WEEKLY_SALES } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

const getCurrencySymbol = (code) => {
  const s = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥', INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼' };
  return s[code] || code + ' ';
};


const StatCard = ({ label, value, change, icon: Icon, color, bg, prefix = '' }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{prefix}{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, currencySymbol = '$' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name === 'orders' ? p.value : `${currencySymbol}${p.value.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { products, orders, currency, aiMetrics, aiIssues } = useApp();
  const navigate = useNavigate();
  const [chartView, setChartView] = useState('monthly');

  const currencySymbol = getCurrencySymbol(currency);

  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  const outOfStock = products.filter(p => p.stock === 0);
  const expiringItems = products.filter(p => p.status === 'expiring_soon');
  const totalInventoryValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0);
  const criticalIssues = aiIssues.filter(i => i.severity === 'critical' && i.status === 'pending');

  const healthColor = aiMetrics.healthScore >= 80 ? '#10B981' : aiMetrics.healthScore >= 60 ? '#F59E0B' : '#EF4444';

  const completedOrders = orders.filter(o => o.status === 'completed');
  const today = new Date().toDateString();
  const ordersToday = completedOrders.filter(o => new Date(o.date).toDateString() === today).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const thisMonthRevenue = completedOrders
    .filter(o => { const d = new Date(o.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((s, o) => s + (o.total || 0), 0);
  const prevMonthRevenue = completedOrders
    .filter(o => { const d = new Date(o.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; })
    .reduce((s, o) => s + (o.total || 0), 0);
  const revenueChange = prevMonthRevenue > 0
    ? parseFloat(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1))
    : 0;

  const CATEGORY_COLORS = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0284C7', '#06B6D4'];
  const categoryBreakdown = useMemo(() => {
    const counts = products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {});
    return Object.entries(counts).slice(0, 7).map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i] }));
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const topProducts = useMemo(() => [...products]
    .sort((a, b) => ((b.salePrice - b.purchasePrice) / b.salePrice) - ((a.salePrice - a.purchasePrice) / a.salePrice))
    .slice(0, 5), [products]);

  return (
    <div>
      {/* AI Health Alert Banner */}
      {criticalIssues.length > 0 && (
        <div
          onClick={() => navigate('/ai-guardian')}
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius)',
            padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 20, cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>
              {criticalIssues.length} Critical AI Alert{criticalIssues.length > 1 ? 's' : ''} Require Attention
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {criticalIssues[0].title} — Click to view AI Guardian
            </p>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--danger)' }} />
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard
          label="Monthly Revenue" value={Math.round(thisMonthRevenue)} prefix={currencySymbol}
          change={revenueChange} icon={DollarSign}
          color="#10B981" bg="rgba(16,185,129,0.12)"
        />
        <StatCard
          label="Total Products" value={totalProducts}
          change={2.1} icon={Package}
          color="#4F46E5" bg="rgba(79,70,229,0.12)"
        />
        <StatCard
          label="Orders Today" value={ordersToday}
          change={undefined} icon={ShoppingCart}
          color="#06B6D4" bg="rgba(6,182,212,0.12)"
        />
        <StatCard
          label="Inventory Value" value={Math.round(totalInventoryValue)} prefix={currencySymbol}
          change={-1.2} icon={Activity}
          color="#F59E0B" bg="rgba(245,158,11,0.12)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-3-1 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue & Profit</span>
            <div className="tabs" style={{ marginBottom: 0, padding: 3 }}>
              <button className={`tab ${chartView === 'monthly' ? 'active' : ''}`} style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setChartView('monthly')}>Monthly</button>
              <button className={`tab ${chartView === 'weekly' ? 'active' : ''}`} style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setChartView('weekly')}>Weekly</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {chartView === 'monthly' ? (
              <AreaChart data={SALES_DATA}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${(v/1000).toFixed(0)}k`} />
                <Tooltip content={(props) => <CustomTooltip {...props} currencySymbol={currencySymbol} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" fill="url(#profGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={WEEKLY_SALES}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${currencySymbol}${(v/1000).toFixed(1)}k`} />
                <Tooltip content={(props) => <CustomTooltip {...props} currencySymbol={currencySymbol} />} />
                <Bar dataKey="sales" name="Sales" fill="#4F46E5" radius={[4,4,0,0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">By Category</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {categoryBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => val} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {categoryBreakdown.slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-3-1">
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Products by Margin</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory')}>
              <Eye size={13} /> View All
            </button>
          </div>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(p => {
                const margin = p.salePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.salePrice * 100).toFixed(0) : '0';
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="chip">{p.category}</span></td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}`}>
                        {p.stock.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Alerts & AI Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Health Score */}
          <div className="ai-card" onClick={() => navigate('/ai-guardian')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Zap size={14} style={{ display: 'inline', marginRight: 5, color: '#818CF8' }} />
                AI Health Score
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: healthColor, lineHeight: 1 }}>
                {aiMetrics.healthScore}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>/100</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Performance', value: aiMetrics.performanceScore, color: '#4F46E5' },
                { label: 'Security', value: aiMetrics.securityScore, color: '#EF4444' },
                { label: 'Stability', value: aiMetrics.stabilityScore, color: '#10B981' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: m.color }}>{m.value}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts summary */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Stock Alerts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Low Stock Items</span>
                <span className="badge badge-warning">{lowStockItems.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Out of Stock</span>
                <span className="badge badge-danger">{outOfStock.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Expiring Soon</span>
                <span className="badge badge-info">{expiringItems.length}</span>
              </div>
              <div className="divider" style={{ margin: '8px 0' }} />
              <button className="btn btn-secondary btn-sm w-full" onClick={() => navigate('/inventory')} style={{ justifyContent: 'center' }}>
                View Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
