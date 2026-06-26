import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, X, AlertTriangle, Info, CheckCircle, LogOut, User, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/inventory': 'Inventory Management',
  '/pos': 'Point of Sale',
  '/barcode': 'Barcode System',
  '/suppliers': 'Supplier Management',
  '/users': 'User Management',
  '/reports': 'Reports & Analytics',
  '/ai-guardian': 'AI Dev Guardian',
  '/subscription': 'Subscription & Billing',
  '/settings': 'Settings',
  '/online-orders': 'Online Orders',
  '/customers': 'Customer Management',
  '/cash-counter': 'Cash Counter',
  '/tax': 'Canadian Tax',
  '/lot-tracking': 'Lot & Serial Tracking',
  '/purchase-orders': 'Purchase Orders',
  '/stock-transfers': 'Stock Transfers',
  '/backorders': 'Backorders',
  '/payroll': 'Payroll / T4',
  '/accounting': 'Accounting',
  '/cra-audit': 'CRA Audit Export',
  '/quotes': 'Quotes',
  '/sales-orders': 'Sales Orders',
  '/master': 'Master Control Panel',
};

const NotifIcon = ({ type }) => {
  const map = {
    warning: <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />,
    critical: <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />,
    info: <Info size={14} style={{ color: 'var(--info)' }} />,
    success: <CheckCircle size={14} style={{ color: 'var(--success)' }} />,
  };
  return map[type] || map.info;
};

export default function Header({ searchQuery, setSearchQuery }) {
  const { theme, toggleTheme, notifications, markNotificationRead, unreadCount, currentUser, logout } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const title = PAGE_TITLES[location.pathname] || 'Arwa 1.0';

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <span className="page-title">{title}</span>
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            placeholder="Search products, orders, customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '44px', right: 0, width: '340px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 1000,
              animation: 'slideUp 0.2s ease'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => notifications.forEach(n => markNotificationRead(n.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)', fontSize: 12, fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: n.read ? 'transparent' : 'rgba(79,70,229,0.04)',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(79,70,229,0.04)'}
                  >
                    <div style={{ marginTop: 2 }}><NotifIcon type={n.type} /></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.message}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{n.time}</p>
                    </div>
                    {!n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px',
              background: showUserMenu ? 'var(--bg-hover)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: 20,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentUser?.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{currentUser?.role}</div>
            </div>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute', top: '44px', right: 0, width: '220px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 1000,
              overflow: 'hidden', animation: 'slideUp 0.15s ease',
            }}>
              {/* User info header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{currentUser?.email}</div>
                <div style={{ fontSize: 10, color: 'var(--primary-light)', fontWeight: 600, textTransform: 'capitalize', marginTop: 4 }}>{currentUser?.role}</div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Settings size={14} /> Settings
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/users'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <User size={14} /> My Account
                </button>
                <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13, fontWeight: 600, textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
