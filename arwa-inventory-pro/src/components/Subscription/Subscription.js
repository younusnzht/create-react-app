import React, { useState, useMemo } from 'react';
import {
  CheckCircle, X, Zap, Shield, Crown, CreditCard,
  Sparkles, ArrowRight, Check, AlertTriangle, Package
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SUBSCRIPTION_PLANS, SELF_HEALING_ADDON, ORDER_ADDON_PRICE, BUSINESS_TYPES } from '../../data/mockData';

const MODULE_INFO = {
  '/pos':             { label: 'Point of Sale',           emoji: '🛒', desc: 'Full POS terminal with barcode scanning, receipts and split payments', price: '$19/mo' },
  '/cash-counter':    { label: 'Cash Counter',            emoji: '🏦', desc: 'Till management, Z-reads, float tracking and shift reconciliation', price: '$9/mo' },
  '/online-orders':   { label: 'Online Orders',           emoji: '🌐', desc: 'Receive and manage orders from your ecommerce store in real time', price: '$19/mo' },
  '/quotes':          { label: 'Quotes & B2B Pricing',    emoji: '📋', desc: 'Create quotes, apply customer contract pricing, convert to orders', price: '$14/mo' },
  '/purchase-orders': { label: 'Purchase Orders',         emoji: '📝', desc: 'Full PO workflow with supplier confirmation and receiving', price: '$14/mo' },
  '/stock-transfers': { label: 'Stock Transfers',         emoji: '↔️', desc: 'Move inventory between locations and warehouses', price: '$9/mo' },
  '/backorders':      { label: 'Backorders',              emoji: '⏳', desc: 'Track and fulfil backorders automatically when stock arrives', price: '$9/mo' },
  '/barcode':         { label: 'Barcode System',          emoji: '📊', desc: 'Generate, print and scan barcodes with bulk label printing', price: '$9/mo' },
  '/lot-tracking':    { label: 'Lot & Serial Tracking',   emoji: '🔍', desc: 'Track products by batch, lot number or individual serial number', price: '$19/mo' },
  '/payroll':         { label: 'Payroll / T4',            emoji: '💵', desc: 'Canadian payroll processing with T4 slips and CRA remittances', price: '$24/mo' },
  '/tax':             { label: 'Canadian Tax Engine',     emoji: '🍁', desc: 'GST/HST/PST/QST auto-calculation for all 13 provinces and territories', price: 'Free' },
  '/cra-audit':       { label: 'CRA Audit Export',        emoji: '🗂️', desc: 'Generate CRA-ready audit files, SAF-T and financial summaries', price: '$14/mo' },
  '/accounting':      { label: 'Accounting Module',       emoji: '💰', desc: 'P&L, balance sheet, AR/AP aging, journal entries', price: 'Included' },
  '/reports':         { label: 'Advanced Reports',        emoji: '📈', desc: 'Custom report builder with scheduled email delivery', price: 'Included' },
};

const PLAN_ICONS = { basic: Shield, intermediate: Zap, super: Crown };

