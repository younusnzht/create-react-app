import React, { useState, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Download, Upload, Package, AlertTriangle, ChevronUp, ChevronDown, CheckCircle, X, Image } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CATEGORIES } from '../../data/mockData';

const STATUS_CONFIG = {
  active: { label: 'In Stock', cls: 'badge-success' },
  low_stock: { label: 'Low Stock', cls: 'badge-warning' },
  out_of_stock: { label: 'Out of Stock', cls: 'badge-danger' },
  expiring_soon: { label: 'Expiring Soon', cls: 'badge-info' },
};

const getCurrencySymbol = (code) => {
  const s = { USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥', INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼' };
  return s[code] || code + ' ';
};

function ProductModal({ product, suppliers, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', barcode: '', category: CATEGORIES[0],
    supplier: 'PharmaCo Ltd', purchasePrice: '', salePrice: '',
    stock: '', minStock: '', expiry: '', warehouse: 'Main Store',
    tax: 0, status: 'active', image: null
  });
  const imgRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('image', ev.target.result);
    reader.readAsDataURL(file);
  };

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
      tax: parseFloat(form.tax) || 0,
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
                {suppliers.map(s => <option key={s.id}>{s.name}</option>)}
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
          <div className="form-group">
            <label className="form-label">Product Image</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {form.image ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={form.image} alt="product" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                  <button type="button" onClick={() => set('image', null)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>×</button>
                </div>
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 8, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--bg-tertiary)' }}>
                  <Image size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div>
                <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => imgRef.current.click()}>
                  <Upload size={12} /> {form.image ? 'Change Image' : 'Upload Image'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, WEBP — shown in POS for restaurants</p>
              </div>
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

const TEMPLATE_HEADERS = ['Name','SKU','Barcode','Category','Supplier','Purchase Price','Sale Price','Stock','Min Stock','Tax %','Warehouse','Expiry (YYYY-MM-DD)'];
const TEMPLATE_ROW = ['Paracetamol 500mg','MED-001','1234567890123','Pharmaceuticals','PharmaCo Ltd','2.50','5.99','100','20','0','Main Store','2027-12-31'];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(','), TEMPLATE_ROW.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'arwa_product_import_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], errors: ['CSV must have a header row and at least one data row'] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''));
  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g,''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    // Normalise common header names
    const name         = row.name || row.product_name || row.item_name || '';
    const sku          = row.sku || row.sku_code || `SKU-${Date.now()}-${i}`;
    const barcode      = row.barcode || row.upc || row.ean || '';
    const category     = row.category || row.cat || 'General';
    const supplier     = row.supplier || row.vendor || '';
    const purchasePrice= parseFloat(row.purchase_price || row.cost || row.cost_price || 0) || 0;
    const salePrice    = parseFloat(row.sale_price || row.price || row.selling_price || 0) || 0;
    const stock        = parseInt(row.stock || row.quantity || row.qty || 0) || 0;
    const minStock     = parseInt(row.min_stock || row.minimum_stock || row.reorder_point || 5) || 5;
    const tax          = parseFloat(row['tax_%'] || row.tax || row.tax_rate || 0) || 0;
    const warehouse    = row.warehouse || row.location || 'Main Store';
    const expiry       = row['expiry_(yyyy-mm-dd)'] || row.expiry || row.expiry_date || row.best_before || null;
    const rowErrors = [];
    if (!name) rowErrors.push('Name required');
    if (salePrice <= 0) rowErrors.push('Sale price must be > 0');
    rows.push({ _line: i + 1, _valid: rowErrors.length === 0, _errors: rowErrors,
      name, sku, barcode, category, supplier, purchasePrice, salePrice, stock, minStock,
      tax, warehouse, expiry: expiry || null, status: stock === 0 ? 'out_of_stock' : stock <= minStock ? 'low_stock' : 'active', image: null });
  }
  return { rows, errors };
}

