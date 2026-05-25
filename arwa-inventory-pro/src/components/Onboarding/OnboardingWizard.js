import React, { useState } from 'react';
import {
  Package, Truck, Users, CheckCircle, ChevronRight, ChevronLeft,
  Store, Building2, FlaskConical, Warehouse, ShoppingCart, SkipForward,
  Sparkles, ArrowRight, Globe
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const BUSINESS_TYPES = [
  { id: 'restaurant', label: 'Restaurant / Café', icon: Store },
  { id: 'pharmacy', label: 'Pharmacy', icon: FlaskConical },
  { id: 'retail', label: 'Retail Store', icon: ShoppingCart },
  { id: 'warehouse', label: 'Warehouse', icon: Warehouse },
  { id: 'wholesale', label: 'Wholesale / Distribution', icon: Building2 },
  { id: 'other', label: 'Other Business', icon: Globe },
];

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'CAD', label: 'Canadian Dollar (CA$)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'PKR', label: 'Pakistani Rupee (₨)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
  { code: 'SAR', label: 'Saudi Riyal (﷼)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
];

const ROLES = ['manager', 'cashier', 'warehouse', 'accountant', 'salesperson'];

const STEPS = [
  { id: 'welcome',  title: 'Welcome',        icon: Sparkles,      optional: false },
  { id: 'business', title: 'Your Business',  icon: Building2,     optional: false },
  { id: 'product',  title: 'First Product',  icon: Package,       optional: true  },
  { id: 'supplier', title: 'First Supplier', icon: Truck,         optional: true  },
  { id: 'staff',    title: 'Your Team',      icon: Users,         optional: true  },
  { id: 'done',     title: "You're Ready!",  icon: CheckCircle,   optional: false },
];

// ── Step components ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', boxShadow: '0 0 40px rgba(79,70,229,0.4)',
        fontSize: 36, fontWeight: 900, color: 'white',
      }}>A</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, color: 'var(--text-primary)' }}>
        Welcome to Arwa Inventory Pro!
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.6 }}>
        Let's get your business set up in just a few minutes. We'll walk you through the essentials — you can always change everything later.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32, textAlign: 'left' }}>
        {[
          { icon: Package,  title: 'Inventory',     desc: 'Track every product in real time' },
          { icon: Store,    title: 'POS Terminal',   desc: 'Process sales instantly' },
          { icon: Sparkles, title: 'AI Guardian',    desc: 'AI monitors your business 24/7' },
        ].map(f => (
          <div key={f.title} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <f.icon size={18} style={{ color: 'var(--primary-light)', marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }} onClick={onNext}>
        Let's Get Started <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StepBusiness({ data, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!data.businessName.trim()) e.businessName = 'Business name is required';
    if (!data.businessType) e.businessType = 'Please select a business type';
    return e;
  };
  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext();
  };
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tell us about your business</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>This personalises your experience across the app.</p>

      <div className="form-group">
        <label className="form-label">Business Name *</label>
        <input
          className="form-control"
          placeholder="e.g. Arwa Enterprises"
          value={data.businessName}
          onChange={e => onChange('businessName', e.target.value)}
          style={{ borderColor: errors.businessName ? 'var(--danger)' : undefined }}
        />
        {errors.businessName && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.businessName}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Business Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {BUSINESS_TYPES.map(t => {
            const selected = data.businessType === t.id;
            return (
              <div key={t.id} onClick={() => onChange('businessType', t.id)} style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                background: selected ? 'rgba(79,70,229,0.1)' : 'var(--bg-tertiary)',
                transition: 'all 0.15s',
              }}>
                <t.icon size={18} style={{ color: selected ? 'var(--primary-light)' : 'var(--text-muted)', marginBottom: 4 }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: selected ? 'var(--primary-light)' : 'var(--text-secondary)' }}>{t.label}</div>
              </div>
            );
          })}
        </div>
        {errors.businessType && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.businessType}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Currency</label>
        <select className="form-control" value={data.currency} onChange={e => onChange('currency', e.target.value)}>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={14} /> Back</button>
        <button className="btn btn-primary" onClick={submit}>Continue <ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

function StepProduct({ onNext, onSkip }) {
  const { addProduct, suppliers } = useApp();
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: 'General' });
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = useState({});

  const handleAdd = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || isNaN(form.price)) e.price = 'Valid price required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addProduct({
      name: form.name, price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
      category: form.category, sku: 'SKU-' + Date.now().toString(36).toUpperCase(),
      supplier: suppliers[0]?.name || '', minStock: 5, status: 'active',
    });
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
      <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Product Added! 🎉</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>"{form.name}" is now in your inventory.</p>
      <button className="btn btn-primary" onClick={onNext}>Continue <ChevronRight size={14} /></button>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Add your first product</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Add one product now to see how inventory works. You can add more later.</p>

      <div className="form-group">
        <label className="form-label">Product Name *</label>
        <input className="form-control" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => set('name', e.target.value)} style={{ borderColor: errors.name ? 'var(--danger)' : undefined }} />
        {errors.name && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Selling Price *</label>
          <input className="form-control" type="number" placeholder="0.00" value={form.price} onChange={e => set('price', e.target.value)} style={{ borderColor: errors.price ? 'var(--danger)' : undefined }} />
          {errors.price && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.price}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Stock Quantity</label>
          <input className="form-control" type="number" placeholder="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Category</label>
        <input className="form-control" placeholder="e.g. Medicines, Electronics, Food…" value={form.category} onChange={e => set('category', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onSkip}><SkipForward size={14} /> Skip for now</button>
        <button className="btn btn-primary" onClick={handleAdd}><Package size={14} /> Add Product</button>
      </div>
    </div>
  );
}

