import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PRODUCTS, USERS, ORDERS, NOTIFICATIONS, AI_METRICS, AI_ISSUES, REPAIR_HISTORY, SUPPLIERS, ONLINE_ORDERS, CUSTOMERS, STOCK_MOVEMENTS, SUBSCRIPTION_PLANS } from '../data/mockData';

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // UI / theming
  const [theme, setTheme] = useState(() => loadLS('arwa_theme', 'dark'));
  const [colorTheme, setColorTheme] = useState(() => loadLS('arwa_colorTheme', 'indigo'));
  const [currency, setCurrency] = useState(() => loadLS('arwa_currency', 'USD'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  // auth
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = loadLS('arwa_auth', null);
    return auth ? auth.isAuthenticated : false;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const auth = loadLS('arwa_auth', null);
    return auth ? auth.currentUser : null;
  });

  // data
  const [products, setProducts] = useState(() => loadLS('arwa_products', PRODUCTS));
  const [users, setUsers] = useState(() => loadLS('arwa_users', USERS));
  const [orders, setOrders] = useState(() => loadLS('arwa_orders', ORDERS));
  const [onlineOrders, setOnlineOrders] = useState(() => loadLS('arwa_onlineOrders', ONLINE_ORDERS));
  const [suppliers, setSuppliers] = useState(() => loadLS('arwa_suppliers', SUPPLIERS));
  const [customers, setCustomers] = useState(() => loadLS('arwa_customers', CUSTOMERS));
  const [stockMovements, setStockMovements] = useState(() => loadLS('arwa_stockMovements', STOCK_MOVEMENTS));
  const [notifications, setNotifications] = useState(() => loadLS('arwa_notifications', NOTIFICATIONS));
  const [repairHistory, setRepairHistory] = useState(REPAIR_HISTORY);

  // AI
  const [aiMetrics, setAiMetrics] = useState(AI_METRICS);
  const [aiIssues, setAiIssues] = useState(AI_ISSUES);

  // subscription
  const [subscription, setSubscription] = useState(() => loadLS('arwa_subscription', {
    plan: 'intermediate',
    selfHealing: false,
    billing: 'monthly',
    status: 'active',
    nextBilling: '2026-08-15',
    trialDaysLeft: 0,
  }));

  // persistence effects
  useEffect(() => localStorage.setItem('arwa_theme', JSON.stringify(theme)), [theme]);
  useEffect(() => localStorage.setItem('arwa_colorTheme', JSON.stringify(colorTheme)), [colorTheme]);
  useEffect(() => localStorage.setItem('arwa_currency', JSON.stringify(currency)), [currency]);
  useEffect(() => localStorage.setItem('arwa_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('arwa_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('arwa_orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('arwa_onlineOrders', JSON.stringify(onlineOrders)), [onlineOrders]);
  useEffect(() => localStorage.setItem('arwa_suppliers', JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem('arwa_customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('arwa_stockMovements', JSON.stringify(stockMovements)), [stockMovements]);
  useEffect(() => localStorage.setItem('arwa_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('arwa_subscription', JSON.stringify(subscription)), [subscription]);
  useEffect(() => {
    localStorage.setItem('arwa_auth', JSON.stringify({ isAuthenticated, currentUser }));
  }, [isAuthenticated, currentUser]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  // stock movement audit
  const addStockMovement = useCallback(({ productId, productName, type, qty, note }) => {
    setStockMovements(prev => [
      {
        id: Date.now(),
        productId,
        productName,
        type,
        qty,
        userId: currentUser ? currentUser.id : null,
        userName: currentUser ? currentUser.name : 'System',
        time: new Date().toISOString(),
        note: note || '',
      },
      ...prev,
    ]);
  }, [currentUser]);

  const addProduct = useCallback((product) => {
    const plan = SUBSCRIPTION_PLANS[subscription.plan];
    const limit = plan ? plan.products : -1;
    if (limit !== -1 && products.length >= limit) {
      showToast(
        `Product limit reached for your ${plan.name} plan (${limit} products). Upgrade to add more.`,
        'warning'
      );
      return;
    }
    const newProduct = { ...product, id: Date.now(), status: product.status || 'active' };
    setProducts(prev => [newProduct, ...prev]);
    showToast(`Product "${product.name}" added successfully`);
  }, [products, subscription, showToast]);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const merged = { ...p, ...updates };
      if (updates.stock !== undefined && updates.stock !== p.stock) {
        const delta = updates.stock - p.stock;
        addStockMovement({
          productId: id,
          productName: p.name,
          type: 'adjustment',
          qty: delta,
          note: updates._movementNote || 'Product updated',
        });
      }
      const { _movementNote, ...clean } = merged;
      return clean;
    }));
    showToast('Product updated successfully');
  }, [showToast, addStockMovement]);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => {
      const product = prev.find(p => p.id === id);
      if (product && product.stock > 0) {
        addStockMovement({
          productId: id,
          productName: product.name,
          type: 'adjustment',
          qty: -product.stock,
          note: 'Product deleted from system',
        });
      }
      return prev.filter(p => p.id !== id);
    });
    showToast('Product deleted', 'info');
  }, [showToast, addStockMovement]);

  const addSupplier = useCallback((s) => {
    setSuppliers(prev => [{ ...s, id: Date.now() }, ...prev]);
    showToast(`Supplier "${s.name}" added successfully`);
  }, [showToast]);

  const updateSupplier = useCallback((id, updates) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Supplier updated successfully');
  }, [showToast]);

  const updateOnlineOrderStatus = useCallback((id, newStatus) => {
    setOnlineOrders(prev => prev.map(o => (o.id === id ? { ...o, status: newStatus } : o)));
  }, []);

  const addOnlineOrder = useCallback((order) => {
    setOnlineOrders(prev => [{ ...order, id: order.id || `OO-${Date.now()}` }, ...prev]);
  }, []);

  const addOrder = useCallback((order) => {
    const newOrder = {
      ...order,
      id: order.id || `ORD-${Date.now()}`,
      date: order.date || new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  const addCustomer = useCallback((c) => {
    setCustomers(prev => [{ ...c, id: Date.now() }, ...prev]);
    showToast(`Customer "${c.name}" added successfully`);
  }, [showToast]);

  const updateCustomer = useCallback((id, updates) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Customer updated successfully');
  }, [showToast]);

  const deleteCustomer = useCallback((id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Customer removed', 'info');
  }, [showToast]);

  const addUser = useCallback((u) => {
    const plan = SUBSCRIPTION_PLANS[subscription.plan];
    const limit = plan ? plan.users : -1;
    if (limit !== -1 && users.length >= limit) {
      showToast(
        `User limit reached for your ${plan.name} plan (${limit} accounts). Upgrade to add more.`,
        'warning'
      );
      return;
    }
    setUsers(prev => [...prev, { ...u, id: Date.now() }]);
    showToast(`User "${u.name}" added successfully`);
  }, [users, subscription, showToast]);

  const deleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('User removed', 'info');
  }, [showToast]);

  const addRepair = useCallback((repair) => {
    setRepairHistory(prev => [{ ...repair, id: Date.now(), time: new Date().toISOString() }, ...prev]);
  }, []);

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

  const login = useCallback((email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('arwa_auth');
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const value = useMemo(() => ({
    // UI
    theme, toggleTheme,
    colorTheme, setColorTheme,
    currency, setCurrency,
    sidebarCollapsed, setSidebarCollapsed,
    toast, showToast,
    // Auth
    isAuthenticated, currentUser, login, logout,
    // Products
    products, setProducts, addProduct, updateProduct, deleteProduct,
    // Suppliers
    suppliers, setSuppliers, addSupplier, updateSupplier,
    // Customers
    customers, setCustomers, addCustomer, updateCustomer, deleteCustomer,
    // Users
    users, setUsers, addUser, deleteUser,
    // Orders
    orders, setOrders, addOrder,
    // Online Orders
    onlineOrders, setOnlineOrders, updateOnlineOrderStatus, addOnlineOrder,
    // Notifications
    notifications, markNotificationRead, unreadCount,
    // AI
    aiMetrics, setAiMetrics,
    aiIssues, setAiIssues,
    repairHistory, addRepair,
    resolveIssue, runAIScan,
    // Stock movements
    stockMovements, addStockMovement,
    // Subscription
    subscription, setSubscription,
  }), [
    theme, toggleTheme, colorTheme, currency, sidebarCollapsed, toast, showToast,
    isAuthenticated, currentUser, login, logout,
    products, addProduct, updateProduct, deleteProduct,
    suppliers, addSupplier, updateSupplier,
    customers, addCustomer, updateCustomer, deleteCustomer,
    users, addUser, deleteUser,
    orders, addOrder,
    onlineOrders, updateOnlineOrderStatus, addOnlineOrder,
    notifications, markNotificationRead, unreadCount,
    aiMetrics, aiIssues, repairHistory, addRepair,
    resolveIssue, runAIScan,
    stockMovements, addStockMovement,
    subscription,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
