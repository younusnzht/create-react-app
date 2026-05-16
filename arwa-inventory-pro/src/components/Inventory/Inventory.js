import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Download, Upload, Package, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CATEGORIES, SUPPLIERS } from '../../data/mockData';

const STATUS_CONFIG = {
  active: { label: 'In Stock', cls: 'badge-success' },
  low_stock: { label: 'Low Stock', cls: 'badge-warning' },
  out_of_stock: { label: 'Out of Stock', cls: 'badge-danger' },
  expiring_soon: { label: 'Expiring Soon', cls: 'badge-info' },
};

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', barcode: '', category: CATEGORIES[0],
    supplier: 'PharmaCo Ltd', purchasePrice: '', salePrice: '',
    stock: '', minStock: '', expiry: '', warehouse: 'Main Store',
    tax: 0, status: 'active'
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSku = form.sku || `SKU-${Date.now()}`;
    const newBarcode = form.barcode || `${Date.now()}`;
    onSave({
      ...form,
      sku: newSku,
      barcode: newBarcode,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      salePrice: parseFloat(form.salePrice) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 0,
      tax: parseInt(form.tax) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="icon-btn" onClick={onClose}><span style={{ fontSize: 18 }}>×</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter product name" />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input className="form-control" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Auto-generated if empty" />
            </div>
            <div className="form-group">
              <label className="form-label">Barcode</label>
              <input className="form-control" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Scan or enter barcode" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Purchase Price ($) *</label>
              <input className="form-control" type="number" step="0.01" required value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Price ($) *</label>
              <input className="form-control" type="number" step="0.01" required value={form.salePrice} onChange={e => set('salePrice', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Current Stock *</label>
              <input className="form-control" type="number" required value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock Alert</label>
              <input className="form-control" type="number" value={form.minStock} onChange={e => set('minStock', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select className="form-control" value={form.supplier} onChange={e => set('supplier', e.target.value)}>
                {SUPPLIERS.map(s => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse Location</label>
              <select className="form-control" value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
                {['Main Store', 'Cold Storage', 'Dry Goods', 'Warehouse A', 'Warehouse B'].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Tax (%)</label>
              <input className="form-control" type="number" value={form.tax} onChange={e => set('tax', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-control" type="date" value={form.expiry || ''} onChange={e => set('expiry', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Package size={14} /> {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    });
    if (categoryFilter !== 'All') list = list.filter(p => p.category === categoryFilter);
    if (statusFilter !== 'All') list = list.filter(p => p.status === statusFilter);
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [products, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null;

  const stockStatus = (p) => {
    if (p.stock === 0) return 'out_of_stock';
    if (p.stock <= p.minStock) return 'low_stock';
    return p.status;
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventory Management</h1>
          <p>{products.length} total products across all warehouses</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm">
            <Upload size={13} /> Import CSV
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={13} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Products', value: products.length, color: '#4F46E5', bg: 'rgba(79,70,229,0.12)' },
          { label: 'Low Stock', value: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
          { label: 'Expiring Soon', value: products.filter(p => p.status === 'expiring_soon').length, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search by name, SKU, barcode..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="form-control" style={{ width: 150 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="All">All Status</option>
            <option value="active">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expiring_soon">Expiring Soon</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Product <SortIcon k="name" />
                </th>
                <th>SKU / Barcode</th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Category <SortIcon k="category" />
                </th>
                <th onClick={() => handleSort('salePrice')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Price <SortIcon k="salePrice" />
                </th>
                <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Stock <SortIcon k="stock" />
                </th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    No products found
                  </td>
                </tr>
              ) : paginated.map(p => {
                const st = stockStatus(p);
                const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.active;
                const margin = ((p.salePrice - p.purchasePrice) / p.salePrice * 100).toFixed(0);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={14} style={{ color: 'var(--primary-light)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.warehouse}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.sku}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.barcode}</div>
                    </td>
                    <td><span className="chip">{p.category}</span></td>
                    <td>
                      <div style={{ fontWeight: 700 }}>${p.salePrice.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: 'var(--success)' }}>{margin}% margin</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--danger)' : p.stock <= p.minStock ? 'var(--warning)' : 'var(--text-primary)' }}>
                          {p.stock.toLocaleString()}
                        </span>
                        {p.stock <= p.minStock && p.stock > 0 && <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Min: {p.minStock}</div>
                    </td>
                    <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td style={{ fontSize: 12, color: p.expiry ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {p.expiry ? p.expiry : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setEditProduct(p); setShowModal(true); }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (window.confirm(`Delete "${p.name}"?`)) deleteProduct(p.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} className={`btn btn-sm ${page === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={(data) => {
            if (editProduct) updateProduct(editProduct.id, data);
            else addProduct(data);
            setShowModal(false);
            setEditProduct(null);
          }}
        />
      )}
    </div>
  );
}
