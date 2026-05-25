import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PRODUCTS, USERS, ORDERS, NOTIFICATIONS, AI_METRICS, AI_ISSUES, REPAIR_HISTORY, SUPPLIERS, ONLINE_ORDERS, CUSTOMERS, STOCK_MOVEMENTS, SUBSCRIPTION_PLANS } from '../data/mockData';
import { PLAN_DAILY_LIMITS, OVERAGE_COST_PER_SCAN } from '../services/claudeAI';
import wsClient from '../services/websocket';

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_SCAN_STATS = {
  date: '',
  scansToday: 0,
  overageToday: 0,
  monthKey: '',
  monthlyScans: 0,
  monthlyCost: 0,
  overageCharges: 0,
  lastScanResult: null,
  lastScanTime: null,
};

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
  const [users, setUsers] = useState(() => {
    // Merge stored users with mock USERS so password field is always present
    // (old localStorage entries may have been saved before passwords were added)
    const stored = loadLS('arwa_users', USERS);
    return stored.map(u => {
      if (u.password) return u;
      const mock = USERS.find(m => m.id === u.id || m.email === u.email);
      return mock ? { ...u, password: mock.password } : u;
    });
  });
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

  // AI API config + usage tracking
  const [apiKey, setApiKeyState] = useState(() => loadLS('arwa_apiKey', ''));
  const [scanStats, setScanStats] = useState(() => {
    const stored = loadLS('arwa_scanStats', DEFAULT_SCAN_STATS);
    // Reset stale daily counts on load
    const today = new Date().toDateString();
    const monthKey = new Date().toISOString().slice(0, 7);
    let s = { ...stored };
    if (s.date !== today) { s = { ...s, date: today, scansToday: 0, overageToday: 0 }; }
    if (s.monthKey !== monthKey) { s = { ...s, monthKey, monthlyScans: 0, monthlyCost: 0, overageCharges: 0 }; }
    return s;
  });

  // ─── WebSocket connection status ──────────────────────────────────────────
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected|connecting|connected

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
  useEffect(() => localStorage.setItem('arwa_theme',         JSON.stringify(theme)),         [theme]);
  useEffect(() => localStorage.setItem('arwa_colorTheme',    JSON.stringify(colorTheme)),    [colorTheme]);
  useEffect(() => localStorage.setItem('arwa_currency',      JSON.stringify(currency)),      [currency]);
  useEffect(() => localStorage.setItem('arwa_products',      JSON.stringify(products)),      [products]);
  useEffect(() => localStorage.setItem('arwa_users',         JSON.stringify(users)),         [users]);
  useEffect(() => localStorage.setItem('arwa_orders',        JSON.stringify(orders)),        [orders]);
  useEffect(() => localStorage.setItem('arwa_onlineOrders',  JSON.stringify(onlineOrders)),  [onlineOrders]);
  useEffect(() => localStorage.setItem('arwa_suppliers',     JSON.stringify(suppliers)),     [suppliers]);
  useEffect(() => localStorage.setItem('arwa_customers',     JSON.stringify(customers)),     [customers]);
  useEffect(() => localStorage.setItem('arwa_stockMovements',JSON.stringify(stockMovements)),[stockMovements]);
  useEffect(() => localStorage.setItem('arwa_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('arwa_subscription',  JSON.stringify(subscription)),  [subscription]);
  useEffect(() => localStorage.setItem('arwa_scanStats',     JSON.stringify(scanStats)),     [scanStats]);

  // ─── WebSocket — connect on mount, handle live order events ──────────────
  useEffect(() => {
    // Register status change callback
    wsClient.onStatusChange = (s) => setWsStatus(s);

    // Snapshot: server sends full order list on connect
    const offSnapshot = wsClient.on('snapshot', ({ orders: serverOrders }) => {
      if (serverOrders && serverOrders.length > 0) {
        setOnlineOrders(prev => {
          // Merge: server orders take precedence, keep any local-only orders
          const serverIds = new Set(serverOrders.map(o => String(o.id)));
          const localOnly = prev.filter(o => !serverIds.has(String(o.id)));
          return [...serverOrders, ...localOnly];
        });
      }
    });

    // New order arriving from platform
    const offNew = wsClient.on('new_order', (order) => {
      setOnlineOrders(prev => {
        if (prev.find(o => String(o.id) === String(order.id))) return prev;
        return [order, ...prev];
      });
      // Auto-deduct inventory for confirmed items
      setProducts(prev => prev.map(product => {
        const ordered = (order.items || []).find(i =>
          product.name.toLowerCase().includes(i.name.toLowerCase()) ||
          i.name.toLowerCase().includes(product.name.toLowerCase())
        );
        if (!ordered) return product;
        const newStock = Math.max(0, (product.stock || 0) - ordered.qty);
        return { ...product, stock: newStock };
      }));
    });

    // Order status updated (from platform or another client)
    const offUpdated = wsClient.on('order_updated', (order) => {
      setOnlineOrders(prev =>
        prev.map(o => String(o.id) === String(order.id) ? { ...o, ...order } : o)
      );
    });

    // Order deleted
    const offDeleted = wsClient.on('order_deleted', ({ id }) => {
      setOnlineOrders(prev => prev.filter(o => String(o.id) !== String(id)));
    });

    // Attempt connection (will silently retry if backend isn't running)
    wsClient.connect();

    return () => {
      offSnapshot(); offNew(); offUpdated(); offDeleted();
      wsClient.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => localStorage.setItem('arwa_apiKey',        JSON.stringify(apiKey)),        [apiKey]);
  useEffect(() => {
    localStorage.setItem('arwa_auth', JSON.stringify({ isAuthenticated, currentUser }));
  }, [isAuthenticated, currentUser]);

  // ─── helpers ──────────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const setApiKey = useCallback((key) => {
    setApiKeyState(key.trim());
  }, []);

  // ─── stock movement audit ──────────────────────────────────────────────────

  const addStockMovement = useCallback(({ productId, productName, type, qty, note }) => {
    setStockMovements(prev => [{
      id: Date.now(), productId, productName, type, qty,
      userId:   currentUser ? currentUser.id   : null,
      userName: currentUser ? currentUser.name : 'System',
      time: new Date().toISOString(),
      note: note || '',
    }, ...prev]);
  }, [currentUser]);

  // ─── products ─────────────────────────────────────────────────────────────

  const addProduct = useCallback((product) => {
    const plan  = SUBSCRIPTION_PLANS[subscription.plan];
    const limit = plan ? plan.products : -1;
    if (limit !== -1 && products.length >= limit) {
      showToast(`Product limit reached for your ${plan.name} plan (${limit} products). Upgrade to add more.`, 'warning');
      return;
    }
    setProducts(prev => [{ ...product, id: Date.now(), status: product.status || 'active' }, ...prev]);
    showToast(`Product "${product.name}" added successfully`);
  }, [products, subscription, showToast]);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const merged = { ...p, ...updates };
      if (updates.stock !== undefined && updates.stock !== p.stock) {
        addStockMovement({
          productId: id, productName: p.name,
          type: 'adjustment', qty: updates.stock - p.stock,
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
        addStockMovement({ productId: id, productName: product.name, type: 'adjustment', qty: -product.stock, note: 'Product deleted from system' });
      }
      return prev.filter(p => p.id !== id);
    });
    showToast('Product deleted', 'info');
  }, [showToast, addStockMovement]);

  // ─── suppliers / customers / users ────────────────────────────────────────

  const addSupplier    = useCallback((s) => { setSuppliers(prev => [{ ...s, id: Date.now() }, ...prev]); showToast(`Supplier "${s.name}" added successfully`); }, [showToast]);
  const updateSupplier = useCallback((id, u) => { setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)); showToast('Supplier updated successfully'); }, [showToast]);
  const addCustomer    = useCallback((c) => { setCustomers(prev => [{ ...c, id: Date.now() }, ...prev]); showToast(`Customer "${c.name}" added successfully`); }, [showToast]);
  const updateCustomer = useCallback((id, u) => { setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...u } : c)); showToast('Customer updated successfully'); }, [showToast]);
  const deleteCustomer = useCallback((id) => { setCustomers(prev => prev.filter(c => c.id !== id)); showToast('Customer removed', 'info'); }, [showToast]);

  const addUser = useCallback((u) => {
    const plan  = SUBSCRIPTION_PLANS[subscription.plan];
    const limit = plan ? plan.users : -1;
    if (limit !== -1 && users.length >= limit) {
      showToast(`User limit reached for your ${plan.name} plan (${limit} accounts). Upgrade to add more.`, 'warning');
      return;
    }
    setUsers(prev => [...prev, { ...u, id: Date.now() }]);
    showToast(`User "${u.name}" added successfully`);
  }, [users, subscription, showToast]);

  const deleteUser = useCallback((id) => { setUsers(prev => prev.filter(u => u.id !== id)); showToast('User removed', 'info'); }, [showToast]);

  // ─── orders ───────────────────────────────────────────────────────────────

  const addOrder            = useCallback((o) => { setOrders(prev => [{ ...o, id: o.id || `ORD-${Date.now()}`, date: o.date || new Date().toISOString() }, ...prev]); }, []);
  const addOnlineOrder      = useCallback((o) => { setOnlineOrders(prev => [{ ...o, id: o.id || `OO-${Date.now()}` }, ...prev]); }, []);
  const updateOnlineOrderStatus = useCallback((id, status) => { setOnlineOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); }, []);

  // ─── notifications / repairs ──────────────────────────────────────────────

  const markNotificationRead = useCallback((id) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); }, []);
  const addRepair = useCallback((r) => { setRepairHistory(prev => [{ ...r, id: Date.now(), time: new Date().toISOString() }, ...prev]); }, []);

  // ─── scan stats helpers ───────────────────────────────────────────────────

  const getFreshStats = useCallback((prev) => {
    const today    = new Date().toDateString();
    const monthKey = new Date().toISOString().slice(0, 7);
    let s = { ...prev };
    if (s.date     !== today)    { s = { ...s, date: today, scansToday: 0, overageToday: 0 }; }
    if (s.monthKey !== monthKey) { s = { ...s, monthKey, monthlyScans: 0, monthlyCost: 0, overageCharges: 0 }; }
    return s;
  }, []);

  // ─── AI scan (Haiku + prompt caching) ─────────────────────────────────────

  const runAIScan = useCallback(async () => {
    const limit    = PLAN_DAILY_LIMITS[subscription.plan] || 10;
    const freshStats = getFreshStats(scanStats);
    const isOverage  = freshStats.scansToday >= limit;

    // Block non-Enterprise plans at the limit
    if (isOverage && subscription.plan !== 'super') {
      showToast(`Daily scan limit reached (${limit}/day on your plan). Upgrade for more.`, 'warning');
      return;
    }

    // Increment the mock counter immediately so UI updates
    setAiMetrics(prev => ({ ...prev, scansToday: prev.scansToday + 1 }));

    if (!apiKey) {
      // Demo mode — update counts with no real API cost
      setScanStats(prev => {
        const s = getFreshStats(prev);
        return { ...s, scansToday: s.scansToday + 1, monthlyScans: s.monthlyScans + 1, lastScanTime: new Date().toISOString() };
      });
      showToast('Scan complete (demo) — add Claude API key in Settings for live AI', 'info');
      return;
    }

    showToast('AI scan started — Claude Haiku analysing...', 'info');

    try {
      const { runAIScan: callScan } = await import('./claudeAIHelper');
      const { result, cost } = await callScan({ apiKey, metrics: aiMetrics, products, issues: aiIssues });

      // Apply real health scores
      setAiMetrics(prev => ({
        ...prev,
        healthScore:      result.healthScore      ?? prev.healthScore,
        performanceScore: result.performanceScore ?? prev.performanceScore,
        securityScore:    result.securityScore    ?? prev.securityScore,
        stabilityScore:   result.stabilityScore   ?? prev.stabilityScore,
        scansToday:       prev.scansToday + 1,
        issuesDetected:   prev.issuesDetected + (result.issues?.length || 0),
      }));

      // Merge new AI-detected issues (prepend, keep resolved old ones)
      if (result.issues?.length) {
        setAiIssues(prev => [
          ...result.issues.map((iss, i) => ({
            ...iss,
            id:       Date.now() + i,
            detected: new Date().toISOString(),
            status:   'pending',
          })),
          ...prev.filter(i => i.status === 'resolved'),
        ]);
      }

      // Track cost + overage
      const overageFee = isOverage ? OVERAGE_COST_PER_SCAN : 0;
      setScanStats(prev => {
        const s = getFreshStats(prev);
        return {
          ...s,
          scansToday:      s.scansToday + 1,
          overageToday:    isOverage ? s.overageToday + 1 : s.overageToday,
          monthlyScans:    s.monthlyScans + 1,
          monthlyCost:     parseFloat((s.monthlyCost + cost).toFixed(6)),
          overageCharges:  parseFloat((s.overageCharges + overageFee).toFixed(4)),
          lastScanResult:  result.summary || 'Scan complete',
          lastScanTime:    new Date().toISOString(),
        };
      });

      showToast(`AI scan complete — Health: ${result.healthScore ?? '?'}/100`, 'success');
    } catch (err) {
      showToast(`AI scan failed: ${err.message}`, 'error');
    }
  }, [subscription, scanStats, apiKey, aiMetrics, products, aiIssues, showToast, getFreshStats]);

  // ─── AI self-healing (Sonnet) ─────────────────────────────────────────────

  const resolveIssue = useCallback(async (id) => {
    const issue = aiIssues.find(i => i.id === id);

    if (apiKey && subscription.selfHealing && issue?.autoFixable) {
      showToast('Self-Healing: Claude Sonnet analysing...', 'info');
      try {
        const { runSelfHeal } = await import('./claudeAIHelper');
        const systemContext = {
          plan:         subscription.plan,
          metrics:      aiMetrics,
          productCount: products.length,
          userCount:    users.length,
        };
        const { result, cost } = await runSelfHeal({ apiKey, issue, systemContext });

        addRepair({
          action:      result.repairSteps?.[0]?.action || `Auto-fixed: ${issue.title}`,
          module:      issue.module,
          result:      result.confidence > 65 ? 'success' : 'rolled_back',
          improvement: result.estimatedImpact || 'Issue resolved',
        });

        setScanStats(prev => ({
          ...prev,
          monthlyCost: parseFloat((prev.monthlyCost + cost).toFixed(6)),
        }));

        setAiIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
        setAiMetrics(prev => ({ ...prev, issuesResolved: prev.issuesResolved + 1 }));
        showToast(`Self-Healing complete — ${result.estimatedImpact || 'Issue resolved'}`, 'success');
      } catch (err) {
        showToast(`Self-Healing error: ${err.message}`, 'error');
      }
    } else {
      setAiIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
      showToast('Issue marked as resolved');
    }
  }, [aiIssues, apiKey, subscription, aiMetrics, products, users, addRepair, showToast]);

  // ─── auth ─────────────────────────────────────────────────────────────────

  const login = useCallback((email, password) => {
    // Check live users state first; fall back to mock USERS so demo credentials
    // always work even if localStorage data is missing the password field.
    const found = users.find(u => u.email === email && u.password === password)
      || USERS.find(u => u.email === email && u.password === password);
    if (found) { setCurrentUser(found); setIsAuthenticated(true); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('arwa_auth');
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // ─── context value ────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    theme, toggleTheme, colorTheme, setColorTheme,
    currency, setCurrency,
    sidebarCollapsed, setSidebarCollapsed,
    toast, showToast,
    isAuthenticated, currentUser, login, logout,
    products, setProducts, addProduct, updateProduct, deleteProduct,
    suppliers, setSuppliers, addSupplier, updateSupplier,
    customers, setCustomers, addCustomer, updateCustomer, deleteCustomer,
    users, setUsers, addUser, deleteUser,
    orders, setOrders, addOrder,
    onlineOrders, setOnlineOrders, updateOnlineOrderStatus, addOnlineOrder,
    notifications, markNotificationRead, unreadCount,
    aiMetrics, setAiMetrics,
    aiIssues, setAiIssues,
    repairHistory, addRepair,
    resolveIssue, runAIScan,
    stockMovements, addStockMovement,
    subscription, setSubscription,
    apiKey, setApiKey,
    scanStats,
    wsStatus, wsClient,
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
    apiKey, setApiKey, scanStats, wsStatus,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
