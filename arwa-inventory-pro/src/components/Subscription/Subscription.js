import React, { useState, useMemo } from 'react';
import {
  CheckCircle, X, Zap, Shield, Crown, CreditCard,
  Sparkles, ArrowRight, Check, AlertTriangle, Package,
  Users, Bot
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SUBSCRIPTION_PLANS, AI_ADDONS, ORDER_ADDON_PRICE, BUSINESS_TYPES } from '../../data/mockData';

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

const AI_ADDON_ICONS = { selfHealing: Sparkles, workflowAutomation: Zap, aiAssistant: Bot };

function AIAddonCard({ addon, active, onToggle, billing }) {
  const [showModal, setShowModal] = useState(false);
  const Icon = AI_ADDON_ICONS[addon.id] || Sparkles;
  const price = billing === 'yearly' ? addon.yearlyPrice : addon.monthlyPrice;
  const period = billing === 'yearly' ? 'yr' : 'mo';

  return (
    <>
      <div style={{
        background: active
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))'
          : 'var(--bg-secondary)',
        border: `2px solid ${active ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: addon.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {addon.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800 }}>{addon.name}</h4>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                background: active ? 'rgba(16,185,129,0.15)' : 'rgba(79,70,229,0.15)',
                color: active ? '#10B981' : 'var(--primary-light)',
              }}>
                {active ? 'ACTIVE' : 'ADD-ON'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{addon.subtitle}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 14 }}>
              {addon.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <Icon size={10} style={{ color: active ? '#10B981' : 'var(--primary-light)', flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 24, fontWeight: 900, color: active ? '#10B981' : 'var(--primary-light)' }}>
                  ${price}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/{period}</span>
                {billing === 'yearly' && (
                  <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 6 }}>
                    Save ${(addon.monthlyPrice * 12) - addon.yearlyPrice}/yr
                  </span>
                )}
              </div>
              <button
                className={`btn ${active ? 'btn-danger' : 'btn-primary'} btn-sm`}
                style={{ minWidth: 120, justifyContent: 'center', background: active ? undefined : addon.gradient }}
                onClick={() => setShowModal(true)}
              >
                {active ? <><X size={13} /> Deactivate</> : <><Sparkles size={13} /> Activate</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {active ? `Deactivate ${addon.name}` : `Activate ${addon.name}`}
              </h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {!active ? (
              <div>
                <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.1))', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>{addon.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{addon.name} — What's included</span>
                  </div>
                  {addon.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Check size={12} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Monthly Add-on Cost</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-light)' }}>${addon.monthlyPrice}/mo</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button
                    className="btn btn-primary w-full"
                    style={{ justifyContent: 'center', background: addon.gradient }}
                    onClick={() => { onToggle(); setShowModal(false); }}
                  >
                    <Sparkles size={14} /> Activate for ${addon.monthlyPrice}/mo
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <AlertTriangle size={40} style={{ color: 'var(--warning)', marginBottom: 12 }} />
                <p style={{ fontSize: 14, marginBottom: 8 }}>Deactivating will immediately disable {addon.name}.</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>You will be charged ${addon.monthlyPrice} for the current billing period.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Keep Active</button>
                  <button className="btn btn-danger" onClick={() => { onToggle(); setShowModal(false); }}>Deactivate</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function Subscription() {
  const { subscription, setSubscription, showToast, orders, getEnabledModules, users } = useApp();
  const [billing, setBilling] = useState(subscription.billing);
  const [showUpgradeModal, setShowUpgradeModal] = useState(null);

  const currentMonthOrders = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return (orders || []).filter(o => o.date && o.date.startsWith(monthKey)).length;
  }, [orders]);

  const plans = Object.values(SUBSCRIPTION_PLANS);
  const currentPlan = SUBSCRIPTION_PLANS[subscription.plan];
  const orderLimit = currentPlan.monthlyOrders;
  const orderPct = orderLimit > 0 ? Math.min((currentMonthOrders / orderLimit) * 100, 100) : 0;
  const overageOrders = Math.max(0, currentMonthOrders - orderLimit);
  const overageOrderCharges = Math.ceil(overageOrders / 1000) * ORDER_ADDON_PRICE;

  const activeUserCount = (users || []).filter(u => u.status === 'active').length;
  const includedUsers = currentPlan.includedUsers || 1;
  const extraUsers = Math.max(0, activeUserCount - includedUsers);
  const extraUserCost = extraUsers * (currentPlan.extraUserCost || 20);

  const aiAddonMonthlyCost = Object.values(AI_ADDONS).reduce((sum, a) => {
    return sum + (subscription[a.id] ? a.monthlyPrice : 0);
  }, 0);

  const handleUpgrade = (planId) => {
    setSubscription(prev => ({ ...prev, plan: planId, billing }));
    setShowUpgradeModal(null);
    showToast(`Switched to ${SUBSCRIPTION_PLANS[planId].name} plan!`, 'success');
  };

  const toggleAIAddon = (addonId) => {
    const newVal = !subscription[addonId];
    setSubscription(prev => ({ ...prev, [addonId]: newVal }));
    showToast(
      newVal ? `${AI_ADDONS[addonId].name} activated!` : `${AI_ADDONS[addonId].name} deactivated`,
      newVal ? 'success' : 'info'
    );
  };

  const basePrice = billing === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Subscription & Billing</h1>
          <p>Manage your Arwa 1.0 subscription and AI add-ons</p>
        </div>
      </div>

      {/* Current Plan Banner */}
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
              ${basePrice}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/{billing === 'yearly' ? 'yr' : 'mo'}</span>
            </div>
            {extraUserCost > 0 && (
              <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
                + ${extraUserCost}/mo ({extraUsers} extra user{extraUsers !== 1 ? 's' : ''})
              </p>
            )}
            {aiAddonMonthlyCost > 0 && (
              <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                + ${aiAddonMonthlyCost}/mo AI Intelligence add-ons
              </p>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Orders this month</span>
              <span style={{ fontWeight: 700, color: orderPct >= 90 ? '#EF4444' : orderPct >= 70 ? '#F59E0B' : 'var(--success)' }}>
                {currentMonthOrders.toLocaleString()} / {orderLimit > 0 ? orderLimit.toLocaleString() : '∞'}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${orderPct}%`, background: orderPct >= 90 ? '#EF4444' : orderPct >= 70 ? '#F59E0B' : '#10B981', transition: 'width 0.5s ease' }} />
            </div>
            {overageOrders > 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
                ⚠ {overageOrders.toLocaleString()} over limit — +CA${overageOrderCharges}
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Active users</span>
              <span style={{ fontWeight: 700, color: extraUsers > 0 ? '#F59E0B' : 'var(--success)' }}>
                {activeUserCount} / {includedUsers} included
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${Math.min((activeUserCount / includedUsers) * 100, 100)}%`, background: extraUsers > 0 ? '#F59E0B' : '#10B981', transition: 'width 0.5s ease' }} />
            </div>
            {extraUsers > 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
                {extraUsers} extra user{extraUsers !== 1 ? 's' : ''} × ${currentPlan.extraUserCost} = +${extraUserCost}/mo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
        <span style={{ fontSize: 13, color: billing === 'monthly' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: billing === 'monthly' ? 700 : 400 }}>Monthly</span>
        <button
          onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
          style={{ width: 50, height: 26, borderRadius: 13, background: billing === 'yearly' ? 'var(--primary)' : 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
        >
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: billing === 'yearly' ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
        </button>
        <span style={{ fontSize: 13, color: billing === 'yearly' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: billing === 'yearly' ? 700 : 400 }}>
          Yearly <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>Save up to 17%</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        {plans.map(plan => {
          const isActive = subscription.plan === plan.id;
          const Icon = PLAN_ICONS[plan.id] || Zap;
          const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          return (
            <div key={plan.id} className={`plan-card ${isActive ? 'active' : ''} ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="plan-popular-badge">POPULAR</div>}
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={22} color="white" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {plan.id === 'basic' ? 'Perfect for solo & small businesses' :
                   plan.id === 'intermediate' ? 'Ideal for growing teams' :
                   'Built for enterprises & franchises'}
                </p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: plan.color }}>${price}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/{billing === 'yearly' ? 'year' : 'month'}</span>
                {billing === 'yearly' && (
                  <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice}/yr</p>
                )}
              </div>

              {/* User pricing highlight */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 12 }}>
                <Users size={16} style={{ color: plan.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{plan.includedUsers} user{plan.includedUsers !== 1 ? 's' : ''} included</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+${plan.extraUserCost}/mo per extra user</div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                    <CheckCircle size={13} style={{ color: plan.color, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
                {plan.locked?.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, opacity: 0.4 }}>
                    <X size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
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
                  {(SUBSCRIPTION_PLANS[subscription.plan]?.monthlyPrice || 0) < plan.monthlyPrice ? 'Upgrade' : 'Downgrade'} to {plan.name}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Intelligence Add-ons */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800 }}>AI Intelligence Add-ons</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Powerful AI modules available on any plan — activate only what you need
            </p>
          </div>
          {aiAddonMonthlyCost > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
              ${aiAddonMonthlyCost}/mo active
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {Object.values(AI_ADDONS).map(addon => (
            <AIAddonCard
              key={addon.id}
              addon={addon}
              active={!!subscription[addon.id]}
              onToggle={() => toggleAIAddon(addon.id)}
              billing={billing}
            />
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          AI add-ons are billed separately and can be activated or deactivated at any time. Charges apply for the current billing period.
        </p>
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
          setSubscription(prev => ({ ...prev, moduleOverrides: { ...(prev.moduleOverrides || {}), [path]: !current } }));
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
                  Optional modules for <strong style={{ color: 'var(--text-secondary)' }}>{bt?.emoji} {bt?.label}</strong> — enable individually as needed
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 16 }}>
              {addOnPaths.map(path => {
                const info = MODULE_INFO[path];
                if (!info) return null;
                const active = isEnabled(path);
                return (
                  <div key={path} style={{ padding: '14px 16px', borderRadius: 10, background: active ? 'rgba(16,185,129,0.06)' : 'var(--bg-tertiary)', border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`, display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{info.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{info.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: active ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: active ? '#10B981' : '#D97706' }}>
                          {active ? 'ENABLED' : 'ADD-ON'}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{info.desc}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: info.price === 'Free' || info.price === 'Included' ? 'var(--success)' : 'var(--primary-light)' }}>{info.price}</span>
                        <button onClick={() => toggleAddOn(path, info.label)} style={{ padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: active ? 'rgba(239,68,68,0.12)' : 'var(--primary)', color: active ? '#EF4444' : 'white' }}>
                          {active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            { label: 'Active Users', value: String(activeUserCount), max: `${includedUsers} included${extraUsers > 0 ? ` (+${extraUsers} extra)` : ''}` },
          ].map(u => (
            <div key={u.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{u.value} / {u.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
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
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary-light)', marginBottom: 8 }}>
                ${billing === 'yearly' ? SUBSCRIPTION_PLANS[showUpgradeModal].yearlyPrice : SUBSCRIPTION_PLANS[showUpgradeModal].monthlyPrice}
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/{billing === 'yearly' ? 'year' : 'month'}</span>
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                Includes {SUBSCRIPTION_PLANS[showUpgradeModal].includedUsers} user{SUBSCRIPTION_PLANS[showUpgradeModal].includedUsers !== 1 ? 's' : ''} — +${SUBSCRIPTION_PLANS[showUpgradeModal].extraUserCost}/mo per extra user
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
    </div>
  );
}
