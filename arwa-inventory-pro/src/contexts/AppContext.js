import React, { createContext, useContext, useState, useCallback } from 'react';
import { PRODUCTS, USERS, ORDERS, NOTIFICATIONS, AI_METRICS, AI_ISSUES, REPAIR_HISTORY } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [colorTheme, setColorTheme] = useState('indigo');
  const [products, setProducts] = useState(PRODUCTS);
  const [users, setUsers] = useState(USERS);
  const [orders, setOrders] = useState(ORDERS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [aiMetrics, setAiMetrics] = useState(AI_METRICS);
  const [aiIssues, setAiIssues] = useState(AI_ISSUES);
  const [repairHistory] = useState(REPAIR_HISTORY);
  const [currentUser] = useState(USERS[0]);
  const [subscription, setSubscription] = useState({
    plan: 'intermediate',
    selfHealing: false,
    billing: 'monthly',
    status: 'active',
    nextBilling: '2024-08-15',
    trialDaysLeft: 0,
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const addProduct = useCallback((product) => {
    const newProduct = { ...product, id: Date.now(), status: 'active' };
    setProducts(prev => [newProduct, ...prev]);
    showToast(`Product "${product.name}" added successfully`);
  }, [showToast]);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    showToast('Product updated successfully');
  }, [showToast]);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted', 'info');
  }, [showToast]);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const resolveIssue = useCallback((id) => {
    setAiIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
    showToast('Issue marked as resolved');
  }, [showToast]);

  const runAIScan = useCallback(() => {
    setAiMetrics(prev => ({ ...prev, scansToday: prev.scansToday + 1 }));
    showToast('AI scan initiated — analyzing system...', 'info');
  }, [showToast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      theme, toggleTheme, colorTheme, setColorTheme,
      products, setProducts, addProduct, updateProduct, deleteProduct,
      users, setUsers,
      orders, setOrders,
      notifications, markNotificationRead, unreadCount,
      aiMetrics, aiIssues, repairHistory,
      resolveIssue, runAIScan,
      currentUser,
      subscription, setSubscription,
      sidebarCollapsed, setSidebarCollapsed,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
