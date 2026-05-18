import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useLocation } from 'react-router-dom';

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
  const { theme, toggleTheme, notifications, markNotificationRead, unreadCount } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const location = useLocation();
  const notifRef = useRef(null);

  const title = PAGE_TITLES[location.pathname] || 'Arwa Inventory Pro';

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setShowNotifs(!showNotifs)}>
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
      </div>
    </header>
  );
}