export default function Subscription() {
  const { subscription, setSubscription, showToast, orders, getEnabledModules } = useApp();
  const [billing, setBilling] = useState(subscription.billing);
  const [showUpgradeModal, setShowUpgradeModal] = useState(null);
  const [showSelfHealModal, setShowSelfHealModal] = useState(false);

  const currentMonthOrders = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return (orders || []).filter(o => o.date && o.date.startsWith(monthKey)).length;
  }, [orders]);

  const plans = Object.values(SUBSCRIPTION_PLANS);

  const handleUpgrade = (planId) => {
    setSubscription(prev => ({ ...prev, plan: planId, billing }));
    setShowUpgradeModal(null);
    showToast(`Switched to ${SUBSCRIPTION_PLANS[planId].name} plan!`, 'success');
  };

  const toggleSelfHealing = () => {
    const newVal = !subscription.selfHealing;
    setSubscription(prev => ({ ...prev, selfHealing: newVal }));
    setShowSelfHealModal(false);
    showToast(newVal ? 'AI Self-Healing Engine activated!' : 'AI Self-Healing deactivated', newVal ? 'success' : 'info');
  };

  const currentPlan = SUBSCRIPTION_PLANS[subscription.plan];
  const orderLimit = currentPlan.monthlyOrders;
  const orderPct = orderLimit > 0 ? Math.min((currentMonthOrders / orderLimit) * 100, 100) : 0;
  const overageOrders = Math.max(0, currentMonthOrders - orderLimit);
  const overageCharges = Math.ceil(overageOrders / 1000) * ORDER_ADDON_PRICE;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Subscription & Billing</h1>
          <p>Manage your Arwa 1.0 subscription and AI add-ons</p>
        </div>
      </div>

      {/* Current Plan */}
      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.08))', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: currentPlan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {React.createElement(PLAN_ICONS[subscription.plan] || Zap, { size: 24, color: 'white' })}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900 }}>Arwa {currentPlan.name} Plan</h2>
                <span className="badge badge-success">Active</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Next billing: {subscription.nextBilling} · {subscription.billing === 'monthly' ? 'Monthly' : 'Annual'} billing
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary-light)' }}>
              ${billing === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/{billing === 'yearly' ? 'yr' : 'mo'}</span>
            </div>
            {subscription.selfHealing && (
              <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                + $99/mo AI Self-Healing Add-on
              </p>
            )}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Orders this month</span>
            <span style={{ fontWeight: 700, color: orderPct >= 90 ? '#EF4444' : orderPct >= 70 ? '#F59E0B' : 'var(--success)' }}>
              {currentMonthOrders.toLocaleString()} / {orderLimit > 0 ? orderLimit.toLocaleString() : '∞'}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${orderPct}%`, background: orderPct >= 90 ? '#EF4444' : orderPct >= 70 ? '#F59E0B' : '#10B981', transition: 'width 0.5s ease' }} />
          </div>
          {overageOrders > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
              ⚠ {overageOrders.toLocaleString()} orders over limit — add-on charge: CA${overageCharges}/month ($20 per 1,000 orders)
            </div>
          )}
        </div>
      </div>

      {/* Billing Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
        <span style={{ fontSize: 13, color: billing === 'monthly' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: billing === 'monthly' ? 700 : 400 }}>Monthly</span>
        <button
          onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
          style={{
            width: 50, height: 26, borderRadius: 13,
            background: billing === 'yearly' ? 'var(--primary)' : 'var(--bg-tertiary)',
            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: 'white',
            position: 'absolute', top: 3,
            left: billing === 'yearly' ? 27 : 3,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
        <span style={{ fontSize: 13, color: billing === 'yearly' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: billing === 'yearly' ? 700 : 400 }}>
          Yearly <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>Save up to 17%</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
        {plans.map(plan => {
          const isActive = subscription.plan === plan.id;
          const Icon = PLAN_ICONS[plan.id] || Zap;
          const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.id}
              className={`plan-card ${isActive ? 'active' : ''} ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="plan-popular-badge">POPULAR</div>}
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={22} color="white" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {plan.id === 'basic' ? 'Perfect for small businesses' :
                   plan.id === 'intermediate' ? 'Ideal for growing teams' :
                   'Built for enterprises & franchises'}
                </p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: plan.color }}>${price}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/{billing === 'yearly' ? 'year' : 'month'}</span>
                {billing === 'yearly' && (
                  <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice}/yr</p>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(255,255,255,0.06)', borderRadius:8, marginBottom:12 }}>
                  <span style={{ fontSize:22, fontWeight:900, color:'var(--primary-light)' }}>
                    {plan.monthlyOrders > 0 ? plan.monthlyOrders.toLocaleString() : '∞'}
                  </span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700 }}>orders / month</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>+$20 per 1,000 over limit</div>
                  </div>
                </div>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <CheckCircle size={14} style={{ color: plan.color, flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
                {plan.locked?.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, opacity: 0.4 }}>
                    <X size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f}</span>
                  </div>
                ))}
              </div>
              {isActive ? (
                <button className="btn w-full" style={{ justifyContent: 'center', background: `${plan.color}22`, color: plan.color, border: `1px solid ${plan.color}44` }} disabled>
                  <Check size={14} /> Current Plan
                </button>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  style={{ justifyContent: 'center', background: plan.gradient }}
                  onClick={() => setShowUpgradeModal(plan.id)}
                >
                  {SUBSCRIPTION_PLANS[subscription.plan]?.monthlyPrice < plan.monthlyPrice ? 'Upgrade' : 'Downgrade'} to {plan.name}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Self-Healing Add-on */}
      <div style={{
        background: subscription.selfHealing
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.06))'
          : 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))',
        border: `2px solid ${subscription.selfHealing ? 'rgba(16,185,129,0.3)' : 'rgba(79,70,229,0.25)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} color="white" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800 }}>AI Self-Healing Engine</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white' }}>PREMIUM ADD-ON</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatic bug fixing and system repair — the most advanced AI automation</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {SELF_HEALING_ADDON.features.slice(0, 6).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Sparkles size={11} style={{ color: '#4F46E5', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: subscription.selfHealing ? '#10B981' : 'var(--primary-light)', marginBottom: 4 }}>
              $99<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/mo</span>
            </div>
            {!subscription.selfHealing && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Billed separately</p>}
            <button
              className={`btn btn-lg ${subscription.selfHealing ? 'btn-danger' : 'btn-primary'}`}
              style={{ minWidth: 160, justifyContent: 'center', background: subscription.selfHealing ? undefined : 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
              onClick={() => setShowSelfHealModal(true)}
            >
              {subscription.selfHealing ? (
                <><X size={14} /> Deactivate</>
              ) : (
                <><Sparkles size={14} /> Activate Now</>
              )}
            </button>
            {subscription.selfHealing && (
              <div style={{ marginTop: 8 }}>
                <span className="badge badge-success">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite', display: 'inline-block', marginRight: 4 }} />
                  Active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Add-Ons */}
      {(() => {
        const bt = BUSINESS_TYPES[subscription?.businessType || 'platform_admin'];
        const addOnPaths = bt?.addOns || [];
        if (addOnPaths.length === 0) return null;

        const overrides = subscription?.moduleOverrides || {};
        const enabledModules = getEnabledModules() || [];

        const isEnabled = (path) => {
          if (overrides[path] === true) return true;
          if (overrides[path] === false) return false;
          return enabledModules.includes(path);
        };

        const toggleAddOn = (path, label) => {
          const current = isEnabled(path);
          setSubscription(prev => ({
            ...prev,
            moduleOverrides: { ...(prev.moduleOverrides || {}), [path]: !current },
          }));
          showToast(`${label} ${!current ? 'enabled' : 'disabled'}`, !current ? 'success' : 'info');
        };

        return (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(91,95,207,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} style={{ color: 'var(--primary-light)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>Module Add-Ons</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Optional modules available for your <strong style={{ color: 'var(--text-secondary)' }}>{bt?.emoji} {bt?.label}</strong> setup — enable individually as needed
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 16 }}>
              {addOnPaths.map(path => {
                const info = MODULE_INFO[path];
                if (!info) return null;
                const active = isEnabled(path);
                return (
                  <div key={path} style={{
                    padding: '14px 16px', borderRadius: 10,
                    background: active ? 'rgba(16,185,129,0.06)' : 'var(--bg-tertiary)',
                    border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{info.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{info.label}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
                          background: active ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: active ? '#10B981' : '#D97706',
                        }}>
                          {active ? 'ENABLED' : 'ADD-ON'}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{info.desc}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: info.price === 'Free' || info.price === 'Included' ? 'var(--success)' : 'var(--primary-light)' }}>
                          {info.price}
                        </span>
                        <button
                          onClick={() => toggleAddOn(path, info.label)}
                          style={{
                            padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                            background: active ? 'rgba(239,68,68,0.12)' : 'var(--primary)',
                            color: active ? '#EF4444' : 'white',
                          }}
                        >
                          {active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 14 }}>
              Enabled add-ons appear immediately in the sidebar and are accessible via direct URL. Pricing shown is indicative — actual billing depends on your plan tier.
            </p>
          </div>
        );
      })()}

      {/* Billing Info */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Payment Method</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
            <div style={{ width: 40, height: 28, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} style={{ color: '#60A5FA' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>•••• •••• •••• 4242</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expires 12/2026</p>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Update</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Usage This Month</span></div>
          {[
            { label: 'AI Scans Used', value: '47', max: subscription.plan === 'basic' ? '10/day' : subscription.plan === 'intermediate' ? '100/day' : 'Unlimited' },
            { label: 'Products', value: '12', max: currentPlan.products === -1 ? 'Unlimited' : currentPlan.products.toLocaleString() },
            { label: 'Staff Accounts', value: '6', max: currentPlan.users === -1 ? 'Unlimited' : currentPlan.users },
          ].map(u => (
            <div key={u.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{u.value} / {u.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Plan Change</h3>
              <button className="icon-btn" onClick={() => setShowUpgradeModal(null)}><X size={16} /></button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Switch to <strong style={{ color: 'var(--text-primary)' }}>Arwa {SUBSCRIPTION_PLANS[showUpgradeModal].name} Plan</strong>?
              </p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary-light)', marginBottom: 20 }}>
                ${billing === 'yearly' ? SUBSCRIPTION_PLANS[showUpgradeModal].yearlyPrice : SUBSCRIPTION_PLANS[showUpgradeModal].monthlyPrice}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/{billing === 'yearly' ? 'year' : 'month'}</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>Changes take effect immediately. Prorated credits will be applied.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setShowUpgradeModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => handleUpgrade(showUpgradeModal)}>
                  <Check size={14} /> Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Healing Modal */}
      {showSelfHealModal && (
        <div className="modal-overlay" onClick={() => setShowSelfHealModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {subscription.selfHealing ? 'Deactivate Self-Healing' : 'Activate AI Self-Healing Engine'}
              </h3>
              <button className="icon-btn" onClick={() => setShowSelfHealModal(false)}><X size={16} /></button>
            </div>
            {!subscription.selfHealing ? (
              <div>
                <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.1))', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={18} style={{ color: 'var(--primary-light)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>What AI Self-Healing does</span>
                  </div>
                  {SELF_HEALING_ADDON.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Check size={12} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Monthly Add-on Cost</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-light)' }}>$99/mo</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowSelfHealModal(false)}>Cancel</button>
                  <button className="btn btn-primary w-full" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }} onClick={toggleSelfHealing}>
                    <Sparkles size={14} /> Activate for $99/mo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <AlertTriangle size={40} style={{ color: 'var(--warning)', marginBottom: 12 }} />
                  <p style={{ fontSize: 14, marginBottom: 8 }}>Deactivating AI Self-Healing will disable all automatic repair features.</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>You will be charged $99 for the current billing period.</p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => setShowSelfHealModal(false)}>Keep Active</button>
                    <button className="btn btn-danger" onClick={toggleSelfHealing}>Deactivate</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
