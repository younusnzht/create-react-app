import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PRODUCTS, USERS, ORDERS, NOTIFICATIONS, AI_METRICS, AI_ISSUES, REPAIR_HISTORY, SUPPLIERS, ONLINE_ORDERS, CUSTOMERS, STOCK_MOVEMENTS, SUBSCRIPTION_PLANS, BUSINESS_TYPES } from '../data/mockData';
import { PLAN_DAILY_LIMITS, OVERAGE_COST_PER_SCAN } from '../services/claudeAI';
import { calcTax } from '../services/taxEngine';
import wsClient from '../services/websocket';
import { dbSet, dbGet } from '../services/db';

export const SUPER_ADMIN_EMAIL = 'pharmacist_younus@yahoo.com';

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
  const [fontFamily, setFontFamily] = useState(() => loadLS('arwa_fontFamily', 'Inter'));
  const [fontSize, setFontSize] = useState(() => loadLS('arwa_fontSize', '14'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  // Client configurations — managed only by super admin
  const [clientConfigs, setClientConfigs] = useState(() => loadLS('arwa_clientConfigs', []));

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
  const [purchaseOrders, setPurchaseOrders] = useState(() => loadLS('arwa_purchaseOrders', []));
  const [stockTransfers, setStockTransfers] = useState(() => loadLS('arwa_stockTransfers', []));
  const [backorders, setBackorders] = useState(() => loadLS('arwa_backorders', []));
  const [payrollRecords, setPayrollRecords] = useState(() => loadLS('arwa_payrollRecords', []));
  const [customerInvoices, setCustomerInvoices] = useState(() => loadLS('arwa_customerInvoices', []));
  const [expenses, setExpenses] = useState(() => loadLS('arwa_expenses', []));
  const [chartOfAccounts, setChartOfAccounts] = useState(() => loadLS('arwa_chartOfAccounts', null));
  const [quotes, setQuotes] = useState(() => loadLS('arwa_quotes', []));
  const [stockMovements, setStockMovements] = useState(() => loadLS('arwa_stockMovements', STOCK_MOVEMENTS));
  const [tillSessions, setTillSessions] = useState(() => loadLS('arwa_till_sessions', []));
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
    businessType: 'platform_admin',
    enabledModules: [],
    moduleOverrides: {}, // { '/path': true|false } — explicit per-module on/off
  }));

  const getEnabledModules = useCallback((sub = null) => {
    const s = sub || subscription;
    const type = BUSINESS_TYPES[s.businessType] || BUSINESS_TYPES.platform_admin;
    if (type.modules[0] === 'ALL' && !s.moduleOverrides) return null; // platform_admin with no overrides = show everything
    // Start from business-type base + any legacy enabledModules additions
    let base = type.modules[0] === 'ALL'
      ? ['/', '/pos', '/inventory', '/cash-counter', '/customers', '/suppliers', '/online-orders',
         '/quotes', '/purchase-orders', '/stock-transfers', '/backorders', '/barcode',
         '/lot-tracking', '/reports', '/accounting', '/tax', '/payroll', '/cra-audit',
         '/ai-guardian', '/users', '/settings', '/subscription']
      : [...type.modules, ...(s.enabledModules || [])];
    let result = [...new Set(base)];
    // Apply per-module overrides (admin toggles)
    const overrides = s.moduleOverrides || {};
    for (const [path, enabled] of Object.entries(overrides)) {
      if (enabled && !result.includes(path)) result.push(path);
      if (!enabled) result = result.filter(p => p !== path);
    }
    // If no overrides at all and platform_admin, return null (show everything)
    if (type.modules[0] === 'ALL' && Object.keys(overrides).length === 0) return null;
    return result;
  }, [subscription]);

  // ─── Canadian tax config ──────────────────────────────────────────────────
  const [taxConfig, setTaxConfigState] = useState(() => loadLS('arwa_taxConfig', {
    province: 'ON', gstNumber: '', qstNumber: '', pstNumber: '',
  }));

  // ─── Inventory costing method ─────────────────────────────────────────────
  const [costingMethod, setCostingMethod] = useState(() => loadLS('arwa_costingMethod', 'average'));

  // ─── Audit log ────────────────────────────────────────────────────────────
  const [auditLog, setAuditLog] = useState(() => loadLS('arwa_auditLog', []));

  // ─── onboarding ───────────────────────────────────────────────────────────
  const [onboarded, setOnboarded] = useState(() => loadLS('arwa_onboarded', false));
  const [businessName, setBusinessName] = useState(() => loadLS('arwa_businessName', 'Arwa Enterprises'));

  // persistence effects
  useEffect(() => localStorage.setItem('arwa_theme',         JSON.stringify(theme)),         [theme]);
  useEffect(() => localStorage.setItem('arwa_colorTheme',    JSON.stringify(colorTheme)),    [colorTheme]);
  useEffect(() => localStorage.setItem('arwa_currency',      JSON.stringify(currency)),      [currency]);
  useEffect(() => localStorage.setItem('arwa_fontFamily',    JSON.stringify(fontFamily)),    [fontFamily]);
  useEffect(() => localStorage.setItem('arwa_fontSize',      JSON.stringify(fontSize)),      [fontSize]);

  const FONT_STACK = {
    'Inter':         "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    'Roboto':        "'Roboto', -apple-system, sans-serif",
    'Open Sans':     "'Open Sans', -apple-system, sans-serif",
    'Lato':          "'Lato', -apple-system, sans-serif",
    'Poppins':       "'Poppins', -apple-system, sans-serif",
    'IBM Plex Sans': "'IBM Plex Sans', -apple-system, sans-serif",
    'System':        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', FONT_STACK[fontFamily] || FONT_STACK['Inter']);
    document.documentElement.style.setProperty('--font-size-base', fontSize + 'px');
  }, [fontFamily, fontSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme to <html> so :root CSS variables inherit correctly into body/html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [theme, colorTheme]);

  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === SUPER_ADMIN_EMAIL;
  const isCompanyAdmin = isSuperAdmin || currentUser?.role === 'admin' || currentUser?.role === 'client';
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
  useEffect(() => localStorage.setItem('arwa_purchaseOrders', JSON.stringify(purchaseOrders)), [purchaseOrders]);
  useEffect(() => localStorage.setItem('arwa_stockTransfers', JSON.stringify(stockTransfers)), [stockTransfers]);
  useEffect(() => localStorage.setItem('arwa_backorders',     JSON.stringify(backorders)),     [backorders]);
  useEffect(() => localStorage.setItem('arwa_taxConfig',       JSON.stringify(taxConfig)),       [taxConfig]);
  useEffect(() => localStorage.setItem('arwa_costingMethod',   JSON.stringify(costingMethod)),   [costingMethod]);
  useEffect(() => localStorage.setItem('arwa_payrollRecords', JSON.stringify(payrollRecords)), [payrollRecords]);
  useEffect(() => localStorage.setItem('arwa_customerInvoices', JSON.stringify(customerInvoices)), [customerInvoices]);
  useEffect(() => localStorage.setItem('arwa_expenses',         JSON.stringify(expenses)),         [expenses]);
  useEffect(() => localStorage.setItem('arwa_quotes',           JSON.stringify(quotes)),           [quotes]);
  useEffect(() => localStorage.setItem('arwa_auditLog',  JSON.stringify(auditLog.slice(-500))), [auditLog]);
  useEffect(() => localStorage.setItem('arwa_onboarded',    JSON.stringify(onboarded)),    [onboarded]);
  useEffect(() => localStorage.setItem('arwa_businessName', JSON.stringify(businessName)), [businessName]);
  useEffect(() => localStorage.setItem('arwa_till_sessions', JSON.stringify(tillSessions)), [tillSessions]);
  useEffect(() => localStorage.setItem('arwa_clientConfigs', JSON.stringify(clientConfigs)), [clientConfigs]);

  // ── Mirror business data to IndexedDB for durability ──────────────────────
  useEffect(() => {
    dbSet('arwa_products',       products);
    dbSet('arwa_orders',         orders);
    dbSet('arwa_customers',      customers);
    dbSet('arwa_suppliers',      suppliers);
    dbSet('arwa_users',          users);
    dbSet('arwa_purchaseOrders', purchaseOrders);
    dbSet('arwa_stockTransfers', stockTransfers);
    dbSet('arwa_backorders',     backorders);
    dbSet('arwa_payrollRecords', payrollRecords);
    dbSet('arwa_customerInvoices', customerInvoices);
    dbSet('arwa_expenses',       expenses);
    dbSet('arwa_stockMovements', stockMovements);
    dbSet('arwa_auditLog',       auditLog);
    dbSet('arwa_onlineOrders',   onlineOrders);
    dbSet('arwa_quotes',         quotes);
  }, [products, orders, customers, suppliers, users, purchaseOrders, stockTransfers,
      backorders, payrollRecords, customerInvoices, expenses, stockMovements, auditLog, onlineOrders, quotes]);

  // ── On startup: restore from IndexedDB if localStorage was cleared ────────
  useEffect(() => {
    (async () => {
      const restoreKey = async (key, setter) => {
        if (!localStorage.getItem(key)) {
          const val = await dbGet(key);
          if (val !== null) {
            setter(val);
            localStorage.setItem(key, JSON.stringify(val));
          }
        }
      };
      await restoreKey('arwa_products',        setProducts);
      await restoreKey('arwa_orders',          setOrders);
      await restoreKey('arwa_customers',       setCustomers);
      await restoreKey('arwa_suppliers',       setSuppliers);
      await restoreKey('arwa_users',           setUsers);
      await restoreKey('arwa_purchaseOrders',  setPurchaseOrders);
      await restoreKey('arwa_stockTransfers',  setStockTransfers);
      await restoreKey('arwa_backorders',      setBackorders);
      await restoreKey('arwa_payrollRecords',  setPayrollRecords);
      await restoreKey('arwa_customerInvoices',setCustomerInvoices);
      await restoreKey('arwa_expenses',        setExpenses);
      await restoreKey('arwa_stockMovements',  setStockMovements);
      await restoreKey('arwa_onlineOrders',    setOnlineOrders);
      await restoreKey('arwa_quotes',          setQuotes);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const setApiKey = useCallback((key) => {
    setApiKeyState(key.trim());
  }, []);

  const completeOnboarding = useCallback((name) => {
    if (name && name.trim()) setBusinessName(name.trim());
    setOnboarded(true);
  }, []);

  const setTaxConfig = useCallback((updater) => {
    setTaxConfigState(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
  }, []);

  const addAuditEntry = useCallback((action, details = {}) => {
    setAuditLog(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: 'Admin',
      action,
      ...details,
    }, ...prev].slice(0, 500));
  }, []);

  const addStockTransfer    = useCallback((t) => setStockTransfers(prev => [t, ...prev]), []);
  const addBackorder        = useCallback((b) => setBackorders(prev => [b, ...prev]), []);
  const updateBackorder     = useCallback((id, data) => setBackorders(prev => prev.map(b => b.id === id ? { ...b, ...data } : b)), []);

  const addPurchaseOrder    = useCallback((po) => setPurchaseOrders(prev => [po, ...prev]), []);
  const updatePurchaseOrder = useCallback((id, data) => setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, ...data } : po)), []);
  const deletePurchaseOrder = useCallback((id) => setPurchaseOrders(prev => prev.filter(po => po.id !== id)), []);

  const calcOrderTax = useCallback((subtotal, category = '', gstExempt = false) => {
    return calcTax(subtotal, taxConfig?.province || 'ON', category, gstExempt);
  }, [taxConfig]);

  // ─── stock movement audit ──────────────────────────────────────────────────

  const addPayrollRecord = useCallback((r) => setPayrollRecords(prev => [r, ...prev]), []);

  const addCustomerInvoice    = useCallback((inv) => setCustomerInvoices(prev => [inv, ...prev]), []);
  const updateCustomerInvoice = useCallback((id, data) => setCustomerInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv)), []);
  const addExpense             = useCallback((e) => setExpenses(prev => [e, ...prev]), []);

  const exportAllData = useCallback(async () => {
    const data = {};
    const keys = ['arwa_products','arwa_orders','arwa_customers','arwa_suppliers',
      'arwa_users','arwa_purchaseOrders','arwa_stockTransfers','arwa_backorders',
      'arwa_payrollRecords','arwa_customerInvoices','arwa_expenses',
      'arwa_stockMovements','arwa_auditLog','arwa_onlineOrders',
      'arwa_taxConfig','arwa_subscription','arwa_businessName','arwa_currency'];
    keys.forEach(k => {
      try { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v); } catch(e) {}
    });
    data['arwa_exportedAt'] = new Date().toISOString();
    data['arwa_version'] = '1.0';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arwa-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded successfully', 'success');
  }, [showToast]);

  const importAllData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.arwa_products) { setProducts(data.arwa_products); localStorage.setItem('arwa_products', JSON.stringify(data.arwa_products)); }
        if (data.arwa_orders)   { setOrders(data.arwa_orders);     localStorage.setItem('arwa_orders',   JSON.stringify(data.arwa_orders)); }
        if (data.arwa_customers){ setCustomers(data.arwa_customers);localStorage.setItem('arwa_customers',JSON.stringify(data.arwa_customers)); }
        if (data.arwa_suppliers){ setSuppliers(data.arwa_suppliers);localStorage.setItem('arwa_suppliers',JSON.stringify(data.arwa_suppliers)); }
        if (data.arwa_purchaseOrders){ setPurchaseOrders(data.arwa_purchaseOrders);localStorage.setItem('arwa_purchaseOrders',JSON.stringify(data.arwa_purchaseOrders)); }
        if (data.arwa_stockTransfers){ setStockTransfers(data.arwa_stockTransfers);localStorage.setItem('arwa_stockTransfers',JSON.stringify(data.arwa_stockTransfers)); }
        if (data.arwa_backorders){ setBackorders(data.arwa_backorders);localStorage.setItem('arwa_backorders',JSON.stringify(data.arwa_backorders)); }
        if (data.arwa_payrollRecords){ setPayrollRecords(data.arwa_payrollRecords);localStorage.setItem('arwa_payrollRecords',JSON.stringify(data.arwa_payrollRecords)); }
        if (data.arwa_customerInvoices){ setCustomerInvoices(data.arwa_customerInvoices);localStorage.setItem('arwa_customerInvoices',JSON.stringify(data.arwa_customerInvoices)); }
        if (data.arwa_expenses){ setExpenses(data.arwa_expenses);localStorage.setItem('arwa_expenses',JSON.stringify(data.arwa_expenses)); }
        if (data.arwa_taxConfig){ setTaxConfigState(data.arwa_taxConfig);localStorage.setItem('arwa_taxConfig',JSON.stringify(data.arwa_taxConfig)); }
        if (data.arwa_businessName){ setBusinessName(data.arwa_businessName);localStorage.setItem('arwa_businessName',JSON.stringify(data.arwa_businessName)); }
        showToast('Data restored from backup successfully!', 'success');
      } catch(err) {
        showToast('Failed to import backup: invalid file format', 'error');
      }
    };
    reader.readAsText(file);
  }, [showToast, setTaxConfigState, setBusinessName]);

  const addStockMovement = useCallback(({ productId, productName, type, qty, note }) => {
    setStockMovements(prev => [{
      id: Date.now(), productId, productName, type, qty,
      userId:   currentUser ? currentUser.id   : null,
      userName: currentUser ? currentUser.name : 'System',
      time: new Date().toISOString(),
      note: note || '',
    }, ...prev]);
  }, [currentUser]);

  // ─── till sessions ────────────────────────────────────────────────────────

  const openTill = useCallback((floatAmount, user, pin) => {
    setTillSessions(prev => [{
      id: 'TILL-' + Date.now(),
      openedAt: new Date().toISOString(),
      openedBy: user || (currentUser ? currentUser.name : 'Cashier'),
      openingFloat: parseFloat(floatAmount) || 0,
      cashierPin: String(pin || ''),   // store PIN in session
      cashMovements: [],
      closingFloat: null,
      status: 'open',
    }, ...prev]);
    showToast('Till opened successfully', 'success');
  }, [currentUser, showToast]);

  const closeTill = useCallback((sessionId, countedCash) => {
    setTillSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, status: 'closed', closedAt: new Date().toISOString(), closingFloat: parseFloat(countedCash) || 0 }
        : s
    ));
    showToast('Till closed and Z-Read saved', 'success');
  }, [showToast]);

  const addCashMovement = useCallback((sessionId, movement) => {
    setTillSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, cashMovements: [...(s.cashMovements || []), { ...movement, at: new Date().toISOString() }] }
        : s
    ));
  }, []);

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

  // ─── quotes ───────────────────────────────────────────────────────────────
  const addQuote = useCallback((q) => {
    setQuotes(prev => {
      const num = `QT-${String(prev.length + 1).padStart(4, '0')}`;
      return [{ ...q, id: q.id || Date.now(), quoteNumber: q.quoteNumber || num, createdAt: new Date().toISOString(), status: q.status || 'draft' }, ...prev];
    });
    showToast('Quote created successfully');
  }, [showToast]);
  const updateQuote = useCallback((id, updates) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q));
  }, []);
  const deleteQuote = useCallback((id) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
    showToast('Quote deleted', 'info');
  }, [showToast]);
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
    // Check users array first, then fall back to clientConfigs (handles sync edge cases)
    let found = users.find(u => u.email === email && u.password === password)
      || USERS.find(u => u.email === email && u.password === password);
    if (!found) {
      const cfg = clientConfigs.find(c => c.email === email && c.loginPassword === password && c.status !== 'suspended' && c.status !== 'cancelled');
      if (cfg) {
        found = { id: cfg.id, name: cfg.clientName, email: cfg.email, role: 'client', status: 'active', branch: 'Main Store', permissions: [] };
        // Sync the user into the users array so future logins use the fast path
        setUsers(prev => {
          if (prev.find(u => u.email === email)) return prev.map(u => u.email === email ? { ...u, password } : u);
          return [...prev, { ...found, password }];
        });
      }
    }
    if (!found) return false;
    setCurrentUser(found);
    setIsAuthenticated(true);
    // If this user is a super admin, don't apply client config
    if (found.role === 'superadmin' || found.email === SUPER_ADMIN_EMAIL) return true;
    // Check if there's a client config for this email or domain
    const emailDomain = email.split('@')[1];
    const clientCfg = clientConfigs.find(c =>
      c.email === email || (c.domain && emailDomain && c.domain.toLowerCase() === emailDomain.toLowerCase())
    );
    if (clientCfg && clientCfg.status === 'active') {
      setSubscription(prev => ({
        ...prev,
        businessType: clientCfg.businessType || prev.businessType,
        plan: clientCfg.plan || prev.plan,
        moduleOverrides: clientCfg.moduleOverrides || {},
      }));
    }
    return true;
  }, [users, clientConfigs, setUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('arwa_auth');
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // ─── context value ────────────────────────────────────────────────────────

  const currentTillSession = tillSessions.find(s => s.status === 'open') || null;

  const value = useMemo(() => ({
    theme, toggleTheme, colorTheme, setColorTheme,
    fontFamily, setFontFamily, fontSize, setFontSize,
    currency, setCurrency,
    sidebarCollapsed, setSidebarCollapsed,
    toast, showToast,
    isAuthenticated, currentUser, login, logout,
    products, setProducts, addProduct, updateProduct, deleteProduct,
    suppliers, setSuppliers, addSupplier, updateSupplier,
    customers, setCustomers, addCustomer, updateCustomer, deleteCustomer,
    users, setUsers, addUser, deleteUser,
    orders, setOrders, addOrder,
    quotes, addQuote, updateQuote, deleteQuote,
    onlineOrders, setOnlineOrders, updateOnlineOrderStatus, addOnlineOrder,
    notifications, markNotificationRead, unreadCount,
    aiMetrics, setAiMetrics,
    aiIssues, setAiIssues,
    repairHistory, addRepair,
    resolveIssue, runAIScan,
    stockMovements, addStockMovement,
    subscription, setSubscription, getEnabledModules,
    apiKey, setApiKey,
    scanStats,
    wsStatus, wsClient,
    onboarded, businessName, completeOnboarding,
    taxConfig, setTaxConfig, calcOrderTax,
    costingMethod, setCostingMethod,
    payrollRecords, addPayrollRecord,
    customerInvoices, addCustomerInvoice, updateCustomerInvoice,
    expenses, addExpense,
    chartOfAccounts, setChartOfAccounts,
    purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
    stockTransfers, addStockTransfer,
    backorders, addBackorder, updateBackorder,
    auditLog, addAuditEntry,
    exportAllData, importAllData,
    tillSessions, currentTillSession, openTill, closeTill, addCashMovement,
    isSuperAdmin, isCompanyAdmin, clientConfigs, setClientConfigs,
  }), [
    theme, toggleTheme, colorTheme, setColorTheme, fontFamily, fontSize,
    currency, sidebarCollapsed, toast, showToast,
    isAuthenticated, currentUser, login, logout,
    products, addProduct, updateProduct, deleteProduct,
    suppliers, addSupplier, updateSupplier,
    customers, addCustomer, updateCustomer, deleteCustomer,
    users, addUser, deleteUser,
    orders, addOrder, quotes, addQuote, updateQuote, deleteQuote, // eslint-disable-line react-hooks/exhaustive-deps
    onlineOrders, updateOnlineOrderStatus, addOnlineOrder,
    notifications, markNotificationRead, unreadCount,
    aiMetrics, aiIssues, repairHistory, addRepair,
    resolveIssue, runAIScan,
    stockMovements, addStockMovement,
    subscription, getEnabledModules,
    apiKey, setApiKey, scanStats, wsStatus, onboarded, businessName,
    taxConfig, auditLog, purchaseOrders, stockTransfers, backorders,
    costingMethod, payrollRecords, addPayrollRecord,
    customerInvoices, addCustomerInvoice, updateCustomerInvoice,
    expenses, addExpense, chartOfAccounts, setChartOfAccounts,
    completeOnboarding, setTaxConfig, calcOrderTax, addAuditEntry,
    addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
    addStockTransfer, addBackorder, updateBackorder,
    exportAllData, importAllData,
    tillSessions, currentTillSession, openTill, closeTill, addCashMovement,
    isSuperAdmin, isCompanyAdmin, clientConfigs,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
