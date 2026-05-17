import React, { useState } from 'react';
import {
  Bot, Shield, Zap, Activity, AlertTriangle, CheckCircle, Clock,
  Play, RotateCcw, Lock, Database, Cpu, HardDrive,
  Server, RefreshCw, ChevronRight, Sparkles
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Critical' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Warning' },
  info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Info' },
};

const TYPE_ICONS = {
  performance: Activity,
  security: Shield,
  memory: Cpu,
  barcode: Zap,
  dependency: Database,
  crash: AlertTriangle,
};

const MetricCard = ({ label, value, unit, color, icon: Icon, subtext }) => (
  <div className="card" style={{ padding: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <Icon size={14} style={{ color }} />
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span></div>
    {subtext && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>}
  </div>
);


export default function AIGuardian() {
  const { aiMetrics, aiIssues, repairHistory, subscription, resolveIssue, runAIScan, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const canSelfHeal = subscription.selfHealing;
  const canAccessAI = subscription.plan !== 'basic';

  const pendingIssues = aiIssues.filter(i => i.status === 'pending');
  const resolvedIssues = aiIssues.filter(i => i.status === 'resolved');
  const criticalCount = pendingIssues.filter(i => i.severity === 'critical').length;

  const handleScan = () => {
    setScanning(true);
    runAIScan();
    setTimeout(() => setScanning(false), 2500);
  };

  const handleAutoFix = (issue) => {
    if (!canSelfHeal) {
      showToast('AI Self-Healing requires the add-on subscription', 'warning');
      navigate('/subscription');
      return;
    }
    showToast(`AI Self-Healing initiated for: ${issue.title}`, 'info');
    setTimeout(() => resolveIssue(issue.id), 1500);
  };

  const healthColor = aiMetrics.healthScore >= 80 ? '#10B981' : aiMetrics.healthScore >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} style={{ color: 'white' }} />
            </div>
            Arwa AI Dev Guardian
          </h1>
          <p>Continuous AI monitoring, analysis and optimization engine</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(16,185,129,0.12)', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Live Monitoring</span>
          </div>
          <button className={`btn btn-primary ${scanning ? 'ai-scanning' : ''}`} onClick={handleScan} disabled={scanning}>
            {scanning ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
            {scanning ? 'Scanning...' : 'Run AI Scan'}
          </button>
        </div>
      </div>

      {/* Plan gate for basic */}
      {!canAccessAI && (
        <div className="upgrade-banner" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={18} style={{ color: 'var(--primary-light)' }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700 }}>Advanced AI Monitoring requires Professional or Enterprise plan</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your Basic plan includes limited AI scans — upgrade for real-time monitoring</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/subscription')}>Upgrade Now</button>
        </div>
      )}

      {/* Critical alerts */}
      {criticalCount > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{criticalCount} Critical Issue{criticalCount > 1 ? 's' : ''} Detected</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Immediate attention required. {canSelfHeal ? 'AI Self-Healing can auto-resolve fixable issues.' : 'Enable AI Self-Healing to auto-resolve issues.'}</p>
          </div>
        </div>
      )}

      <div className="tabs">
        {['overview', 'issues', 'performance', 'security', 'repair-log'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          {/* Score cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Health Score', value: aiMetrics.healthScore, color: healthColor },
              { label: 'Performance', value: aiMetrics.performanceScore, color: '#4F46E5' },
              { label: 'Security', value: aiMetrics.securityScore, color: '#EF4444' },
              { label: 'Stability', value: aiMetrics.stabilityScore, color: '#10B981' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div className="progress-bar" style={{ marginTop: 10 }}>
                  <div className="progress-fill" style={{ width: `${s.value}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* System metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <MetricCard label="CPU Usage" value={aiMetrics.cpuUsage} unit="%" color="#4F46E5" icon={Cpu} subtext="Normal range" />
            <MetricCard label="RAM Usage" value={aiMetrics.ramUsage} unit="%" color={aiMetrics.ramUsage > 70 ? '#F59E0B' : '#10B981'} icon={Server} subtext={aiMetrics.ramUsage > 70 ? 'Elevated — monitor' : 'Normal'} />
            <MetricCard label="Disk Usage" value={aiMetrics.diskUsage} unit="%" color="#06B6D4" icon={HardDrive} subtext="Available space OK" />
            <MetricCard label="DB Query Avg" value={aiMetrics.dbQueryAvg} unit="s" color={aiMetrics.dbQueryAvg > 1 ? '#F59E0B' : '#10B981'} icon={Database} subtext={aiMetrics.dbQueryAvg > 1 ? 'Optimization needed' : 'Optimal'} />
            <MetricCard label="API Response" value={aiMetrics.apiResponseAvg} unit="ms" color="#10B981" icon={Zap} subtext="Fast" />
            <MetricCard label="Barcode Success" value={aiMetrics.barcodeSuccessRate} unit="%" color="#10B981" icon={Activity} subtext="Excellent" />
          </div>

          {/* Issues summary */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Active Issues</span>
                <span className="badge badge-danger">{pendingIssues.length} pending</span>
              </div>
              {pendingIssues.slice(0, 4).map(issue => {
                const cfg = SEVERITY_CONFIG[issue.severity];
                const Icon = TYPE_ICONS[issue.type] || AlertTriangle;
                return (
                  <div key={issue.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{issue.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{issue.module}</div>
                    </div>
                    <span className={`badge ${issue.severity === 'critical' ? 'badge-danger' : issue.severity === 'warning' ? 'badge-warning' : 'badge-info'}`}>{cfg.label}</span>
                  </div>
                );
              })}
              <button className="btn btn-secondary btn-sm w-full" style={{ marginTop: 12, justifyContent: 'center' }} onClick={() => setActiveTab('issues')}>
                View All Issues <ChevronRight size={12} />
              </button>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">AI Scan Stats</span>
              </div>
              {[
                { label: 'Scans Today', value: aiMetrics.scansToday, color: '#4F46E5' },
                { label: 'Issues Detected', value: aiMetrics.issuesDetected, color: '#F59E0B' },
                { label: 'Issues Auto-Resolved', value: aiMetrics.issuesResolved, color: '#10B981' },
                { label: 'System Uptime', value: `${aiMetrics.uptimePercent}%`, color: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}

              {/* Self-healing status */}
              <div style={{ marginTop: 12, padding: 12, background: canSelfHeal ? 'rgba(16,185,129,0.08)' : 'rgba(79,70,229,0.08)', border: `1px solid ${canSelfHeal ? 'rgba(16,185,129,0.2)' : 'rgba(79,70,229,0.2)'}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {canSelfHeal ? <Sparkles size={16} style={{ color: '#10B981' }} /> : <Lock size={16} style={{ color: 'var(--primary-light)' }} />}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: canSelfHeal ? '#10B981' : 'var(--primary-light)' }}>
                      {canSelfHeal ? 'AI Self-Healing: ACTIVE' : 'AI Self-Healing: LOCKED'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {canSelfHeal ? 'Auto-repair enabled for fixable issues' : 'Add-on required — +$99/mo'}
                    </p>
                  </div>
                  {!canSelfHeal && (
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/subscription')}>
                      Unlock
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Detected Issues</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-danger">{pendingIssues.length} active</span>
              <span className="badge badge-success">{resolvedIssues.length} resolved</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiIssues.map(issue => {
              const cfg = SEVERITY_CONFIG[issue.severity];
              const Icon = TYPE_ICONS[issue.type] || AlertTriangle;
              const resolved = issue.status === 'resolved';
              return (
                <div key={issue.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: 16, borderRadius: 10,
                  background: resolved ? 'var(--bg-tertiary)' : cfg.bg,
                  border: `1px solid ${resolved ? 'var(--border)' : cfg.color}22`,
                  opacity: resolved ? 0.7 : 1,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: resolved ? 'var(--bg-secondary)' : `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {resolved ? <CheckCircle size={18} style={{ color: '#10B981' }} /> : <Icon size={18} style={{ color: cfg.color }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{issue.title}</span>
                      <span className={`badge ${issue.severity === 'critical' ? 'badge-danger' : issue.severity === 'warning' ? 'badge-warning' : 'badge-info'}`}>{cfg.label}</span>
                      <span className="badge badge-gray">{issue.module}</span>
                      {resolved && <span className="badge badge-success">Resolved</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{issue.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                      Detected: {new Date(issue.detected).toLocaleString()}
                    </p>
                  </div>
                  {!resolved && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {issue.autoFixable && (
                        <button
                          className={`btn btn-sm ${canSelfHeal ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => handleAutoFix(issue)}
                          title={canSelfHeal ? 'Auto-fix with AI' : 'Requires Self-Healing add-on'}
                        >
                          {canSelfHeal ? <><Sparkles size={12} /> Auto Fix</> : <><Lock size={12} /> Auto Fix</>}
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => resolveIssue(issue.id)}>
                        <CheckCircle size={12} /> Resolve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Resource Utilization</span></div>
              {[
                { label: 'CPU Usage', value: aiMetrics.cpuUsage, color: '#4F46E5', threshold: 80 },
                { label: 'RAM Usage', value: aiMetrics.ramUsage, color: aiMetrics.ramUsage > 70 ? '#F59E0B' : '#10B981', threshold: 70 },
                { label: 'Disk Usage', value: aiMetrics.diskUsage, color: '#06B6D4', threshold: 85 },
              ].map(m => (
                <div key={m.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                  {m.value > m.threshold && (
                    <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>
                      <AlertTriangle size={10} style={{ display: 'inline', marginRight: 3 }} />
                      Above recommended threshold ({m.threshold}%)
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Response Times</span></div>
              {[
                { label: 'Database Query Avg', value: `${aiMetrics.dbQueryAvg}s`, status: aiMetrics.dbQueryAvg < 1 ? 'good' : 'slow', rec: 'Target: <1s' },
                { label: 'API Response Avg', value: `${aiMetrics.apiResponseAvg}ms`, status: 'good', rec: 'Target: <200ms' },
                { label: 'Barcode Scan Speed', value: '<100ms', status: 'good', rec: 'Target: <200ms' },
                { label: 'App Startup Time', value: '1.8s', status: 'good', rec: 'Target: <3s' },
                { label: 'Report Generation', value: '2.1s', status: 'good', rec: 'Target: <5s' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.rec}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.status === 'good' ? 'var(--success)' : 'var(--warning)' }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: m.status === 'good' ? 'var(--success)' : 'var(--warning)' }}>{m.status === 'good' ? '✓ Good' : '⚠ Slow'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div>
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Security Scan Results</span>
                <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Score: {aiMetrics.securityScore}/100</span>
              </div>
              {[
                { check: 'SQL Injection Prevention', status: 'pass' },
                { check: 'Password Hashing (bcrypt)', status: 'pass' },
                { check: 'Session Encryption', status: 'pass' },
                { check: 'API Authentication', status: 'pass' },
                { check: 'Dependency Vulnerabilities', status: 'fail', detail: '1 known CVE detected' },
                { check: 'Password Policy Enforcement', status: 'warn', detail: 'Weak password detected for user' },
                { check: 'Audit Logging', status: 'pass' },
                { check: 'Data Encryption at Rest', status: 'pass' },
                { check: '2FA Enforcement', status: 'warn', detail: 'Not enforced for all admin accounts' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flexShrink: 0 }}>
                    {c.status === 'pass' ? <CheckCircle size={14} style={{ color: '#10B981' }} /> :
                     c.status === 'fail' ? <AlertTriangle size={14} style={{ color: '#EF4444' }} /> :
                     <AlertTriangle size={14} style={{ color: '#F59E0B' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{c.check}</div>
                    {c.detail && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.detail}</div>}
                  </div>
                  <span className={`badge ${c.status === 'pass' ? 'badge-success' : c.status === 'fail' ? 'badge-danger' : 'badge-warning'}`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Security Recommendations</span></div>
              {[
                { title: 'Update crypto-utils package', priority: 'High', desc: 'CVE-2024-1234 affects versions < 2.2.0. Update to patch vulnerability.' },
                { title: 'Enforce strong password policy', priority: 'High', desc: 'Require minimum 12 characters with complexity for all staff accounts.' },
                { title: 'Enable 2FA for all admins', priority: 'Medium', desc: 'Two-factor authentication adds critical protection against credential theft.' },
                { title: 'Review API access logs', priority: 'Low', desc: 'Unusual access patterns detected from external IP. Review logs.' },
              ].map((r, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</span>
                    <span className={`badge ${r.priority === 'High' ? 'badge-danger' : r.priority === 'Medium' ? 'badge-warning' : 'badge-info'}`}>{r.priority}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'repair-log' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">AI Repair History</span>
            {!canSelfHeal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unlock Self-Healing to enable auto-repairs</span>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/subscription')}>Upgrade</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {repairHistory.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: r.result === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.result === 'success' ? <CheckCircle size={16} style={{ color: '#10B981' }} /> : <RotateCcw size={16} style={{ color: '#EF4444' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.action}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {r.module} · {new Date(r.time).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${r.result === 'success' ? 'badge-success' : 'badge-danger'}`}>
                    {r.result === 'success' ? 'Success' : 'Rolled Back'}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{r.improvement}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
