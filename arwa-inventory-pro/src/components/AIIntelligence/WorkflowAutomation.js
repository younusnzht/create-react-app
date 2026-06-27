import React, { useState } from 'react';
import { Zap, Plus, Play, Pause, Trash2, ChevronRight, Package, ShoppingCart, Mail, Bell, FileText, Clock, CheckCircle, AlertTriangle, X, Toggle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const TRIGGER_TYPES = [
  { id: 'low_stock', label: 'Low Stock Alert', icon: Package, color: '#EF4444', desc: 'Triggers when a product falls below minimum stock level' },
  { id: 'new_order', label: 'New Order Received', icon: ShoppingCart, color: '#4F46E5', desc: 'Triggers when a new customer order is placed' },
  { id: 'po_delivered', label: 'Purchase Order Delivered', icon: CheckCircle, color: '#10B981', desc: 'Triggers when a purchase order is marked as delivered' },
  { id: 'scheduled', label: 'Scheduled (Time-based)', icon: Clock, color: '#F59E0B', desc: 'Triggers at a set time — daily, weekly, or monthly' },
];

const ACTION_TYPES = [
  { id: 'create_po', label: 'Create Purchase Order', icon: FileText, desc: 'Auto-generate a PO to the default supplier' },
  { id: 'send_email', label: 'Send Email Notification', icon: Mail, desc: 'Send an email to a specified address' },
  { id: 'push_alert', label: 'Push In-App Alert', icon: Bell, desc: 'Show an alert inside the dashboard' },
  { id: 'send_report', label: 'Send Scheduled Report', icon: FileText, desc: 'Email a report at the scheduled time' },
];

const SAMPLE_WORKFLOWS = [
  {
    id: 'wf-001', name: 'Auto Reorder on Low Stock', active: true,
    trigger: 'low_stock', action: 'create_po',
    triggerLabel: 'When product hits reorder point', actionLabel: 'Create Purchase Order automatically',
    runCount: 14, lastRun: '2026-06-26',
  },
  {
    id: 'wf-002', name: 'New Order Staff Alert', active: true,
    trigger: 'new_order', action: 'push_alert',
    triggerLabel: 'When new Sales Order is received', actionLabel: 'Push alert to warehouse staff',
    runCount: 47, lastRun: '2026-06-27',
  },
  {
    id: 'wf-003', name: 'Weekly Sales Report', active: false,
    trigger: 'scheduled', action: 'send_report',
    triggerLabel: 'Every Monday at 8:00 AM', actionLabel: 'Email sales summary report',
    runCount: 8, lastRun: '2026-06-23',
  },
];

export default function WorkflowAutomation() {
  const { subscription, showToast } = useApp();
  const [workflows, setWorkflows] = useState(SAMPLE_WORKFLOWS);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');

  const isActive = !!subscription.workflowAutomation;

  const toggleWorkflow = (id) => {
    if (!isActive) { showToast('Activate Workflow Automation add-on in Subscription to enable workflows', 'warning'); return; }
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
    showToast('Workflow updated', 'success');
  };

  const deleteWorkflow = (id) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    showToast('Workflow deleted', 'info');
  };

  const handleCreate = () => {
    if (!newName || !newTrigger || !newAction) { showToast('Please fill in all fields', 'warning'); return; }
    const t = TRIGGER_TYPES.find(t => t.id === newTrigger);
    const a = ACTION_TYPES.find(a => a.id === newAction);
    setWorkflows(prev => [{
      id: `wf-${Date.now()}`, name: newName, active: true,
      trigger: newTrigger, action: newAction,
      triggerLabel: t?.desc || '', actionLabel: a?.desc || '',
      runCount: 0, lastRun: null,
    }, ...prev]);
    setNewName(''); setNewTrigger(''); setNewAction('');
    setShowNew(false);
    showToast('Workflow created!', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Workflow Automation</h1>
          <p>Automate repetitive tasks with trigger-based rules</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!isActive && (
            <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)' }}>
              ⚡ Add-on required — activate in Subscription
            </span>
          )}
          <button className="btn btn-primary" onClick={() => setShowNew(true)} disabled={!isActive}>
            <Plus size={15} /> New Workflow
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Workflows', value: workflows.length, color: '#4F46E5', icon: Zap },
          { label: 'Active', value: workflows.filter(w => w.active).length, color: '#10B981', icon: CheckCircle },
          { label: 'Paused', value: workflows.filter(w => !w.active).length, color: '#F59E0B', icon: Pause },
          { label: 'Total Runs', value: workflows.reduce((s, w) => s + w.runCount, 0), color: '#3B82F6', icon: Play },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              <s.icon size={14} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add-on locked banner */}
      {!isActive && (
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.06))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <AlertTriangle size={22} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Workflow Automation is not active</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Go to <strong>Subscription</strong> → AI Intelligence → activate <strong>Workflow Automation ($49/mo)</strong> to enable and run workflows.</p>
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Your Workflows</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {workflows.map(wf => (
            <div key={wf.id} style={{
              padding: '16px 18px', borderRadius: 10,
              background: wf.active ? 'rgba(16,185,129,0.04)' : 'var(--bg-tertiary)',
              border: `1px solid ${wf.active ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', gap: 16,
              opacity: !isActive ? 0.6 : 1,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: wf.active ? '#10B981' : 'var(--text-muted)', boxShadow: wf.active ? '0 0 6px #10B981' : 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{wf.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(79,70,229,0.12)', color: 'var(--primary-light)', fontWeight: 600 }}>TRIGGER</span>
                  {wf.triggerLabel}
                  <ChevronRight size={12} />
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontWeight: 600 }}>ACTION</span>
                  {wf.actionLabel}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{wf.runCount} runs</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{wf.lastRun ? `Last: ${wf.lastRun}` : 'Never run'}</div>
              </div>
              <button onClick={() => toggleWorkflow(wf.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: wf.active ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', color: wf.active ? '#F59E0B' : '#10B981' }}>
                {wf.active ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
              </button>
              <button onClick={() => deleteWorkflow(wf.id)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {workflows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Zap size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No workflows yet. Create your first one.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Workflow Modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Workflow</h3>
              <button className="icon-btn" onClick={() => setShowNew(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Workflow Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Auto Reorder Pharmaceuticals" style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Trigger — When this happens...</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TRIGGER_TYPES.map(t => (
                    <div key={t.id} onClick={() => setNewTrigger(t.id)} style={{ padding: '10px 12px', borderRadius: 8, border: `2px solid ${newTrigger === t.id ? t.color : 'var(--border)'}`, cursor: 'pointer', background: newTrigger === t.id ? `${t.color}11` : 'var(--bg-tertiary)', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: newTrigger === t.id ? t.color : 'var(--text-primary)', marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Action — Do this...</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ACTION_TYPES.map(a => (
                    <div key={a.id} onClick={() => setNewAction(a.id)} style={{ padding: '10px 12px', borderRadius: 8, border: `2px solid ${newAction === a.id ? '#10B981' : 'var(--border)'}`, cursor: 'pointer', background: newAction === a.id ? 'rgba(16,185,129,0.08)' : 'var(--bg-tertiary)', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: newAction === a.id ? '#10B981' : 'var(--text-primary)', marginBottom: 2 }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn btn-primary w-full" style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }} onClick={handleCreate}>
                  <Zap size={14} /> Create Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
