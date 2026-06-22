import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Toast from './components/Layout/Toast';
import Dashboard from './components/Dashboard/Dashboard';
import Inventory from './components/Inventory/Inventory';
import POS from './components/POS/POS';
import BarcodeSystem from './components/Barcode/BarcodeSystem';
import UserManagement from './components/Users/UserManagement';
import Reports from './components/Reports/Reports';
import AIGuardian from './components/AIGuardian/AIGuardian';
import Subscription from './components/Subscription/Subscription';
import Suppliers from './components/Suppliers/Suppliers';
import Settings from './components/Settings/Settings';
import OnlineOrders from './components/OnlineOrders/OnlineOrders';
import Login from './components/Auth/Login';
import OnboardingWizard from './components/Onboarding/OnboardingWizard';
import CanadianTax from './components/Tax/CanadianTax';
import LotTracker from './components/Inventory/LotTracker';
import PurchaseOrders from './components/Purchasing/PurchaseOrders';
import StockTransfer from './components/Inventory/StockTransfer';
import Backorders from './components/Inventory/Backorders';
import ErrorBoundary from './components/ErrorBoundary';
import CustomerManagement from './components/Customers/CustomerManagement';
import Payroll from './components/Payroll/Payroll';
import CRAAuditExport from './components/Regulatory/CRAAuditExport';
import Accounting from './components/Accounting/Accounting';
import Quotes from './components/Quotes/Quotes';
import CashCounter from './components/CashCounter/CashCounter';
import ModuleGuard from './components/Layout/ModuleGuard';

function AppLayout() {
  const { theme, colorTheme, isAuthenticated, onboarded } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div data-theme={theme} data-color-theme={colorTheme} className="app-layout">
      {!onboarded && <OnboardingWizard />}
      <Sidebar />
      <div className="main-content">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<ModuleGuard path="/inventory"><Inventory /></ModuleGuard>} />
            <Route path="/pos" element={<ModuleGuard path="/pos"><POS /></ModuleGuard>} />
            <Route path="/barcode" element={<ModuleGuard path="/barcode"><BarcodeSystem /></ModuleGuard>} />
            <Route path="/users" element={<ModuleGuard path="/users"><UserManagement /></ModuleGuard>} />
            <Route path="/reports" element={<ModuleGuard path="/reports"><Reports /></ModuleGuard>} />
            <Route path="/ai-guardian" element={<AIGuardian />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/suppliers" element={<ModuleGuard path="/suppliers"><Suppliers /></ModuleGuard>} />
            <Route path="/online-orders" element={<ModuleGuard path="/online-orders"><OnlineOrders /></ModuleGuard>} />
            <Route path="/customers" element={<ModuleGuard path="/customers"><CustomerManagement /></ModuleGuard>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tax" element={<ModuleGuard path="/tax"><CanadianTax /></ModuleGuard>} />
            <Route path="/lot-tracking" element={<ModuleGuard path="/lot-tracking"><LotTracker /></ModuleGuard>} />
            <Route path="/purchase-orders" element={<ModuleGuard path="/purchase-orders"><PurchaseOrders /></ModuleGuard>} />
            <Route path="/stock-transfers" element={<ModuleGuard path="/stock-transfers"><StockTransfer /></ModuleGuard>} />
            <Route path="/backorders" element={<ModuleGuard path="/backorders"><Backorders /></ModuleGuard>} />
            <Route path="/payroll" element={<ModuleGuard path="/payroll"><Payroll /></ModuleGuard>} />
            <Route path="/cra-audit" element={<ModuleGuard path="/cra-audit"><CRAAuditExport /></ModuleGuard>} />
            <Route path="/accounting" element={<ModuleGuard path="/accounting"><Accounting /></ModuleGuard>} />
            <Route path="/quotes" element={<ModuleGuard path="/quotes"><Quotes /></ModuleGuard>} />
            <Route path="/cash-counter" element={<ModuleGuard path="/cash-counter"><CashCounter /></ModuleGuard>} />
          </Routes>
        </div>
      </div>
      <Toast />
    </div>
  );
}

function AppRouter() {
  const { theme, colorTheme } = useApp();

  return (
    <div data-theme={theme} data-color-theme={colorTheme} style={{ minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ErrorBoundary>
            <AppLayout />
          </ErrorBoundary>
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
}
