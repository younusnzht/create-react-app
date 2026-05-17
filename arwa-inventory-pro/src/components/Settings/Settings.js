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

export default function Settings() {
  const { theme, toggleTheme, colorTheme, setColorTheme, showToast } = useApp();
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
          <p>Configure Arwa Inventory Pro for your business</p>
        </div>
        <button className="btn btn-primary" onClick={() => showToast('Settings saved successfully')}>
          <Save size={14} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
          <div style={{ padding: '16px 0' }}>
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