function StepSupplier({ onNext, onSkip }) {
  const { addSupplier } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '' });
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = useState({});

  const handleAdd = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Supplier name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addSupplier({ ...form, id: Date.now(), rating: 4.0, totalOrders: 0, balance: 0 });
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
      <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Supplier Added! 🎉</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>"{form.name}" is now in your supplier list.</p>
      <button className="btn btn-primary" onClick={onNext}>Continue <ChevronRight size={14} /></button>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Add your first supplier</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Who supplies your products? You can manage purchase orders from here.</p>

      <div className="form-group">
        <label className="form-label">Company Name *</label>
        <input className="form-control" placeholder="e.g. PharmaCo Ltd" value={form.name} onChange={e => set('name', e.target.value)} style={{ borderColor: errors.name ? 'var(--danger)' : undefined }} />
        {errors.name && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Email *</label>
        <input className="form-control" type="email" placeholder="orders@supplier.com" value={form.email} onChange={e => set('email', e.target.value)} style={{ borderColor: errors.email ? 'var(--danger)' : undefined }} />
        {errors.email && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-control" placeholder="+1-555-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="form-control" placeholder="USA" value={form.country} onChange={e => set('country', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onSkip}><SkipForward size={14} /> Skip for now</button>
        <button className="btn btn-primary" onClick={handleAdd}><Truck size={14} /> Add Supplier</button>
      </div>
    </div>
  );
}

function StepStaff({ onNext, onSkip }) {
  const { addUser } = useApp();
  const [form, setForm] = useState({ name: '', email: '', role: 'cashier' });
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = useState({});

  const handleAdd = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    addUser({
      ...form, id: Date.now(), status: 'active', branch: 'Main Store',
      password: 'pass1234', lastLogin: new Date().toISOString(), permissions: [],
    });
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
      <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Staff Account Created! 🎉</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>"{form.name}" can now log in with password: <strong>pass1234</strong></p>
      <button className="btn btn-primary" onClick={onNext}>Continue <ChevronRight size={14} /></button>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Add a team member</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Invite your first staff member. They'll get their own login with role-based access.</p>

      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input className="form-control" placeholder="e.g. Sarah Johnson" value={form.name} onChange={e => set('name', e.target.value)} style={{ borderColor: errors.name ? 'var(--danger)' : undefined }} />
        {errors.name && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input className="form-control" type="email" placeholder="sarah@yourbusiness.com" value={form.email} onChange={e => set('email', e.target.value)} style={{ borderColor: errors.email ? 'var(--danger)' : undefined }} />
        {errors.email && <p style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Role</label>
        <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Default password: <strong>pass1234</strong> — they can change it after logging in</p>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onSkip}><SkipForward size={14} /> Skip for now</button>
        <button className="btn btn-primary" onClick={handleAdd}><Users size={14} /> Add Staff Member</button>
      </div>
    </div>
  );
}

function StepDone({ businessName, onFinish }) {
  const features = [
    { icon: Package,  label: 'Inventory',     path: '/inventory',   desc: 'Add & manage products' },
    { icon: Store,    label: 'POS Terminal',   path: '/pos',         desc: 'Start processing sales' },
    { icon: Truck,    label: 'Suppliers',      path: '/suppliers',   desc: 'Manage your vendors' },
    { icon: Users,    label: 'Staff & Users',  path: '/users',       desc: 'Manage your team' },
  ];
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>You're all set{businessName ? `, ${businessName}` : ''}!</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
        Your business is configured and ready to go. Here's what you can do next:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28, textAlign: 'left' }}>
        {features.map(f => (
          <div key={f.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <f.icon size={16} style={{ color: 'var(--primary-light)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }} onClick={onFinish}>
        Go to Dashboard <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Main Wizard ──────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const { completeOnboarding, setCurrency, showToast } = useApp();
  const [step, setStep] = useState(0);
  const [bizData, setBizData] = useState({ businessName: '', businessType: '', currency: 'USD' });

  const updateBiz = (k, v) => setBizData(f => ({ ...f, [k]: v }));

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const skip = () => next();

  const applyBusiness = () => {
    // Apply currency selection from step 2
    if (bizData.currency) setCurrency(bizData.currency);
    next();
  };

  const finish = () => {
    completeOnboarding(bizData.businessName);
    showToast('Welcome to Arwa Inventory Pro! 🎉', 'success');
  };

  const progress = (step / (STEPS.length - 1)) * 100;
  const currentStep = STEPS[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--bg-tertiary)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', transition: 'width 0.4s ease' }} />
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 24px 0' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i < step ? 'var(--success)' : i === step ? 'var(--primary-light)' : 'var(--border)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Step label */}
        <div style={{ textAlign: 'center', padding: '8px 24px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)' }}>
            <currentStep.icon size={12} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step {step + 1} of {STEPS.length} — {currentStep.title}
            </span>
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '20px 28px 28px' }}>
          {step === 0 && <StepWelcome onNext={next} />}
          {step === 1 && <StepBusiness data={bizData} onChange={updateBiz} onNext={applyBusiness} onBack={back} />}
          {step === 2 && <StepProduct onNext={next} onSkip={skip} />}
          {step === 3 && <StepSupplier onNext={next} onSkip={skip} />}
          {step === 4 && <StepStaff onNext={next} onSkip={skip} />}
          {step === 5 && <StepDone businessName={bizData.businessName} onFinish={finish} />}
        </div>
      </div>
    </div>
  );
}