function ImportCSVModal({ onClose, onImport }) {
  const [rows, setRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows: parsed, errors } = parseCSV(ev.target.result);
      setRows(parsed);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter(r => r._valid);
  const invalidRows = rows.filter(r => !r._valid);

  const handleImport = () => {
    setImporting(true);
    onImport(validRows);
    setDone(true);
    setImporting(false);
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'var(--bg-secondary)',borderRadius:16,padding:28,width:'100%',maxWidth:860,maxHeight:'90vh',overflow:'auto',border:'1px solid var(--border)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0,fontSize:18,fontWeight:800 }}>Import Products from CSV</h2>
            <p style={{ margin:'4px 0 0',fontSize:12,color:'var(--text-muted)' }}>Upload a CSV file to bulk-import hundreds of products at once</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18}/></button>
        </div>

        {!done ? (
          <>
            <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
              <label className="btn btn-primary" style={{ cursor:'pointer' }}>
                <Upload size={14} style={{ marginRight:6 }}/> Choose CSV File
                <input type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleFile} />
              </label>
              <button className="btn btn-secondary" onClick={downloadTemplate}>
                <Download size={14} style={{ marginRight:6 }}/> Download Template
              </button>
              {fileName && <span style={{ alignSelf:'center',fontSize:12,color:'var(--text-muted)' }}>📄 {fileName}</span>}
            </div>

            {parseErrors.length > 0 && (
              <div style={{ padding:12,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,marginBottom:12,fontSize:12,color:'#EF4444' }}>
                {parseErrors.map((e,i) => <div key={i}>⚠ {e}</div>)}
              </div>
            )}

            {rows.length > 0 && (
              <>
                <div style={{ display:'flex',gap:16,marginBottom:14,flexWrap:'wrap' }}>
                  <span style={{ fontSize:13,fontWeight:700 }}>{rows.length} rows detected</span>
                  <span style={{ fontSize:12,color:'#10B981',fontWeight:600 }}>✓ {validRows.length} valid</span>
                  {invalidRows.length > 0 && <span style={{ fontSize:12,color:'#EF4444',fontWeight:600 }}>✗ {invalidRows.length} invalid (will be skipped)</span>}
                </div>
                <div style={{ overflowX:'auto',marginBottom:16 }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                    <thead>
                      <tr style={{ borderBottom:'2px solid var(--border)' }}>
                        {['#','Status','Name','SKU','Category','Purchase $','Sale $','Stock','Tax%','Warehouse'].map(h=>(
                          <th key={h} style={{ padding:'6px 8px',textAlign:'left',color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',fontSize:10,whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0,20).map((r,i)=>(
                        <tr key={i} style={{ borderBottom:'1px solid var(--border)',background:r._valid?'transparent':'rgba(239,68,68,0.05)' }}>
                          <td style={{ padding:'5px 8px',color:'var(--text-muted)' }}>{r._line}</td>
                          <td style={{ padding:'5px 8px' }}>
                            {r._valid
                              ? <span style={{ color:'#10B981',fontWeight:700 }}>✓</span>
                              : <span style={{ color:'#EF4444',fontSize:10 }} title={r._errors.join(', ')}>✗ {r._errors.join('; ')}</span>
                            }
                          </td>
                          <td style={{ padding:'5px 8px',fontWeight:600 }}>{r.name||'—'}</td>
                          <td style={{ padding:'5px 8px',fontFamily:'monospace',fontSize:10 }}>{r.sku}</td>
                          <td style={{ padding:'5px 8px' }}>{r.category}</td>
                          <td style={{ padding:'5px 8px' }}>${r.purchasePrice.toFixed(2)}</td>
                          <td style={{ padding:'5px 8px',fontWeight:700,color:'var(--success)' }}>${r.salePrice.toFixed(2)}</td>
                          <td style={{ padding:'5px 8px' }}>{r.stock}</td>
                          <td style={{ padding:'5px 8px' }}>{r.tax}%</td>
                          <td style={{ padding:'5px 8px' }}>{r.warehouse}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 20 && <p style={{ fontSize:11,color:'var(--text-muted)',marginTop:6 }}>Showing first 20 of {rows.length} rows</p>}
                </div>
                {invalidRows.length > 0 && (
                  <div style={{ padding:10,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:8,fontSize:11,marginBottom:14,color:'#F59E0B' }}>
                    ⚠ {invalidRows.length} row(s) with errors will be skipped. Fix and re-upload to include them.
                  </div>
                )}
              </>
            )}

            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:16 }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
              >
                <Package size={14} style={{ marginRight:6 }}/> Import {validRows.length} Products
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center',padding:'30px 0' }}>
            <CheckCircle size={48} style={{ color:'#10B981',margin:'0 auto 16px',display:'block' }} />
            <h3 style={{ fontWeight:800,marginBottom:8 }}>Import Complete!</h3>
            <p style={{ color:'var(--text-muted)',marginBottom:20 }}>{validRows.length} products have been added to your inventory.</p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, currency, showToast, suppliers } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const PER_PAGE = 8;

  const filteredAndSorted = useMemo(() => {
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

  const paginated = filteredAndSorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filteredAndSorted.length / PER_PAGE);

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

  // Pagination sliding window
  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    const pages = [];
    const addPage = (n) => { if (!pages.includes(n) && n >= 1 && n <= totalPages) pages.push(n); };

    addPage(1);
    if (page - 2 > 2) pages.push('...');
    addPage(page - 1);
    addPage(page);
    addPage(page + 1);
    if (page + 2 < totalPages - 1) pages.push('ellipsis-end');
    addPage(totalPages);

    // Deduplicate while preserving order
    const seen = new Set();
    return pages.filter(p => {
      if (p === '...' || p === 'ellipsis-end') return true;
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });
  };

  // CSV Export
  const handleExport = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Supplier', 'Purchase Price', 'Sale Price', 'Stock', 'Min Stock', 'Expiry', 'Warehouse', 'Status'];
    const rows = filteredAndSorted.map(p => [p.name, p.sku, p.barcode, p.category, p.supplier, p.purchasePrice, p.salePrice, p.stock, p.minStock, p.expiry || '', p.warehouse, p.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Inventory exported as CSV');
  };

  // Multi-select helpers
  const visibleIds = paginated.map(p => p.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;
    selectedIds.forEach(id => deleteProduct(id));
    setSelectedIds([]);
  };

  const handleBulkStatus = (status) => {
    selectedIds.forEach(id => updateProduct(id, { status }));
    setSelectedIds([]);
    showToast(`Updated ${selectedIds.length} product(s)`);
  };

  const handleBulkImport = (rows) => {
    rows.forEach(row => {
      addProduct({ ...row, id: Date.now() + Math.random() });
    });
    showToast(`${rows.length} products imported successfully`, 'success');
  };

  // Expiry helpers
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const renderExpiry = (expiry) => {
    if (!expiry) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const d = new Date(expiry);
    if (d < now) {
      return <span className="badge badge-danger">Expired</span>;
    }
    if (d < in90Days) {
      return (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.toLocaleDateString()}</span>
          <span className="badge badge-warning">Expiring</span>
        </span>
      );
    }
    return <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.toLocaleDateString()}</span>;
  };

  const currSym = getCurrencySymbol(currency);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventory Management</h1>
          <p>{products.length} total products across all warehouses</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)}>
            <Upload size={13} /> Import CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
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

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 12, background: 'rgba(79,70,229,0.08)', borderRadius: 8, border: '1px solid rgba(79,70,229,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-light)' }}>{selectedIds.length} selected:</span>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <Trash2 size={12} /> Bulk Delete
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('active')}>
              Mark Active
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('out_of_stock')}>
              Mark Out of Stock
            </button>
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelectedIds([])}>
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    title="Select all visible"
                  />
                </th>
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
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    No products found
                  </td>
                </tr>
              ) : paginated.map(p => {
                const st = stockStatus(p);
                const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.active;
                const margin = p.salePrice > 0 ? ((p.salePrice - p.purchasePrice) / p.salePrice * 100).toFixed(0) : 0;
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr key={p.id} style={isSelected ? { background: 'rgba(79,70,229,0.06)' } : {}}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
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
                      <div style={{ fontWeight: 700 }}>{currSym}{p.salePrice.toFixed(2)}</div>
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
                    <td>{renderExpiry(p.expiry)}</td>
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
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredAndSorted.length)} of {filteredAndSorted.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              {getPageNumbers().map((n, i) =>
                (n === '...' || n === 'ellipsis-end') ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '0 4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>…</span>
                ) : (
                  <button key={n} className={`btn btn-sm ${page === n ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(n)}>{n}</button>
                )
              )}
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          product={editProduct}
          suppliers={suppliers}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={(data) => {
            if (editProduct) updateProduct(editProduct.id, data);
            else addProduct(data);
            setShowModal(false);
            setEditProduct(null);
          }}
        />
      )}

      {showImportModal && (
        <ImportCSVModal
          onClose={() => setShowImportModal(false)}
          onImport={(rows) => { handleBulkImport(rows); }}
        />
      )}
    </div>
  );
}
