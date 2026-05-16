import React, { useState } from 'react';
import { Save, Building2, Bell, Shield, Database, Palette, Printer, Zap } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const SettingRow = ({ label, desc, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ flex: 1, marginRight: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
    </div>
    {children}
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 44, height: 24, borderRadius: 12,
      background: value ? 'var(--primary)' : 'var(--bg-tertiary)',
      border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
      cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%', background: 'white',
      position: 'absolute', top: 2, left: value ? 22 : 2,
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </button>
);

export default function Settings() {
  const { theme, toggleTheme, showToast } = useApp();
  const [settings, setSettings] = useState({
    companyName: 'Arwa Enterprises',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    lowStockAlerts: true,
    expiryAlerts: true,
    emailNotifications: true,
    smsAlerts: false,
    aiAlerts: true,
    autoBackup: true,
    backupFrequency: 'daily',
    cloudSync: true,
    twoFactor: false,
    sessionTimeout: '30',
    receiptPrinter: 'thermal',
    autoUpdatePrice: false,
    multiCurrency: false,
  });

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const SECTIONS = [
    {
      icon: Building2, title: 'Business Information',
      items: [
        { key: 'companyName', label: 'Company Name', type: 'text' },
        { key: 'currency', label: 'Default Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'AUD'] },
        { key: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'UTC+1', 'UTC+3', 'UTC+4', 'UTC+5:30', 'UTC-5', 'UTC-8'] },
        { key: 'language', label: 'Language', type: 'select', options: [{ val: 'en', label: 'English' }, { val: 'ar', label: 'Arabic' }, { val: 'fr', label: 'French' }] },
      ]
    },
    {
      icon: Palette, title: 'Appearance',
      items: [
        { key: 'theme', label: 'Dark Mode', desc: 'Toggle between dark and light theme', type: 'toggle', val: theme === 'dark', onChange: toggleTheme },
        { key: 'multiCurrency', label: 'Multi-Currency Display', desc: 'Show prices in multiple currencies', type: 'toggle' },
      ]
    },
    {
      icon: Bell, title: 'Notifications',
      items: [
        { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Notify when products reach minimum stock', type: 'toggle' },
        { key: 'expiryAlerts', label: 'Expiry Date Alerts', desc: 'Alert when products are close to expiry', type: 'toggle' },
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send reports and alerts via email', type: 'toggle' },
        { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Critical alerts via SMS', type: 'toggle' },
        { key: 'aiAlerts', label: 'AI Guardian Alerts', desc: 'Receive AI system health notifications', type: 'toggle' },
      ]
    },
    {
      icon: Shield, title: 'Security',
      items: [
        { key: 'twoFactor', label: '2FA Authentication', desc: 'Require 2FA for all admin logins', type: 'toggle' },
        { key: 'sessionTimeout', label: 'Session Timeout', type: 'select', options: ['15', '30', '60', '120', 'never'] },
      ]
    },
    {
      icon: Database, title: 'Data & Backup',
      items: [
        { key: 'autoBackup', label: 'Automatic Backup', desc: 'Automatically backup data', type: 'toggle' },
        { key: 'backupFrequency', label: 'Backup Frequency', type: 'select', options: ['hourly', 'daily', 'weekly', 'monthly'] },
        { key: 'cloudSync', label: 'Cloud Synchronization', desc: 'Sync data across devices in real-time', type: 'toggle' },
      ]
    },
    {
      icon: Printer, title: 'Hardware',
      items: [
        { key: 'receiptPrinter', label: 'Receipt Printer Type', type: 'select', options: ['thermal', 'inkjet', 'laser', 'none'] },
        { key: 'autoUpdatePrice', label: 'Auto Price Updates', desc: 'Automatically update POS prices from inventory', type: 'toggle' },
      ]
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Configure Arwa Inventory Pro for your business</p>
        </div>
        <button className="btn btn-primary" onClick={() => showToast('Settings saved successfully')}>
          <Save size={14} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SECTIONS.map(section => (
          <div key={section.title} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <section.icon size={16} style={{ color: 'var(--primary-light)' }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{section.title}</h3>
            </div>
            {section.items.map(item => (
              <SettingRow key={item.key} label={item.label} desc={item.desc}>
                {item.type === 'toggle' ? (
                  <Toggle
                    value={item.val !== undefined ? item.val : settings[item.key]}
                    onChange={item.onChange || ((v) => set(item.key, v))}
                  />
                ) : item.type === 'select' ? (
                  <select
                    className="form-control"
                    style={{ width: 160 }}
                    value={settings[item.key]}
                    onChange={e => set(item.key, e.target.value)}
                  >
                    {(item.options || []).map(o => (
                      typeof o === 'string'
                        ? <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                        : <option key={o.val} value={o.val}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="form-control"
                    style={{ width: 240 }}
                    value={settings[item.key]}
                    onChange={e => set(item.key, e.target.value)}
                  />
                )}
              </SettingRow>
            ))}
          </div>
        ))}

        {/* Danger Zone */}
        <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} style={{ color: '#EF4444' }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#EF4444' }}>Danger Zone</h3>
          </div>
          <SettingRow label="Clear All Data" desc="Permanently delete all inventory, orders, and customer data">
            <button className="btn btn-danger btn-sm" onClick={() => showToast('This action requires admin confirmation', 'warning')}>
              Clear Data
            </button>
          </SettingRow>
          <SettingRow label="Reset to Factory Defaults" desc="Reset all settings to default values">
            <button className="btn btn-danger btn-sm" onClick={() => showToast('Settings reset to defaults', 'info')}>
              Reset Settings
            </button>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
