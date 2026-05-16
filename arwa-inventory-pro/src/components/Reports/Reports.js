import React, { useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SALES_DATA, WEEKLY_SALES } from '../../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name === 'orders' ? p.value : `$${p.value?.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const { products, orders } = useApp();
  const [period, setPeriod] = useState('yearly');
  const [activeReport, setActiveReport] = useState('sales');

  const totalRevenue = SALES_DATA.reduce((s, m) => s + m.revenue, 0);
  const totalProfit = SALES_DATA.reduce((s, m) => s + m.profit, 0);
  const totalOrders = SALES_DATA.reduce((s, m) => s + m.orders, 0);
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const data = period === 'yearly' ? SALES_DATA : WEEKLY_SALES;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports & Analytics</h1>
          <p>Comprehensive business intelligence and performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Export PDF</button>
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Export Excel</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Annual Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}k`, change: '+18.3%', color: '#10B981', icon: DollarSign, bg: 'rgba(16,185,129,0.12)' },
          { label: 'Annual Profit', value: `$${(totalProfit / 1000).toFixed(0)}k`, change: '+22.1%', color: '#4F46E5', icon: TrendingUp, bg: 'rgba(79,70,229,0.12)' },
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
          <div className="card">
            <div className="card-header"><span className="card-title">Revenue vs Profit Trend</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data}>
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
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4F46E5" fill="url(#revG)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" fill="url(#profG)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Order Volume</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={period === 'yearly' ? 'month' : 'day'} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="orders" fill="#06B6D4" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'inventory' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Inventory Status Report</span></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Value ($)</th>
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
                      <td>${parseFloat(value).toLocaleString()}</td>
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
      )}

      {activeReport === 'profit' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Profit & Loss Analysis</span></div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={SALES_DATA} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" radius={[3,3,0,0]} />
              <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeReport === 'orders' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Transactions</span></div>
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
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.id}</td>
                  <td style={{ fontWeight: 600 }}>{o.customer}</td>
                  <td>{o.items}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>${o.total.toFixed(2)}</td>
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
        </div>
      )}
    </div>
  );
}
