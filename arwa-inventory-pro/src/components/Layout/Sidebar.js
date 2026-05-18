import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Bot,
  CreditCard, QrCode, Truck, Settings, ChevronLeft, ChevronRight, Shield, UtensilsCrossed
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const NAV_ITEMS = [
  { section: 'Main' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { path: '/online-orders', label: 'Online Orders', icon: UtensilsCrossed },
  { path: '/barcode', label: 'Barcode System', icon: QrCode },
  { section: 'Management' },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/users', label: 'User Management', icon: Users },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { section: 'AI & Platform' },
  { path: '/ai-guardian', label: 'AI Guardian', icon: Bot, badge: 'AI', aiFeature: true },
  { path: '/subscription', label: 'Subscription', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, currentUser, aiIssues } = useApp();

  const criticalIssues = aiIssues.filter(i => i.severity === 'critical' && i.status === 'pending').length;

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">A</div>
        <div className="logo-text">
          <h2>Arwa Inventory</h2>
          <p>Pro Edition</p>
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="icon-btn"
          style={{ marginLeft: 'auto', flexShrink: 0, border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>;
          }

          const Icon = item.icon;
          const isAI = item.path === '/ai-guardian';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" size={18} />
              <span className="nav-label">{item.label}</span>
              {isAI && criticalIssues > 0 && (
                <span className="nav-badge">{criticalIssues}</span>
              )}
              {item.aiFeature && !criticalIssues && (
                <span className="nav-ai-badge nav-label">AI</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {currentUser.name.charAt(0)}
          </div>
          <div className="user-info">
            <h4>{currentUser.name}</h4>
            <p style={{ textTransform: 'capitalize', color: 'var(--primary-light)', fontSize: '11px', fontWeight: 600 }}>
              <Shield size={10} style={{ display: 'inline', marginRight: 3 }} />
              {currentUser.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
