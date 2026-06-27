import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Bot,
  CreditCard, QrCode, Truck, Settings, ChevronLeft, ChevronRight, Shield, UtensilsCrossed, Users2, Receipt, Hash, ArrowRight, AlertTriangle, DollarSign, BookOpen, FileText, Landmark, Crown, LogOut, ClipboardList, Zap, Sparkles
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const NAV_ITEMS = [
  { section: 'Main' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/pos', label: 'Point of Sale', icon: ShoppingCart },
  { path: '/cash-counter', label: 'Cash Counter', icon: Landmark },
  { path: '/online-orders', label: 'Online Orders', icon: UtensilsCrossed },
  { path: '/barcode', label: 'Barcode System', icon: QrCode },
  { section: 'Management' },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/customers', label: 'Customers', icon: Users2 },
  { path: '/quotes',        label: 'Quotes',        icon: FileText },
  { path: '/sales-orders', label: 'Sales Orders',  icon: ClipboardList },
  { path: '/users', label: 'User Management', icon: Users },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/tax', label: 'Canadian Tax', icon: Receipt },
  { path: '/lot-tracking', label: 'Lot & Serial', icon: Hash },
  { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { path: '/stock-transfers', label: 'Stock Transfers', icon: ArrowRight },
  { path: '/backorders',      label: 'Backorders',      icon: AlertTriangle },
  { path: '/payroll',         label: 'Payroll / T4',    icon: DollarSign },
  { path: '/accounting',      label: 'Accounting',      icon: BookOpen },
  { path: '/cra-audit',       label: 'CRA Audit Export', icon: Shield },
  { section: 'AI Intelligence' },
  { path: '/ai-guardian', label: 'AI Guardian', icon: Bot, badge: 'AI', aiFeature: true },
  { path: '/workflow-automation', label: 'Workflow Automation', icon: Zap },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { section: 'Account & Admin' },
  { path: '/subscription', label: 'Subscription', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, currentUser, aiIssues, onlineOrders, getEnabledModules, isSuperAdmin, logout } = useApp();

  const criticalIssues = aiIssues.filter(i => i.severity === 'critical' && i.status === 'pending').length;
  const newOrderCount = onlineOrders?.filter(o => o.status === 'new').length || 0;

  const enabledModules = getEnabledModules();
  const isStaffUser = currentUser && !['admin', 'client', 'superadmin'].includes(currentUser.role);

  const isModuleEnabled = (path) => {
    if (!enabledModules) {
      if (isStaffUser && currentUser.allowedModules) return currentUser.allowedModules.includes(path);
      return true;
    }
    if (!enabledModules.includes(path)) return false;
    if (isStaffUser && currentUser.allowedModules) return currentUser.allowedModules.includes(path);
    return true;
  };

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        {/* Logo icon — hidden when collapsed to give the toggle button room */}
        <div className="logo-icon" style={{ flexShrink: 0, transition: 'opacity 0.2s, width 0.2s', opacity: sidebarCollapsed ? 0 : 1, width: sidebarCollapsed ? 0 : 32, overflow: 'hidden' }}>A</div>
        <div className="logo-text">
          <h2>Arwa 1.0</h2>
          <p>Enterprise Platform</p>
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            marginLeft: 'auto', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.06)', color: 'var(--sidebar-text)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, width: 28, height: 28, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {isSuperAdmin && (
          <NavLink
            to="/master"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ background: 'rgba(91,95,207,0.12)', borderLeft: '2px solid rgba(91,95,207,0.4)', margin: '0 4px 8px' }}
          >
            <Crown className="nav-icon" size={18} style={{ color: '#F59E0B' }} />
            <span className="nav-label" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Master Control</span>
          </NavLink>
        )}
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>;
          }

          const Icon = item.icon;
          const isAI = item.path === '/ai-guardian';
          const enabled = isModuleEnabled(item.path);
          if (!enabled) return null;

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
              {item.path === '/online-orders' && newOrderCount > 0 && (
                <span className="nav-badge">{newOrderCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar" style={{ flexShrink: 0 }}>
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
        <button
          onClick={logout}
          className="nav-item"
          title="Sign out"
          style={{ width: '100%', marginTop: 4, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        >
          <LogOut className="nav-icon" size={16} style={{ color: '#EF4444' }} />
          <span className="nav-label" style={{ color: '#EF4444', fontWeight: 600 }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
