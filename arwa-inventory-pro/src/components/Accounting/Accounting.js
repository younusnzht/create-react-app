import React, { useState, useMemo } from 'react';
import { TrendingUp, BookOpen, CreditCard, FileText, DollarSign, Plus, Download, X, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { calcRealCOGS } from '../../services/costingEngine';

// ── Default Canadian Chart of Accounts ───────────────────────────────────────
const DEFAULT_COA = [
  // Assets
  { code: '1010', name: 'Cash and Bank',           type: 'Asset',     group: 'Current Assets' },
  { code: '1100', name: 'Accounts Receivable',      type: 'Asset',     group: 'Current Assets' },
  { code: '1200', name: 'Inventory',                type: 'Asset',     group: 'Current Assets' },
  { code: '1300', name: 'Prepaid Expenses',         type: 'Asset',     group: 'Current Assets' },
  { code: '1500', name: 'Equipment',                type: 'Asset',     group: 'Fixed Assets' },
  { code: '1510', name: 'Accumulated Depreciation', type: 'Asset',     group: 'Fixed Assets' },
  // Liabilities
  { code: '2010', name: 'Accounts Payable',         type: 'Liability', group: 'Current Liabilities' },
  { code: '2100', name: 'Wages Payable',            type: 'Liability', group: 'Current Liabilities' },
  { code: '2200', name: 'GST/HST Payable',          type: 'Liability', group: 'Tax Liabilities' },
  { code: '2210', name: 'PST/QST Payable',          type: 'Liability', group: 'Tax Liabilities' },
  { code: '2300', name: 'Bank Loan',                type: 'Liability', group: 'Long-term Liabilities' },
  // Equity
  { code: '3010', name: "Owner's Equity",           type: 'Equity',    group: 'Equity' },
  { code: '3020', name: 'Retained Earnings',        type: 'Equity',    group: 'Equity' },
  // Revenue
  { code: '4010', name: 'Sales Revenue',            type: 'Revenue',   group: 'Revenue' },
  { code: '4020', name: 'Service Revenue',          type: 'Revenue',   group: 'Revenue' },
  { code: '4030', name: 'Other Income',             type: 'Revenue',   group: 'Revenue' },
  // COGS
  { code: '5010', name: 'Cost of Goods Sold',       type: 'COGS',      group: 'Cost of Sales' },
  { code: '5020', name: 'Freight & Shipping In',    type: 'COGS',      group: 'Cost of Sales' },
  // Expenses
  { code: '6010', name: 'Rent & Occupancy',         type: 'Expense',   group: 'Operating Expenses' },
  { code: '6020', name: 'Utilities',                type: 'Expense',   group: 'Operating Expenses' },
  { code: '6030', name: 'Wages & Salaries',         type: 'Expense',   group: 'Operating Expenses' },
  { code: '6040', name: 'Advertising & Marketing',  type: 'Expense',   group: 'Operating Expenses' },
  { code: '6050', name: 'Office Supplies',          type: 'Expense',   group: 'Operating Expenses' },
  { code: '6060', name: 'Insurance',                type: 'Expense',   group: 'Operating Expenses' },
  { code: '6070', name: 'Professional Fees',        type: 'Expense',   group: 'Operating Expenses' },
  { code: '6080', name: 'Depreciation',             type: 'Expense',   group: 'Operating Expenses' },
  { code: '6090', name: 'Bank Charges & Interest',  type: 'Expense',   group: 'Operating Expenses' },
  { code: '6100', name: 'Repairs & Maintenance',    type: 'Expense',   group: 'Operating Expenses' },
  { code: '6110', name: 'Vehicle Expenses',         type: 'Expense',   group: 'Operating Expenses' },
  { code: '6120', name: 'Miscellaneous',            type: 'Expense',   group: 'Operating Expenses' },
];

const TYPE_COLORS = {
  Asset: '#3B82F6', Liability: '#EF4444', Equity: '#8B5CF6',
  Revenue: '#10B981', COGS: '#F59E0B', Expense: '#6B7280',
};

// ── Expense entry form ────────────────────────────────────────────────────────
function ExpenseForm({ accounts, onSave, onClose }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), account: '6010', description: '', amount: '', vendor: '' });
  const setF = (k,v) => setForm(f => ({...f, [k]: v}));
  const expenseAccounts = accounts.filter(a => a.type === 'Expense' || a.type === 'COGS');
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h3 className="modal-title">Add Expense</h3>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-control" type="date" value={form.date} onChange={e=>setF('date',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Account *</label>
            <select className="form-control" value={form.account} onChange={e=>setF('account',e.target.value)}>
              {expenseAccounts.map(a=><option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{gridColumn:'1/-1'}}>
            <label className="form-label">Description *</label>
            <input className="form-control" placeholder="What was this expense for?" value={form.description} onChange={e=>setF('description',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Vendor / Payee</label>
            <input className="form-control" placeholder="Who was paid?" value={form.vendor} onChange={e=>setF('vendor',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (CA$) *</label>
            <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e=>setF('amount',e.target.value)}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>{
            if(!form.description||!form.amount) return;
            onSave({...form, amount: parseFloat(form.amount)||0, id: Date.now(), createdAt: new Date().toISOString()});
          }}><Plus size={14}/> Add Expense</button>
        </div>
      </div>
    </div>
  );
}

// ── Customer Invoice form ─────────────────────────────────────────────────────
function InvoiceForm({ customers, products, onSave, onClose }) {
  const [form, setForm] = useState({
    customerId:'', customerName:'', invoiceNumber:'INV-'+Date.now().toString().slice(-5),
    issueDate: new Date().toISOString().slice(0,10), dueDate:'', paymentTerms:'net30', notes:'', items:[]
  });
  const [itemRow, setItemRow] = useState({description:'', qty:1, unitPrice:''});
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const subtotal = form.items.reduce((s,i)=>s+(i.qty||1)*(parseFloat(i.unitPrice)||0),0);
  const addItem=()=>{
    if(!itemRow.description||!itemRow.unitPrice) return;
    setForm(f=>({...f, items:[...f.items,{...itemRow,id:Date.now()}]}));
    setItemRow({description:'',qty:1,unitPrice:''});
  };
  const handleCustomer=(id)=>{
    const c=customers.find(c=>String(c.id)===String(id));
    setF('customerId',id); setF('customerName',c?.name||'');
  };
  const handleTerms=(terms)=>{
    setF('paymentTerms',terms);
    const days = terms==='net15'?15:terms==='net30'?30:terms==='net60'?60:0;
    if(days>0){ const d=new Date(); d.setDate(d.getDate()+days); setF('dueDate',d.toISOString().slice(0,10)); }
  };
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:640}}>
        <div className="modal-header">
          <h3 className="modal-title">New Customer Invoice</h3>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="grid-2" style={{marginBottom:12}}>
          <div className="form-group">
            <label className="form-label">Invoice #</label>
            <input className="form-control" value={form.invoiceNumber} onChange={e=>setF('invoiceNumber',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-control" value={form.customerId} onChange={e=>handleCustomer(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input className="form-control" type="date" value={form.issueDate} onChange={e=>setF('issueDate',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select className="form-control" value={form.paymentTerms} onChange={e=>handleTerms(e.target.value)}>
              <option value="due_on_receipt">Due on Receipt</option>
              <option value="net15">Net 15</option>
              <option value="net30">Net 30</option>
              <option value="net60">Net 60</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-control" type="date" value={form.dueDate} onChange={e=>setF('dueDate',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-control" placeholder="Payment instructions, notes…" value={form.notes} onChange={e=>setF('notes',e.target.value)}/>
          </div>
        </div>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Line Items</div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 70px 120px auto',gap:6,marginBottom:8}}>
          <input className="form-control" style={{fontSize:12}} placeholder="Description" value={itemRow.description} onChange={e=>setItemRow(r=>({...r,description:e.target.value}))}/>
          <input className="form-control" style={{fontSize:12}} type="number" min="1" placeholder="Qty" value={itemRow.qty} onChange={e=>setItemRow(r=>({...r,qty:parseInt(e.target.value)||1}))}/>
          <input className="form-control" style={{fontSize:12}} type="number" placeholder="Unit Price" value={itemRow.unitPrice} onChange={e=>setItemRow(r=>({...r,unitPrice:e.target.value}))}/>
          <button className="btn btn-primary btn-sm" onClick={addItem}><Plus size={12}/></button>
        </div>
        {form.items.length>0&&(
          <div style={{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',marginBottom:12}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{background:'var(--bg-tertiary)'}}>
                <tr>{['Description','Qty','Unit Price','Total',''].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase'}}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {form.items.map(item=>(
                  <tr key={item.id} style={{borderTop:'1px solid var(--border)'}}>
                    <td style={{padding:'6px 10px'}}>{item.description}</td>
                    <td style={{padding:'6px 10px'}}>{item.qty}</td>
                    <td style={{padding:'6px 10px'}}>CA${parseFloat(item.unitPrice||0).toFixed(2)}</td>
                    <td style={{padding:'6px 10px',fontWeight:700}}>CA${((item.qty||1)*parseFloat(item.unitPrice||0)).toFixed(2)}</td>
                    <td style={{padding:'6px 10px'}}><button onClick={()=>setForm(f=>({...f,items:f.items.filter(i=>i.id!==item.id)}))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}><X size={11}/></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{background:'var(--bg-tertiary)'}}>
                <tr style={{borderTop:'1px solid var(--border)'}}>
                  <td colSpan={3} style={{padding:'7px 10px',fontWeight:800,textAlign:'right'}}>Total</td>
                  <td colSpan={2} style={{padding:'7px 10px',fontWeight:900,color:'var(--primary-light)'}}>CA${subtotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>{
            if(!form.customerId||form.items.length===0) return;
            onSave({...form,subtotal,total:subtotal,status:'unpaid',id:Date.now(),createdAt:new Date().toISOString()});
          }}><FileText size={14}/> Create Invoice</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Accounting Component ─────────────────────────────────────────────────
export default function Accounting() {
  const { orders, products, purchaseOrders, customers, payrollRecords,
          customerInvoices, addCustomerInvoice, updateCustomerInvoice,
          expenses, addExpense, chartOfAccounts, currency } = useApp();
  const sym = currency === 'CAD' ? 'CA$' : '$';

  const [activeTab, setActiveTab] = useState('income');
  const [period, setPeriod] = useState('monthly');
  const [periodDate, setPeriodDate] = useState(() => new Date().toISOString().slice(0,7));
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const accounts = chartOfAccounts || DEFAULT_COA;

  // ── Income Statement ────────────────────────────────────────────────────────
  const incomeStatement = useMemo(() => {
    const filterByPeriod = (items, dateField) => items.filter(item => {
      const d = new Date(item[dateField] || item.createdAt || '');
      if (period === 'monthly') return d.toISOString().slice(0,7) === periodDate;
      if (period === 'quarterly') {
        const [y,m] = periodDate.split('-').map(Number);
        return d.getFullYear()===y && Math.ceil((d.getMonth()+1)/3)===Math.ceil(m/3);
      }
      return d.getFullYear().toString() === periodDate.slice(0,4);
    });

    const periodOrders   = filterByPeriod(orders||[], 'date');
    const periodExpenses = filterByPeriod(expenses||[], 'date');

    const revenue  = periodOrders.reduce((s,o) => s+(o.total||0), 0);
    const realCOGS = calcRealCOGS(periodOrders, products);
    const grossProfit = revenue - realCOGS;
    const grossMargin = revenue>0 ? (grossProfit/revenue*100) : 0;

    // Operating expenses from expense records + payroll in period
    const opExpenses = periodExpenses.reduce((s,e)=>s+(e.amount||0), 0);
    const payrollInPeriod = filterByPeriod(payrollRecords||[], 'createdAt').reduce((s,r)=>s+(r.grossPay||0),0);
    const totalOpEx = opExpenses + payrollInPeriod;

    const operatingIncome = grossProfit - totalOpEx;
    const netIncome = operatingIncome; // simplified (no interest/tax line)

    // Expense breakdown by account
    const byAccount = {};
    periodExpenses.forEach(e => {
      byAccount[e.account] = (byAccount[e.account]||0) + (e.amount||0);
    });
    if(payrollInPeriod>0) byAccount['6030'] = (byAccount['6030']||0) + payrollInPeriod;

    return { revenue, realCOGS, grossProfit, grossMargin, opExpenses: totalOpEx, operatingIncome, netIncome, byAccount, orderCount: periodOrders.length };
  }, [orders, products, expenses, payrollRecords, period, periodDate]);

  // ── Accounts Payable ────────────────────────────────────────────────────────
  const apAging = useMemo(() => {
    const outstanding = (purchaseOrders||[]).filter(po => ['sent','partial'].includes(po.status));
    const now = Date.now();
    return outstanding.map(po => {
      const days = Math.floor((now - new Date(po.createdAt||'').getTime()) / 86400000);
      const bucket = days<=30?'0-30':days<=60?'31-60':days<=90?'61-90':'90+';
      return { ...po, daysOutstanding: days, agingBucket: bucket };
    }).sort((a,b)=>b.daysOutstanding-a.daysOutstanding);
  }, [purchaseOrders]);

  const apTotals = useMemo(()=>({
    '0-30':  apAging.filter(p=>p.agingBucket==='0-30').reduce((s,p)=>s+(p.total||0),0),
    '31-60': apAging.filter(p=>p.agingBucket==='31-60').reduce((s,p)=>s+(p.total||0),0),
    '61-90': apAging.filter(p=>p.agingBucket==='61-90').reduce((s,p)=>s+(p.total||0),0),
    '90+':   apAging.filter(p=>p.agingBucket==='90+').reduce((s,p)=>s+(p.total||0),0),
    total:   apAging.reduce((s,p)=>s+(p.total||0),0),
  }), [apAging]);

  // ── Accounts Receivable ─────────────────────────────────────────────────────
  const arAging = useMemo(() => {
    const now = Date.now();
    return (customerInvoices||[]).filter(inv=>inv.status!=='paid').map(inv=>{
      const due = new Date(inv.dueDate||inv.createdAt||'');
      const daysOverdue = Math.floor((now - due.getTime())/86400000);
      const bucket = daysOverdue<=0?'Current':daysOverdue<=30?'1-30':daysOverdue<=60?'31-60':daysOverdue<=90?'61-90':'90+';
      return { ...inv, daysOverdue: Math.max(0,daysOverdue), agingBucket: bucket };
    }).sort((a,b)=>b.daysOverdue-a.daysOverdue);
  }, [customerInvoices]);

  const arTotals = useMemo(()=>({
    current: arAging.filter(i=>i.agingBucket==='Current').reduce((s,i)=>s+(i.total||0),0),
    '1-30':  arAging.filter(i=>i.agingBucket==='1-30').reduce((s,i)=>s+(i.total||0),0),
    '31-60': arAging.filter(i=>i.agingBucket==='31-60').reduce((s,i)=>s+(i.total||0),0),
    '61-90': arAging.filter(i=>i.agingBucket==='61-90').reduce((s,i)=>s+(i.total||0),0),
    '90+':   arAging.filter(i=>i.agingBucket==='90+').reduce((s,i)=>s+(i.total||0),0),
    total:   arAging.reduce((s,i)=>s+(i.total||0),0),
  }), [arAging]);

  const exportIncomeStatement = () => {
    const is = incomeStatement;
    const rows = [
      ['INCOME STATEMENT', period.toUpperCase(), periodDate],
      [''],
      ['Revenue'],
      ['  Sales Revenue', sym+is.revenue.toFixed(2)],
      ['  TOTAL REVENUE', sym+is.revenue.toFixed(2)],
      [''],
      ['Cost of Goods Sold'],
      ['  COGS (product cost × qty sold)', sym+is.realCOGS.toFixed(2)],
      ['  GROSS PROFIT', sym+is.grossProfit.toFixed(2), `${is.grossMargin.toFixed(1)}% margin`],
      [''],
      ['Operating Expenses', sym+is.opExpenses.toFixed(2)],
      [''],
      ['  OPERATING INCOME', sym+is.operatingIncome.toFixed(2)],
      ['  NET INCOME', sym+is.netIncome.toFixed(2)],
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`IncomeStatement_${periodDate}.csv`;a.click();URL.revokeObjectURL(url);
  };

  const tabs = [
    { id:'income', label:'Income Statement', icon: TrendingUp },
    { id:'coa',    label:'Chart of Accounts',icon: BookOpen },
    { id:'ap',     label:'Accounts Payable', icon: CreditCard },
    { id:'ar',     label:'Accounts Receivable', icon: FileText },
    { id:'expenses',label:'Expenses',         icon: DollarSign },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Accounting</h1>
          <p>Income statement, chart of accounts, AP/AR aging, and expense tracking</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {activeTab==='income' && <button className="btn btn-secondary" onClick={exportIncomeStatement}><Download size={14}/> Export P&amp;L</button>}
          {activeTab==='expenses' && <button className="btn btn-primary" onClick={()=>setShowExpenseForm(true)}><Plus size={14}/> Add Expense</button>}
          {activeTab==='ar' && <button className="btn btn-primary" onClick={()=>setShowInvoiceForm(true)}><Plus size={14}/> New Invoice</button>}
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{marginBottom:20}}>
          {tabs.map(t=>{ const Icon=t.icon; return (
            <button key={t.id} className={`tab ${activeTab===t.id?'active':''}`} onClick={()=>setActiveTab(t.id)} style={{display:'flex',alignItems:'center',gap:6}}>
              <Icon size={13}/> {t.label}
            </button>
          );})}
        </div>

        {/* ── INCOME STATEMENT ── */}
        {activeTab==='income' && (
          <div>
            <div style={{display:'flex',gap:10,marginBottom:20,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Period</label>
                <select className="form-control" value={period} onChange={e=>{setPeriod(e.target.value);setPeriodDate(new Date().toISOString().slice(0,7));}}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Annual</option>
                </select>
              </div>
              <div className="form-group" style={{margin:0}}>
                <label className="form-label">Date</label>
                <input className="form-control" type="month" value={periodDate} onChange={e=>setPeriodDate(e.target.value)}/>
              </div>
              <div style={{fontSize:12,color:'var(--text-muted)',paddingBottom:6}}>{incomeStatement.orderCount} orders in period</div>
            </div>

            {/* P&L waterfall */}
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {[
                { label:'Sales Revenue',       value: incomeStatement.revenue,         color:'#10B981', indent:0, bold:true },
                { label:'Cost of Goods Sold',  value:-incomeStatement.realCOGS,        color:'#EF4444', indent:1 },
                { label:'GROSS PROFIT',        value: incomeStatement.grossProfit,     color: incomeStatement.grossProfit>=0?'#10B981':'#EF4444', indent:0, bold:true, border:true, note:`${incomeStatement.grossMargin.toFixed(1)}% margin` },
                { label:'Operating Expenses',  value:-incomeStatement.opExpenses,      color:'#F59E0B', indent:1 },
                { label:'NET OPERATING INCOME',value: incomeStatement.operatingIncome, color: incomeStatement.operatingIncome>=0?'#10B981':'#EF4444', indent:0, bold:true, border:true },
              ].map((row,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:`${row.border?'12px':'8px'} ${16+row.indent*20}px`,borderTop:row.border?'2px solid var(--border)':'none',borderBottom:row.border?'2px solid var(--border)':'none',background:row.border?'var(--bg-tertiary)':'transparent'}}>
                  <div>
                    <span style={{fontWeight:row.bold?800:400,fontSize:row.bold?14:13}}>{row.label}</span>
                    {row.note && <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:8}}>{row.note}</span>}
                  </div>
                  <span style={{fontWeight:row.bold?900:600,fontSize:row.bold?16:14,color:row.color,fontVariantNumeric:'tabular-nums'}}>
                    {sym}{Math.abs(row.value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                  </span>
                </div>
              ))}
            </div>

            {/* Expense breakdown */}
            {Object.keys(incomeStatement.byAccount).length>0 && (
              <div style={{marginTop:20}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Operating Expense Breakdown</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {Object.entries(incomeStatement.byAccount).map(([code,amount])=>{
                    const acct = accounts.find(a=>a.code===code);
                    return (
                      <div key={code} style={{display:'flex',justifyContent:'space-between',padding:'6px 12px',borderRadius:6,background:'var(--bg-tertiary)'}}>
                        <span style={{fontSize:12}}>{acct?.name||code}</span>
                        <span style={{fontSize:12,fontWeight:700,color:'#F59E0B'}}>{sym}{amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CHART OF ACCOUNTS ── */}
        {activeTab==='coa' && (
          <div>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Standard Canadian chart of accounts. These classify your income, expenses, assets, and liabilities.</p>
            {['Asset','Liability','Equity','Revenue','COGS','Expense'].map(type=>{
              const typeAccounts = accounts.filter(a=>a.type===type);
              if(!typeAccounts.length) return null;
              return (
                <div key={type} style={{marginBottom:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <span style={{padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:800,background:`${TYPE_COLORS[type]}22`,color:TYPE_COLORS[type]}}>{type}</span>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid var(--border)'}}>
                        {['Code','Account Name','Group'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase'}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {typeAccounts.map(a=>(
                        <tr key={a.code} style={{borderBottom:'1px solid var(--border)'}}>
                          <td style={{padding:'7px 10px',fontFamily:'monospace',fontWeight:700,color:TYPE_COLORS[a.type]}}>{a.code}</td>
                          <td style={{padding:'7px 10px',fontWeight:500}}>{a.name}</td>
                          <td style={{padding:'7px 10px',color:'var(--text-muted)',fontSize:11}}>{a.group}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ACCOUNTS PAYABLE ── */}
        {activeTab==='ap' && (
          <div>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Outstanding amounts owed to suppliers based on sent/partial purchase orders.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
              {[
                {label:'Total AP',     value:apTotals.total,   color:'#EF4444'},
                {label:'0–30 Days',    value:apTotals['0-30'], color:'#10B981'},
                {label:'31–60 Days',   value:apTotals['31-60'],color:'#F59E0B'},
                {label:'61–90 Days',   value:apTotals['61-90'],color:'#F97316'},
                {label:'90+ Days',     value:apTotals['90+'],  color:'#EF4444'},
              ].map(s=>(
                <div key={s.label} className="card" style={{padding:12,textAlign:'center'}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.color}}>{sym}{s.value.toFixed(2)}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{s.label}</div>
                </div>
              ))}
            </div>
            {apAging.length===0 ? (
              <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                <CheckCircle size={32} style={{margin:'0 auto 12px',opacity:0.3}}/>
                <p>No outstanding payables — all purchase orders are received or cancelled.</p>
              </div>
            ):(
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['PO Number','Supplier','Created','Aging','Status','Amount'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apAging.map(po=>{
                    const bc = po.agingBucket==='0-30'?'#10B981':po.agingBucket==='31-60'?'#F59E0B':po.agingBucket==='61-90'?'#F97316':'#EF4444';
                    return (
                      <tr key={po.id} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'8px 10px',fontWeight:700}}>{po.poNumber}</td>
                        <td style={{padding:'8px 10px'}}>{po.supplierName}</td>
                        <td style={{padding:'8px 10px',color:'var(--text-muted)'}}>{po.createdAt?.slice(0,10)}</td>
                        <td style={{padding:'8px 10px'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700,background:`${bc}22`,color:bc}}>{po.daysOutstanding}d</span></td>
                        <td style={{padding:'8px 10px',textTransform:'capitalize'}}>{po.status}</td>
                        <td style={{padding:'8px 10px',fontWeight:700,color:'#EF4444'}}>{sym}{(po.total||0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ACCOUNTS RECEIVABLE ── */}
        {activeTab==='ar' && (
          <div>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Customer invoices and outstanding receivables.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
              {[
                {label:'Total AR',    value:arTotals.total,    color:'#4F46E5'},
                {label:'Current',     value:arTotals.current,  color:'#10B981'},
                {label:'1–30 Overdue',value:arTotals['1-30'],  color:'#F59E0B'},
                {label:'31–60 Days',  value:arTotals['31-60'], color:'#F97316'},
                {label:'60+ Days',    value:(arTotals['61-90']||0)+(arTotals['90+']||0), color:'#EF4444'},
              ].map(s=>(
                <div key={s.label} className="card" style={{padding:12,textAlign:'center'}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.color}}>{sym}{s.value.toFixed(2)}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{s.label}</div>
                </div>
              ))}
            </div>
            {(customerInvoices||[]).length===0 ? (
              <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                <FileText size={32} style={{margin:'0 auto 12px',opacity:0.3}}/>
                <p>No invoices yet. Click "New Invoice" to create one.</p>
              </div>
            ):(
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Invoice #','Customer','Issue Date','Due Date','Aging','Status','Total','Action'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(customerInvoices||[]).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(inv=>{
                    const aging = arAging.find(i=>i.id===inv.id);
                    const statusColor = inv.status==='paid'?'#10B981':aging?.daysOverdue>30?'#EF4444':aging?.daysOverdue>0?'#F59E0B':'#6B7280';
                    return (
                      <tr key={inv.id} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'8px 10px',fontWeight:700}}>{inv.invoiceNumber}</td>
                        <td style={{padding:'8px 10px'}}>{inv.customerName}</td>
                        <td style={{padding:'8px 10px',color:'var(--text-muted)'}}>{inv.issueDate}</td>
                        <td style={{padding:'8px 10px',color:'var(--text-muted)'}}>{inv.dueDate||'—'}</td>
                        <td style={{padding:'8px 10px'}}>{aging ? <span style={{padding:'2px 7px',borderRadius:12,fontSize:11,fontWeight:700,background:`${statusColor}22`,color:statusColor}}>{aging.daysOverdue>0?`${aging.daysOverdue}d overdue`:'Current'}</span>:'—'}</td>
                        <td style={{padding:'8px 10px'}}><span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700,background:`${statusColor}22`,color:statusColor,textTransform:'capitalize'}}>{inv.status}</span></td>
                        <td style={{padding:'8px 10px',fontWeight:700}}>{sym}{(inv.total||0).toFixed(2)}</td>
                        <td style={{padding:'8px 10px'}}>
                          {inv.status!=='paid'&&<button className="btn btn-success btn-sm" onClick={()=>updateCustomerInvoice(inv.id,{status:'paid',paidAt:new Date().toISOString()})}><CheckCircle size={11}/> Mark Paid</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── EXPENSES ── */}
        {activeTab==='expenses' && (
          <div>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Track operating expenses linked to your chart of accounts.</p>
            {(expenses||[]).length===0?(
              <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                <DollarSign size={32} style={{margin:'0 auto 12px',opacity:0.3}}/>
                <p>No expenses recorded. Click "Add Expense" to start tracking.</p>
              </div>
            ):(
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--border)'}}>
                    {['Date','Account','Description','Vendor','Amount'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...(expenses||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(e=>{
                    const acct=accounts.find(a=>a.code===e.account);
                    return (
                      <tr key={e.id} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'8px 10px',color:'var(--text-muted)'}}>{e.date}</td>
                        <td style={{padding:'8px 10px',fontSize:11}}><span style={{fontFamily:'monospace',fontWeight:700,color:'#6B7280'}}>{e.account}</span> {acct?.name||''}</td>
                        <td style={{padding:'8px 10px',fontWeight:500}}>{e.description}</td>
                        <td style={{padding:'8px 10px',color:'var(--text-muted)'}}>{e.vendor||'—'}</td>
                        <td style={{padding:'8px 10px',fontWeight:700,color:'#F59E0B'}}>{sym}{(e.amount||0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showExpenseForm && <ExpenseForm accounts={accounts} onSave={e=>{addExpense(e);setShowExpenseForm(false);}} onClose={()=>setShowExpenseForm(false)}/>}
      {showInvoiceForm && <InvoiceForm customers={customers||[]} products={products||[]} onSave={inv=>{addCustomerInvoice(inv);setShowInvoiceForm(false);}} onClose={()=>setShowInvoiceForm(false)}/>}
    </div>
  );
}
