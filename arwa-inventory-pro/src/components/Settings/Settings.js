import React, { useState } from 'react';
import { Save, Building2, Bell, Shield, Database, Palette, Printer, Zap, X, Key, Eye, EyeOff, Download, Upload, Lock } from 'lucide-react';
import { BUSINESS_TYPES } from '../../data/mockData';
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

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'AFN', name: 'Afghan Afghani' },
  { code: 'ALL', name: 'Albanian Lek' },
  { code: 'AMD', name: 'Armenian Dram' },
  { code: 'ANG', name: 'Netherlands Antillean Guilder' },
  { code: 'AOA', name: 'Angolan Kwanza' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'AWG', name: 'Aruban Florin' },
  { code: 'AZN', name: 'Azerbaijani Manat' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark' },
  { code: 'BBD', name: 'Barbadian Dollar' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'BIF', name: 'Burundian Franc' },
  { code: 'BMD', name: 'Bermudan Dollar' },
  { code: 'BND', name: 'Brunei Dollar' },
  { code: 'BOB', name: 'Bolivian Boliviano' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'BSD', name: 'Bahamian Dollar' },
  { code: 'BTN', name: 'Bhutanese Ngultrum' },
  { code: 'BWP', name: 'Botswanan Pula' },
  { code: 'BYN', name: 'Belarusian Ruble' },
  { code: 'BZD', name: 'Belize Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CDF', name: 'Congolese Franc' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'CRC', name: 'Costa Rican Colón' },
  { code: 'CUP', name: 'Cuban Peso' },
  { code: 'CVE', name: 'Cape Verdean Escudo' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DJF', name: 'Djiboutian Franc' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'DOP', name: 'Dominican Peso' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'ERN', name: 'Eritrean Nakfa' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'EUR', name: 'Euro' },
  { code: 'FJD', name: 'Fijian Dollar' },
  { code: 'FKP', name: 'Falkland Islands Pound' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'GEL', name: 'Georgian Lari' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'GIP', name: 'Gibraltar Pound' },
  { code: 'GMD', name: 'Gambian Dalasi' },
  { code: 'GNF', name: 'Guinean Franc' },
  { code: 'GTQ', name: 'Guatemalan Quetzal' },
  { code: 'GYD', name: 'Guyanaese Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'HNL', name: 'Honduran Lempira' },
  { code: 'HRK', name: 'Croatian Kuna' },
  { code: 'HTG', name: 'Haitian Gourde' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'IQD', name: 'Iraqi Dinar' },
  { code: 'IRR', name: 'Iranian Rial' },
  { code: 'ISK', name: 'Icelandic Króna' },
  { code: 'JMD', name: 'Jamaican Dollar' },
  { code: 'JOD', name: 'Jordanian Dinar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'KGS', name: 'Kyrgystani Som' },
  { code: 'KHR', name: 'Cambodian Riel' },
  { code: 'KMF', name: 'Comorian Franc' },
  { code: 'KPW', name: 'North Korean Won' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'KYD', name: 'Cayman Islands Dollar' },
  { code: 'KZT', name: 'Kazakhstani Tenge' },
  { code: 'LAK', name: 'Laotian Kip' },
  { code: 'LBP', name: 'Lebanese Pound' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'LRD', name: 'Liberian Dollar' },
  { code: 'LSL', name: 'Lesotho Loti' },
  { code: 'LYD', name: 'Libyan Dinar' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'MDL', name: 'Moldovan Leu' },
  { code: 'MGA', name: 'Malagasy Ariary' },
  { code: 'MKD', name: 'Macedonian Denar' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'MNT', name: 'Mongolian Tugrik' },
  { code: 'MOP', name: 'Macanese Pataca' },
  { code: 'MRU', name: 'Mauritanian Ouguiya' },
  { code: 'MUR', name: 'Mauritian Rupee' },
  { code: 'MVR', name: 'Maldivian Rufiyaa' },
  { code: 'MWK', name: 'Malawian Kwacha' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'MZN', name: 'Mozambican Metical' },
  { code: 'NAD', name: 'Namibian Dollar' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'NIO', name: 'Nicaraguan Córdoba' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'OMR', name: 'Omani Rial' },
  { code: 'PAB', name: 'Panamanian Balboa' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'PGK', name: 'Papua New Guinean Kina' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'PYG', name: 'Paraguayan Guarani' },
  { code: 'QAR', name: 'Qatari Rial' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'RSD', name: 'Serbian Dinar' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'SBD', name: 'Solomon Islands Dollar' },
  { code: 'SCR', name: 'Seychellois Rupee' },
  { code: 'SDG', name: 'Sudanese Pound' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'SHP', name: 'Saint Helena Pound' },
  { code: 'SLL', name: 'Sierra Leonean Leone' },
  { code: 'SOS', name: 'Somali Shilling' },
  { code: 'SRD', name: 'Surinamese Dollar' },
  { code: 'STN', name: 'São Tomé & Príncipe Dobra' },
  { code: 'SVC', name: 'Salvadoran Colón' },
  { code: 'SYP', name: 'Syrian Pound' },
  { code: 'SZL', name: 'Swazi Lilangeni' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'TJS', name: 'Tajikistani Somoni' },
  { code: 'TMT', name: 'Turkmenistani Manat' },
  { code: 'TND', name: 'Tunisian Dinar' },
  { code: 'TOP', name: 'Tongan Paʻanga' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar' },
  { code: 'TWD', name: 'New Taiwan Dollar' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'UYU', name: 'Uruguayan Peso' },
  { code: 'UZS', name: 'Uzbekistani Som' },
  { code: 'VES', name: 'Venezuelan Bolívar' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'VUV', name: 'Vanuatu Vatu' },
  { code: 'WST', name: 'Samoan Tala' },
  { code: 'XAF', name: 'Central African CFA Franc' },
  { code: 'XCD', name: 'East Caribbean Dollar' },
  { code: 'XOF', name: 'West African CFA Franc' },
  { code: 'XPF', name: 'CFP Franc' },
  { code: 'YER', name: 'Yemeni Rial' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'ZMW', name: 'Zambian Kwacha' },
  { code: 'ZWL', name: 'Zimbabwean Dollar' },
];

const COLOR_THEMES = [
  { id: 'indigo', label: 'Indigo', colors: ['#4F46E5', '#7C3AED'] },
  { id: 'emerald', label: 'Emerald', colors: ['#059669', '#0D9488'] },
  { id: 'rose', label: 'Rose', colors: ['#E11D48', '#DB2777'] },
  { id: 'amber', label: 'Amber', colors: ['#D97706', '#EA580C'] },
  { id: 'ocean', label: 'Ocean', colors: ['#0284C7', '#0891B2'] },
];

const defaultSettings = {
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
};

export default function Settings() {
  const { theme, toggleTheme, colorTheme, setColorTheme, fontFamily, setFontFamily, fontSize, setFontSize, showToast, setCurrency, apiKey, setApiKey, scanStats, exportAllData, importAllData, subscription, setSubscription, isSuperAdmin } = useApp();
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('arwa_settings')) || defaultSettings; } catch { return defaultSettings; }
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '');

  const set = (k, v) => {
    setSettings(s => ({ ...s, [k]: v }));
    if (k === 'currency') setCurrency(v);
  };

  const SECTIONS = [
    {
      icon: Building2, title: 'Business Information',
      items: [
        { key: 'companyName', label: 'Company Name', type: 'text' },
        { key: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+5:30', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12', 'UTC-1', 'UTC-2', 'UTC-3', 'UTC-4', 'UTC-5', 'UTC-6', 'UTC-7', 'UTC-8', 'UTC-9', 'UTC-10', 'UTC-11', 'UTC-12'] },
        { key: 'language', label: 'Language', type: 'select', options: [{ val: 'en', label: 'English' }, { val: 'ar', label: 'Arabic' }, { val: 'fr', label: 'French' }, { val: 'es', label: 'Spanish' }, { val: 'de', label: 'German' }, { val: 'zh', label: 'Chinese' }, { val: 'hi', label: 'Hindi' }, { val: 'pt', label: 'Portuguese' }] },
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
          <p>Configure Arwa 1.0 for your business</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          localStorage.setItem('arwa_settings', JSON.stringify(settings));
          setCurrency(settings.currency);
          showToast('Settings saved successfully');
        }}>
          <Save size={14} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Business Type & Module Manager */}
        {(() => {
          const ALL_MODULES = [
            { path: '/', label: 'Dashboard', icon: '🏠' },
            { path: '/pos', label: 'Point of Sale', icon: '🛒' },
            { path: '/inventory', label: 'Inventory', icon: '📦' },
            { path: '/cash-counter', label: 'Cash Counter', icon: '🏦' },
            { path: '/customers', label: 'Customers', icon: '👥' },
            { path: '/suppliers', label: 'Suppliers', icon: '🚚' },
            { path: '/online-orders', label: 'Online Orders', icon: '🌐' },
            { path: '/quotes', label: 'Quotes', icon: '📋' },
            { path: '/purchase-orders', label: 'Purchase Orders', icon: '📝' },
            { path: '/stock-transfers', label: 'Stock Transfers', icon: '↔️' },
            { path: '/backorders', label: 'Backorders', icon: '⏳' },
            { path: '/barcode', label: 'Barcode System', icon: '📊' },
            { path: '/lot-tracking', label: 'Lot & Serial Tracking', icon: '🔍' },
            { path: '/reports', label: 'Reports', icon: '📈' },
            { path: '/accounting', label: 'Accounting', icon: '💰' },
            { path: '/tax', label: 'Canadian Tax', icon: '🍁' },
            { path: '/payroll', label: 'Payroll / T4', icon: '💵' },
            { path: '/cra-audit', label: 'CRA Audit Export', icon: '🗂️' },
            { path: '/users', label: 'User Management', icon: '👤' },
            { path: '/ai-guardian', label: 'AI Guardian', icon: '🤖' },
            { path: '/subscription', label: 'Subscription', icon: '💳' },
            { path: '/settings', label: 'Settings', icon: '⚙️' },
          ];

          const bt = BUSINESS_TYPES[subscription?.businessType || 'platform_admin'];
          const baseEnabled = bt?.modules[0] === 'ALL'
            ? ALL_MODULES.map(m => m.path)
            : [...(bt?.modules || []), ...(subscription?.enabledModules || [])];
          const overrides = subscription?.moduleOverrides || {};

          const isModuleOn = (path) => {
            if (overrides[path] === true) return true;
            if (overrides[path] === false) return false;
            return baseEnabled.includes(path);
          };

          const toggleModule = (path) => {
            const current = isModuleOn(path);
            const newOverrides = { ...overrides, [path]: !current };
            setSubscription(prev => ({ ...prev, moduleOverrides: newOverrides }));
            showToast(`${ALL_MODULES.find(m => m.path === path)?.label} ${!current ? 'enabled' : 'disabled'}`, !current ? 'success' : 'info');
          };

          const resetToDefaults = () => {
            setSubscription(prev => ({ ...prev, moduleOverrides: {} }));
            showToast('Module access reset to business type defaults', 'success');
          };

          const enabledCount = ALL_MODULES.filter(m => isModuleOn(m.path)).length;
          const hasOverrides = Object.keys(overrides).length > 0;

          return (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">Business Type & Module Access</h3>
                  <p className="card-subtitle">Choose a preset then fine-tune individual modules with the toggles below</p>
                </div>
              </div>
              <div className="card-body">
                {/* Business type preset selector */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <label className="form-label">Business Type Preset</label>
                    {isSuperAdmin ? (
                      <select className="form-control"
                        value={subscription?.businessType || 'platform_admin'}
                        onChange={e => {
                          const newType = e.target.value;
                          setSubscription(prev => ({ ...prev, businessType: newType, enabledModules: [], moduleOverrides: {} }));
                          showToast(`Preset changed to ${BUSINESS_TYPES[newType]?.label} — toggles reset`, 'success');
                        }}>
                        {Object.entries(BUSINESS_TYPES).map(([key, bt]) => (
                          <option key={key} value={key}>{bt.emoji} {bt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(91,95,207,0.07)', border: '1px solid rgba(91,95,207,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Lock size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{BUSINESS_TYPES[subscription?.businessType]?.emoji} {BUSINESS_TYPES[subscription?.businessType]?.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Assigned by your platform administrator. Contact Arwa support to change.</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{enabledCount}</strong> / {ALL_MODULES.length} modules enabled
                    </span>
                    {hasOverrides && (
                      <button
                        onClick={resetToDefaults}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >
                        ↺ Reset to Defaults
                      </button>
                    )}
                  </div>
                </div>

                {/* Module toggle grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {ALL_MODULES.map(mod => {
                    const on = isModuleOn(mod.path);
                    const isOverridden = overrides[mod.path] !== undefined;
                    const isBase = baseEnabled.includes(mod.path);
                    return (
                      <div key={mod.path} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 10,
                        background: on ? 'rgba(79,70,229,0.07)' : 'var(--bg-tertiary)',
                        border: `1px solid ${on ? 'rgba(79,70,229,0.25)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{mod.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: on ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {mod.label}
                            </div>
                            {isOverridden && (
                              <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, marginTop: 1 }}>
                                {on && !isBase ? '★ Manually enabled' : !on && isBase ? '★ Manually disabled' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Toggle switch */}
                        <button
                          onClick={() => toggleModule(mod.path)}
                          title={on ? 'Click to disable' : 'Click to enable'}
                          style={{
                            width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                            background: on ? 'var(--primary)' : 'var(--bg-card)',
                            border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                            cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 2, left: on ? 22 : 2,
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, marginBottom: 0 }}>
                  Changes take effect immediately. Disabled modules show as locked (ADD-ON) in the sidebar and are blocked at the route level.
                  Use <strong>Reset to Defaults</strong> to restore the preset's original configuration.
                </p>
              </div>
            </div>
          );
        })()}

        {/* AI & API Configuration */}
        <div className="card" style={{ border: '1px solid rgba(79,70,229,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} style={{ color: 'var(--primary-light)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI & API Configuration</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Claude API — Haiku for monitoring · Sonnet for self-healing</p>
            </div>
            {apiKey && (
              <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                ● Live AI Active
              </span>
            )}
          </div>

          {/* API Key input row */}
          <SettingRow label="Claude API Key" desc="Your Anthropic API key — stored locally in your browser only">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="form-control"
                  style={{ width: 280, paddingRight: 36, fontFamily: 'monospace', fontSize: 12 }}
                  placeholder="sk-ant-api03-..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setApiKey(apiKeyInput);
                  showToast(apiKeyInput ? 'API key saved — live AI scans enabled' : 'API key cleared', apiKeyInput ? 'success' : 'info');
                }}
              >
                Save Key
              </button>
              {apiKey && (
                <button className="btn btn-danger btn-sm" onClick={() => { setApiKey(''); setApiKeyInput(''); showToast('API key removed', 'info'); }}>
                  Remove
                </button>
              )}
            </div>
          </SettingRow>

          {/* Security notice */}
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16, fontSize: 12, color: '#D97706' }}>
            ⚠️ <strong>Security note:</strong> Your API key is stored in browser localStorage and sent directly to Anthropic's API. For production, use a backend proxy server to keep the key server-side.
          </div>

          {/* Monthly usage stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Scans Today',     value: scanStats.scansToday   || 0, unit: '',  color: '#4F46E5' },
              { label: 'Monthly Scans',   value: scanStats.monthlyScans || 0, unit: '',  color: '#7C3AED' },
              { label: 'API Cost (mo)',    value: `$${(scanStats.monthlyCost || 0).toFixed(4)}`, unit: '', color: '#10B981' },
            ].map(s => (
              <div key={s.label} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}{s.unit}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Currency card — full world list */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} style={{ color: 'var(--primary-light)' }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Currency</h3>
          </div>
          <SettingRow label="Default Currency" desc="Base currency for all transactions and reports">
            <select
              className="form-control"
              style={{ width: 240 }}
              value={settings.currency}
              onChange={e => set('currency', e.target.value)}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Multi-Currency Display" desc="Show prices in multiple currencies simultaneously">
            <Toggle value={settings.multiCurrency} onChange={v => set('multiCurrency', v)} />
          </SettingRow>
        </div>

        {/* Appearance card — dark/light + 5 color themes */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palette size={16} style={{ color: 'var(--primary-light)' }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Appearance</h3>
          </div>
          <SettingRow label="Dark Mode" desc="Toggle between dark and light interface theme">
            <Toggle value={theme === 'dark'} onChange={toggleTheme} />
          </SettingRow>
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Color Theme</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Choose the accent color palette for the entire application</div>
            <div className="theme-swatches">
              {COLOR_THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-swatch${colorTheme === t.id ? ' active' : ''}`}
                  onClick={() => { setColorTheme(t.id); showToast(`Theme changed to ${t.label}`, 'info'); }}
                >
                  <div
                    className="swatch-circle"
                    style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}
                  />
                  <span className="swatch-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Font Family</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Interface font used throughout the application</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'IBM Plex Sans', 'System'].map(f => (
                <button key={f} onClick={() => { setFontFamily(f); showToast(`Font changed to ${f}`, 'info'); }} style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: f === 'System' ? 'system-ui' : `'${f}', sans-serif`,
                  fontWeight: fontFamily === f ? 700 : 500,
                  background: fontFamily === f ? 'var(--primary)' : 'var(--bg-tertiary)',
                  color: fontFamily === f ? '#fff' : 'var(--text-secondary)',
                  border: fontFamily === f ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div style={{ padding: '16px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Font Size</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Base text size — affects all UI elements proportionally</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Compact',     size: '12' },
                { label: 'Normal',      size: '14' },
                { label: 'Comfortable', size: '15' },
                { label: 'Large',       size: '16' },
              ].map(opt => (
                <button key={opt.size} onClick={() => { setFontSize(opt.size); showToast(`Font size set to ${opt.label}`, 'info'); }} style={{
                  padding: '8px 18px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  fontSize: parseInt(opt.size, 10),
                  fontWeight: fontSize === opt.size ? 700 : 500,
                  background: fontSize === opt.size ? 'var(--primary)' : 'var(--bg-tertiary)',
                  color: fontSize === opt.size ? '#fff' : 'var(--text-secondary)',
                  border: fontSize === opt.size ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}>
                  {opt.label}
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>{opt.size}px</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
            {section.title === 'Data & Backup' && (
              <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => exportAllData()}>
                  <Download size={14} style={{ marginRight: 6 }}/> Export Backup (.json)
                </button>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={14} style={{ marginRight: 6 }}/> Import Backup
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) importAllData(e.target.files[0]); }} />
                </label>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                  Backup saves all products, orders, customers, suppliers and settings to a .json file.
                  Import restores from a previous backup.
                </div>
              </div>
            )}
            {section.title === 'Hardware' && (
              <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Thermal Printer (USB/Serial)</div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Connect a USB thermal printer (Epson, Star, Bixolon) for auto-printing receipts. Requires Chrome or Edge browser.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Paper Width</label>
                    <select className="form-control" value={localStorage.getItem('arwa_printerPaperWidth') || '80mm'}
                      onChange={e => { localStorage.setItem('arwa_printerPaperWidth', e.target.value); showToast('Paper width saved', 'success'); }}>
                      <option value="80mm">80mm (standard)</option>
                      <option value="58mm">58mm (compact)</option>
                    </select>
                  </div>
                  <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
                    <button className="btn btn-secondary" onClick={async () => {
                      if (!('serial' in navigator)) { showToast('Web Serial not supported — use Chrome or Edge', 'error'); return; }
                      try {
                        const { connectSerialPrinter } = await import('../../services/thermalPrinter');
                        await connectSerialPrinter();
                        showToast('Thermal printer connected!', 'success');
                      } catch(e) { showToast(e.message, 'error'); }
                    }}>
                      <Printer size={14} style={{ marginRight: 6 }}/> Connect Printer
                    </button>
                  </div>
                  <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
                    <button className="btn btn-primary" onClick={async () => {
                      const { printViaBrowser } = await import('../../services/thermalPrinter');
                      printViaBrowser({
                        businessName: 'Arwa Enterprises',
                        receiptId: 'TEST-001',
                        date: new Date().toLocaleString(),
                        items: [{ name: 'Test Product', qty: 1, salePrice: 9.99 }],
                        subtotal: 9.99, taxAmt: 0.50, total: 10.49,
                        payments: [{ method: 'Cash', amount: 10.49 }],
                        sym: '$',
                      }, { paperWidth: localStorage.getItem('arwa_printerPaperWidth') || '80mm' });
                    }}>
                      Test Print
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  If USB serial is unavailable, receipts open in a printer-friendly browser window automatically.
                </p>
              </div>
            )}
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
            <button className="btn btn-danger btn-sm" onClick={() => { setShowDeleteModal(true); setDeleteInput(''); }}>
              Clear Data
            </button>
          </SettingRow>
          <SettingRow label="Reset to Factory Defaults" desc="Reset all settings to default values">
            <button className="btn btn-danger btn-sm" onClick={() => {
              setSettings(defaultSettings);
              localStorage.setItem('arwa_settings', '');
              showToast('Settings reset to defaults', 'info');
            }}>
              Reset Settings
            </button>
          </SettingRow>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#EF4444' }}>Clear All Data</h2>
              <button className="icon-btn" onClick={() => setShowDeleteModal(false)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              This will permanently delete all inventory, orders, and customer data. This action cannot be undone.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Type <strong style={{ color: 'var(--text-primary)' }}>DELETE</strong> to confirm:
            </p>
            <input
              className="form-control"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE here"
              style={{ marginBottom: 20, borderColor: deleteInput && deleteInput !== 'DELETE' ? 'var(--danger)' : undefined }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={deleteInput !== 'DELETE'}
                onClick={() => {
                  Object.keys(localStorage).filter(k => k.startsWith('arwa_')).forEach(k => localStorage.removeItem(k));
                  window.location.reload();
                }}
              >
                I understand, delete all data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
