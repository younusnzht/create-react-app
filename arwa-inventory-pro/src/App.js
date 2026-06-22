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
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/barcode" element={<BarcodeSystem />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-guardian" element={<AIGuardian />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/online-orders" element={<OnlineOrders />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tax" element={<CanadianTax />} />
            <Route path="/lot-tracking" element={<LotTracker />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/stock-transfers" element={<StockTransfer />} />
            <Route path="/backorders" element={<Backorders />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/cra-audit" element={<CRAAuditExport />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/cash-counter" element={<CashCounter />} />
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
