export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Starter',
    monthlyPrice: 49,
    yearlyPrice: 490,
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
    monthlyOrders: 500,
    users: 3,
    products: 1000,
    aiScansPerDay: 10,
    selfHealing: false,
    branches: 1,
    features: [
      '500 orders / month',
      'Up to 1,000 products',
      '3 staff accounts',
      '1 location / branch',
      'POS + Inventory + Customers',
      'Basic reports & dashboard',
      'CSV bulk import',
      'Email support',
      'Canadian tax (GST/HST/PST)',
    ],
    locked: [
      'Quotes & B2B pricing',
      'Purchase orders',
      'Multi-warehouse transfers',
      'Payroll & CRA export',
      'AI Guardian monitoring',
      'Lot / serial tracking',
    ],
  },
  intermediate: {
    id: 'intermediate',
    name: 'Growth',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    color: '#4F46E5',
    gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
    popular: true,
    monthlyOrders: 5000,
    users: 10,
    products: 10000,
    aiScansPerDay: 100,
    selfHealing: false,
    branches: 3,
    features: [
      '5,000 orders / month',
      'Up to 10,000 products',
      '10 staff accounts',
      '3 locations / branches',
      'All Starter modules',
      'Quotes & B2B contract pricing',
      'Purchase orders & backorders',
      'Multi-warehouse stock transfers',
      'Lot / batch / serial tracking',
      'Payroll & CRA / T4 export',
      'Accounting module (P&L, AR/AP)',
      'AI Guardian monitoring (100 scans/day)',
      'Priority support',
    ],
    locked: [
      'AI Self-Healing Engine',
      'Unlimited locations',
      'White-label branding',
    ],
  },
  super: {
    id: 'super',
    name: 'Enterprise',
    monthlyPrice: 349,
    yearlyPrice: 3490,
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669, #0D9488)',
    monthlyOrders: 10000,
    users: -1,
    products: -1,
    aiScansPerDay: -1,
    selfHealing: false,
    branches: -1,
    features: [
      '10,000 orders / month',
      'Unlimited products',
      'Unlimited staff accounts',
      'Unlimited locations',
      'All Growth modules',
      'Unlimited AI scans',
      'Advanced business intelligence',
      'White-label ready',
      'Franchise / multi-company support',
      'API access',
      'Dedicated account manager',
      '24/7 priority support',
    ],
    locked: ['AI Self-Healing Engine (add-on)'],
  },
};

export const ORDER_ADDON_PRICE = 20; // CAD per 1,000 extra orders

export const SELF_HEALING_ADDON = {
  monthlyPrice: 99,
  yearlyPrice: 990,
  name: 'AI Self-Healing Engine',
  features: [
    'Automatic bug detection & fixing',
    'Auto code repair & patching',
    'Auto dependency resolution',
    'Automatic database optimization',
    'Auto memory leak fixing',
    'Auto rollback & crash recovery',
    'Auto service restart',
    'Admin approval workflow',
    'Complete repair audit logs',
    'Isolated test environment',
  ],
};

export const PRODUCTS = [
  { id: 1, name: 'Paracetamol 500mg', sku: 'MED-001', barcode: '8901234567890', category: 'Pharmaceuticals', supplier: 'PharmaCo Ltd', purchasePrice: 2.50, salePrice: 5.99, stock: 450, minStock: 100, expiry: '2027-12-31', warehouse: 'Main Store', image: null, tax: 0, status: 'active' },
  { id: 2, name: 'iPhone 15 Pro', sku: 'ELEC-001', barcode: '8902345678901', category: 'Electronics', supplier: 'TechSupply Inc', purchasePrice: 850, salePrice: 1199, stock: 23, minStock: 5, expiry: null, warehouse: 'Main Store', image: null, tax: 15, status: 'active' },
  { id: 3, name: 'Organic Whole Milk 1L', sku: 'GROC-001', barcode: '8903456789012', category: 'Groceries', supplier: 'FreshFarm Co', purchasePrice: 0.80, salePrice: 1.99, stock: 12, minStock: 50, expiry: '2026-07-20', warehouse: 'Cold Storage', image: null, tax: 0, status: 'low_stock' },
  { id: 4, name: 'Men\'s Cotton T-Shirt (L)', sku: 'CLTH-001', barcode: '8904567890123', category: 'Clothing', supplier: 'FashionWear Ltd', purchasePrice: 8, salePrice: 24.99, stock: 87, minStock: 20, expiry: null, warehouse: 'Main Store', image: null, tax: 10, status: 'active' },
  { id: 5, name: 'Samsung 65" QLED TV', sku: 'ELEC-002', barcode: '8905678901234', category: 'Electronics', supplier: 'TechSupply Inc', purchasePrice: 620, salePrice: 999, stock: 8, minStock: 3, expiry: null, warehouse: 'Main Store', image: null, tax: 15, status: 'active' },
  { id: 6, name: 'Vitamin D3 1000IU', sku: 'MED-002', barcode: '8906789012345', category: 'Pharmaceuticals', supplier: 'PharmaCo Ltd', purchasePrice: 3.20, salePrice: 8.99, stock: 234, minStock: 50, expiry: '2027-08-15', warehouse: 'Main Store', image: null, tax: 0, status: 'active' },
  { id: 7, name: 'Basmati Rice 5kg', sku: 'GROC-002', barcode: '8907890123456', category: 'Groceries', supplier: 'GrainMaster', purchasePrice: 4.50, salePrice: 9.99, stock: 156, minStock: 30, expiry: '2027-01-01', warehouse: 'Dry Goods', image: null, tax: 0, status: 'active' },
  { id: 8, name: 'HP LaserJet Toner', sku: 'SUPP-001', barcode: '8908901234567', category: 'Office Supplies', supplier: 'OfficeWorld', purchasePrice: 35, salePrice: 69.99, stock: 3, minStock: 10, expiry: null, warehouse: 'Main Store', image: null, tax: 15, status: 'low_stock' },
  { id: 9, name: 'Nike Air Max 270', sku: 'SHOE-001', barcode: '8909012345678', category: 'Footwear', supplier: 'SportsZone Ltd', purchasePrice: 55, salePrice: 129.99, stock: 41, minStock: 10, expiry: null, warehouse: 'Main Store', image: null, tax: 10, status: 'active' },
  { id: 10, name: 'Wireless Mouse Logitech', sku: 'ELEC-003', barcode: '8900123456789', category: 'Electronics', supplier: 'TechSupply Inc', purchasePrice: 18, salePrice: 39.99, stock: 0, minStock: 15, expiry: null, warehouse: 'Main Store', image: null, tax: 15, status: 'out_of_stock' },
  { id: 11, name: 'Amoxicillin 250mg', sku: 'MED-003', barcode: '8901234567891', category: 'Pharmaceuticals', supplier: 'PharmaCo Ltd', purchasePrice: 4.10, salePrice: 12.99, stock: 89, minStock: 30, expiry: '2026-09-30', warehouse: 'Main Store', image: null, tax: 0, status: 'expiring_soon' },
  { id: 12, name: 'Coca-Cola 24-Pack', sku: 'BEV-001', barcode: '8901234567892', category: 'Beverages', supplier: 'BevDistrib Co', purchasePrice: 7.50, salePrice: 15.99, stock: 67, minStock: 20, expiry: '2026-12-01', warehouse: 'Dry Goods', image: null, tax: 5, status: 'active' },
];

export const CATEGORIES = [
  'Pharmaceuticals', 'Electronics', 'Groceries', 'Clothing', 'Footwear',
  'Beverages', 'Office Supplies', 'Hardware', 'Automotive', 'Medical',
  'Industrial', 'Beauty & Personal Care', 'Toys & Games', 'Sports & Fitness',
];

export const SUPPLIERS = [
  { id: 1, name: 'PharmaCo Ltd', email: 'orders@pharmaco.com', phone: '+1-555-0101', country: 'USA', rating: 4.8, totalOrders: 145, balance: 2450 },
  { id: 2, name: 'TechSupply Inc', email: 'supply@techsupply.com', phone: '+1-555-0102', country: 'USA', rating: 4.6, totalOrders: 89, balance: 15600 },
  { id: 3, name: 'FreshFarm Co', email: 'fresh@freshfarm.com', phone: '+1-555-0103', country: 'Canada', rating: 4.9, totalOrders: 312, balance: 890 },
  { id: 4, name: 'FashionWear Ltd', email: 'trade@fashionwear.com', phone: '+44-20-5555-0104', country: 'UK', rating: 4.3, totalOrders: 67, balance: 3200 },
  { id: 5, name: 'GrainMaster', email: 'bulk@grainmaster.com', phone: '+1-555-0105', country: 'Australia', rating: 4.7, totalOrders: 198, balance: 1100 },
];

export const USERS = [
  { id: 0, name: 'Younus (Master)', email: 'pharmacist_younus@yahoo.com', password: 'Arwa@Master2026', role: 'superadmin', status: 'active', lastLogin: '2026-06-23T10:00:00', branch: 'All Branches', permissions: ['all'] },
  { id: 1, name: 'Admin User', email: 'admin@arwaenterprises.com', password: 'admin123', role: 'admin', status: 'active', lastLogin: '2026-07-15T09:30:00', branch: 'All Branches', permissions: ['all'] },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@arwaenterprises.com', password: 'pass1234', role: 'manager', status: 'active', lastLogin: '2026-07-15T08:15:00', branch: 'Main Store', permissions: ['inventory', 'reports', 'pos', 'users_view'] },
  { id: 3, name: 'Mike Chen', email: 'mike@arwaenterprises.com', password: 'pass1234', role: 'cashier', status: 'active', lastLogin: '2026-07-15T07:45:00', branch: 'Main Store', permissions: ['pos'] },
  { id: 4, name: 'Aisha Patel', email: 'aisha@arwaenterprises.com', password: 'pass1234', role: 'warehouse', status: 'active', lastLogin: '2026-07-14T16:20:00', branch: 'Warehouse A', permissions: ['inventory', 'receiving'] },
  { id: 5, name: 'Carlos Rivera', email: 'carlos@arwaenterprises.com', password: 'pass1234', role: 'accountant', status: 'active', lastLogin: '2026-07-15T09:00:00', branch: 'Main Store', permissions: ['reports', 'finances'] },
  { id: 6, name: 'Emma Williams', email: 'emma@arwaenterprises.com', password: 'pass1234', role: 'cashier', status: 'inactive', lastLogin: '2026-07-10T14:30:00', branch: 'Branch B', permissions: ['pos'] },
];

export const ORDERS = [
  { id: 'ORD-2026-001', customer: 'John Smith', items: 5, total: 245.50, status: 'completed', date: '2026-07-15T10:30:00', payment: 'card' },
  { id: 'ORD-2026-002', customer: 'Mary Davis', items: 2, total: 89.99, status: 'completed', date: '2026-07-15T11:15:00', payment: 'cash' },
  { id: 'ORD-2026-003', customer: 'Robert Wilson', items: 8, total: 512.75, status: 'processing', date: '2026-07-15T11:45:00', payment: 'card' },
  { id: 'ORD-2026-004', customer: 'Jennifer Brown', items: 3, total: 167.20, status: 'completed', date: '2026-07-15T12:00:00', payment: 'mobile' },
  { id: 'ORD-2026-005', customer: 'Walk-in Customer', items: 1, total: 24.99, status: 'completed', date: '2026-07-15T12:30:00', payment: 'cash' },
];

export const SALES_DATA = [
  { month: 'Jan', revenue: 42500, profit: 12800, orders: 342 },
  { month: 'Feb', revenue: 38900, profit: 11200, orders: 298 },
  { month: 'Mar', revenue: 51200, profit: 15600, orders: 412 },
  { month: 'Apr', revenue: 48700, profit: 14100, orders: 389 },
  { month: 'May', revenue: 56300, profit: 17800, orders: 451 },
  { month: 'Jun', revenue: 61800, profit: 19200, orders: 498 },
  { month: 'Jul', revenue: 58200, profit: 18100, orders: 467 },
  { month: 'Aug', revenue: 64500, profit: 20300, orders: 521 },
  { month: 'Sep', revenue: 59800, profit: 18700, orders: 479 },
  { month: 'Oct', revenue: 67200, profit: 21500, orders: 542 },
  { month: 'Nov', revenue: 72100, profit: 23400, orders: 581 },
  { month: 'Dec', revenue: 85600, profit: 28900, orders: 692 },
];

export const WEEKLY_SALES = [
  { day: 'Mon', sales: 4250, transactions: 34 },
  { day: 'Tue', sales: 3890, transactions: 28 },
  { day: 'Wed', sales: 5120, transactions: 41 },
  { day: 'Thu', sales: 4670, transactions: 37 },
  { day: 'Fri', sales: 6300, transactions: 52 },
  { day: 'Sat', sales: 7850, transactions: 63 },
  { day: 'Sun', sales: 5400, transactions: 44 },
];

export const CATEGORY_DATA = [
  { name: 'Electronics', value: 35, color: '#4F46E5' },
  { name: 'Pharmaceuticals', value: 22, color: '#7C3AED' },
  { name: 'Groceries', value: 18, color: '#059669' },
  { name: 'Clothing', value: 12, color: '#D97706' },
  { name: 'Footwear', value: 8, color: '#DC2626' },
  { name: 'Other', value: 5, color: '#6B7280' },
];

export const AI_ISSUES = [
  { id: 1, type: 'performance', severity: 'warning', title: 'Database Query Slow', description: 'Product search queries averaging 2.3s. Index optimization recommended.', module: 'Inventory', detected: '2026-07-15T08:00:00', status: 'pending', autoFixable: true },
  { id: 2, type: 'security', severity: 'critical', title: 'Weak Password Policy', description: 'A staff account is using a weak password pattern.', module: 'User Management', detected: '2026-07-15T06:30:00', status: 'pending', autoFixable: false },
  { id: 3, type: 'memory', severity: 'warning', title: 'Memory Usage Elevated', description: 'Application RAM usage at 78%. Possible memory leak in POS module.', module: 'POS System', detected: '2026-07-15T09:15:00', status: 'pending', autoFixable: true },
  { id: 4, type: 'barcode', severity: 'info', title: 'Barcode Scanner Timeout', description: 'USB barcode scanner COM3 experienced 3 connection timeouts in 1 hour.', module: 'Barcode Engine', detected: '2026-07-15T07:45:00', status: 'resolved', autoFixable: true },
  { id: 5, type: 'dependency', severity: 'warning', title: 'Outdated Package Detected', description: 'crypto-utils v2.1.0 has known vulnerability CVE-2024-1234. Update available.', module: 'Core System', detected: '2026-07-14T22:00:00', status: 'pending', autoFixable: true },
  { id: 6, type: 'crash', severity: 'critical', title: 'POS Module Crash Predicted', description: 'AI predicts 87% crash probability in POS within 4 hours under current load.', module: 'POS System', detected: '2026-07-15T10:00:00', status: 'pending', autoFixable: false },
];

export const AI_METRICS = {
  healthScore: 73,
  performanceScore: 81,
  securityScore: 68,
  stabilityScore: 85,
  uptimePercent: 99.2,
  scansToday: 47,
  issuesDetected: 6,
  issuesResolved: 12,
  cpuUsage: 34,
  ramUsage: 78,
  diskUsage: 45,
  dbQueryAvg: 2.3,
  apiResponseAvg: 145,
  barcodeSuccessRate: 99.1,
};

export const REPAIR_HISTORY = [
  { id: 1, action: 'Auto-optimized database indexes', module: 'Database', result: 'success', time: '2026-07-14T23:30:00', improvement: '+45% query speed' },
  { id: 2, action: 'Restarted stuck background service', module: 'Sync Engine', result: 'success', time: '2026-07-14T21:15:00', improvement: 'Service restored' },
  { id: 3, action: 'Cleared memory cache overflow', module: 'POS System', result: 'success', time: '2026-07-14T18:00:00', improvement: 'RAM -23%' },
  { id: 4, action: 'Auto-patched crypto-utils v2.0.9', module: 'Dependencies', result: 'rolled_back', time: '2026-07-14T15:30:00', improvement: 'Compatibility issue' },
  { id: 5, action: 'Fixed API timeout handler', module: 'Cloud Sync', result: 'success', time: '2026-07-13T11:00:00', improvement: 'Zero timeouts' },
];

export const ONLINE_ORDERS = [
  { id: '482901', platform: 'ubereats', customer: 'James Carter', type: 'delivery', status: 'new', time: '11:42', total: 38.50, address: '124 Maple St, Unit 3', note: 'No onions please', items: [{ name: 'Chicken Burger', qty: 2, price: 12.99 }, { name: 'Large Fries', qty: 2, price: 4.99 }, { name: 'Coke 500ml', qty: 2, price: 2.75 }] },
  { id: '482899', platform: 'doordash', customer: 'Priya Sharma', type: 'delivery', status: 'preparing', time: '11:28', total: 52.10, address: '88 Oak Avenue', note: '', items: [{ name: 'Family Meal Deal', qty: 1, price: 39.99 }, { name: 'Extra Sauce', qty: 3, price: 0.99, note: 'BBQ' }, { name: 'Water Bottle', qty: 2, price: 1.99 }] },
  { id: '482897', platform: 'skipthedishes', customer: 'Mohammed Ali', type: 'pickup', status: 'ready', time: '11:15', total: 24.75, address: '', note: 'Call on arrival', items: [{ name: 'Shawarma Wrap', qty: 2, price: 10.99 }, { name: 'Hummus Side', qty: 1, price: 4.50 }] },
  { id: '482895', platform: 'website', customer: 'Sarah Lee', type: 'pickup', status: 'confirmed', time: '10:58', total: 19.98, address: '', note: '', items: [{ name: 'Sandwich Combo', qty: 2, price: 9.99 }] },
  { id: '482893', platform: 'phone', customer: 'Walk-in Table 4', type: 'dinein', status: 'preparing', time: '10:45', total: 67.80, address: '', note: 'Birthday — bring candle', items: [{ name: 'BBQ Ribs Full Rack', qty: 1, price: 34.99 }, { name: 'Caesar Salad', qty: 2, price: 11.99 }, { name: 'Cheesecake', qty: 2, price: 8.99 }] },
  { id: '482891', platform: 'ubereats', customer: 'Carlos Mendez', type: 'delivery', status: 'pickup', time: '10:30', total: 15.98, address: '45 Pine Rd', note: '', items: [{ name: 'Pizza Slice x4', qty: 4, price: 3.99 }] },
  { id: '482888', platform: 'doordash', customer: 'Linda Wong', type: 'delivery', status: 'delivered', time: '09:55', total: 43.20, address: '302 Elm Blvd', note: '', items: [{ name: 'Pasta Carbonara', qty: 2, price: 16.99 }, { name: 'Garlic Bread', qty: 2, price: 4.99 }] },
  { id: '482886', platform: 'phone', customer: 'Ahmed Hassan', type: 'pickup', status: 'delivered', time: '09:40', total: 12.50, address: '', note: '', items: [{ name: 'Breakfast Wrap', qty: 1, price: 9.99 }, { name: 'Orange Juice', qty: 1, price: 3.50 }] },
  { id: '482884', platform: 'skipthedishes', customer: 'Emma Brown', type: 'delivery', status: 'cancelled', time: '09:20', total: 28.00, address: '77 Cedar Lane', note: 'Cancelled by customer', items: [{ name: 'Veggie Burger Combo', qty: 2, price: 14.00 }] },
  { id: '482882', platform: 'website', customer: 'David Kim', type: 'pickup', status: 'new', time: '11:50', total: 33.96, address: '', note: 'Gluten free bun please', items: [{ name: 'Gourmet Burger', qty: 2, price: 13.99 }, { name: 'Onion Rings', qty: 2, price: 5.99 }] },
  { id: '482880', platform: 'ubereats', customer: 'Fatima Noor', type: 'delivery', status: 'confirmed', time: '11:38', total: 21.97, address: '19 Birch St', note: '', items: [{ name: 'Chicken Tenders 6pc', qty: 1, price: 13.99 }, { name: 'Coleslaw', qty: 2, price: 3.99 }] },
  { id: '482878', platform: 'doordash', customer: 'Ryan O\'Brien', type: 'delivery', status: 'preparing', time: '11:22', total: 46.95, address: '56 Willow Way', note: 'Ring doorbell twice', items: [{ name: 'Steak Dinner', qty: 1, price: 34.99 }, { name: 'Side Salad', qty: 1, price: 7.99 }, { name: 'Sparkling Water', qty: 2, price: 1.99 }] },
];

export const NOTIFICATIONS = [
  { id: 1, type: 'warning', message: 'Low stock: Organic Whole Milk (12 units remaining)', time: '2 min ago', read: false },
  { id: 2, type: 'critical', message: 'AI Alert: Memory usage at 78% — action recommended', time: '15 min ago', read: false },
  { id: 3, type: 'info', message: 'New purchase order from PharmaCo Ltd received', time: '1 hr ago', read: false },
  { id: 4, type: 'success', message: 'Daily backup completed successfully', time: '3 hrs ago', read: true },
  { id: 5, type: 'warning', message: 'Product "Amoxicillin 250mg" expiring in 77 days', time: '5 hrs ago', read: true },
];

export const CUSTOMERS = [
  { id: 1, name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-1001', totalOrders: 24, totalSpent: 1842.50, lastVisit: '2026-07-14', loyaltyPoints: 1842 },
  { id: 2, name: 'Mary Davis', email: 'mary.davis@email.com', phone: '+1-555-1002', totalOrders: 18, totalSpent: 976.80, lastVisit: '2026-07-15', loyaltyPoints: 976 },
  { id: 3, name: 'Robert Wilson', email: 'robert.wilson@email.com', phone: '+1-555-1003', totalOrders: 41, totalSpent: 5312.25, lastVisit: '2026-07-13', loyaltyPoints: 5312 },
  { id: 4, name: 'Jennifer Brown', email: 'jennifer.brown@email.com', phone: '+1-555-1004', totalOrders: 9, totalSpent: 432.60, lastVisit: '2026-07-10', loyaltyPoints: 432 },
  { id: 5, name: 'Ahmed Hassan', email: 'ahmed.hassan@email.com', phone: '+1-555-1005', totalOrders: 33, totalSpent: 2780.00, lastVisit: '2026-07-15', loyaltyPoints: 2780 },
  { id: 6, name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+1-555-1006', totalOrders: 15, totalSpent: 1124.35, lastVisit: '2026-07-12', loyaltyPoints: 1124 },
  { id: 7, name: 'Linda Wong', email: 'linda.wong@email.com', phone: '+1-555-1007', totalOrders: 27, totalSpent: 3490.75, lastVisit: '2026-07-11', loyaltyPoints: 3490 },
  { id: 8, name: 'Carlos Mendez', email: 'carlos.mendez@email.com', phone: '+1-555-1008', totalOrders: 6, totalSpent: 287.40, lastVisit: '2026-07-08', loyaltyPoints: 287 },
];

export const STOCK_MOVEMENTS = [
  { id: 1, productId: 1, productName: 'Paracetamol 500mg', type: 'receive', qty: 200, userId: 4, userName: 'Aisha Patel', time: '2026-07-14T09:00:00', note: 'Purchase order PO-2026-045 received' },
  { id: 2, productId: 3, productName: 'Organic Whole Milk 1L', type: 'sale', qty: -8, userId: 3, userName: 'Mike Chen', time: '2026-07-14T11:30:00', note: 'POS sale ORD-2026-001' },
  { id: 3, productId: 10, productName: 'Wireless Mouse Logitech', type: 'adjustment', qty: -5, userId: 1, userName: 'Admin User', time: '2026-07-14T14:00:00', note: 'Inventory count correction — damaged units removed' },
  { id: 4, productId: 9, productName: 'Nike Air Max 270', type: 'return', qty: 2, userId: 2, userName: 'Sarah Johnson', time: '2026-07-15T08:45:00', note: 'Customer return — wrong size' },
  { id: 5, productId: 6, productName: 'Vitamin D3 1000IU', type: 'receive', qty: 100, userId: 4, userName: 'Aisha Patel', time: '2026-07-15T10:15:00', note: 'Restocking from PharmaCo Ltd shipment' },
  { id: 6, productId: 12, productName: 'Coca-Cola 24-Pack', type: 'sale', qty: -12, userId: 3, userName: 'Mike Chen', time: '2026-07-15T12:00:00', note: 'Bulk sale to catering client' },
];

export const BUSINESS_TYPES = {
  restaurant: {
    label: 'Restaurant / Food Service',
    emoji: '🍽️',
    modules: ['/', '/pos', '/cash-counter', '/online-orders', '/inventory', '/customers', '/suppliers', '/reports', '/accounting', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/barcode', '/payroll', '/tax', '/lot-tracking', '/purchase-orders', '/quotes'],
  },
  gas_station: {
    label: 'Gas Station / Convenience Store',
    emoji: '⛽',
    modules: ['/', '/pos', '/cash-counter', '/inventory', '/customers', '/suppliers', '/reports', '/accounting', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/barcode', '/payroll', '/tax', '/purchase-orders', '/lot-tracking'],
  },
  grocery: {
    label: 'Grocery Store / Supermarket',
    emoji: '🛒',
    modules: ['/', '/pos', '/cash-counter', '/inventory', '/customers', '/suppliers', '/purchase-orders', '/lot-tracking', '/barcode', '/reports', '/accounting', '/tax', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/payroll', '/online-orders', '/backorders', '/quotes'],
  },
  pharmacy: {
    label: 'Pharmacy / Medical Supply',
    emoji: '💊',
    modules: ['/', '/pos', '/inventory', '/lot-tracking', '/customers', '/suppliers', '/purchase-orders', '/barcode', '/reports', '/accounting', '/tax', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/payroll', '/backorders', '/quotes', '/cash-counter'],
  },
  b2b_wholesale: {
    label: 'B2B Wholesaler',
    emoji: '🏭',
    modules: ['/', '/inventory', '/customers', '/quotes', '/purchase-orders', '/suppliers', '/stock-transfers', '/backorders', '/barcode', '/reports', '/accounting', '/tax', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/pos', '/payroll', '/online-orders', '/lot-tracking', '/cash-counter'],
  },
  distributor: {
    label: 'Distributor / Logistics',
    emoji: '🚚',
    modules: ['/', '/inventory', '/customers', '/quotes', '/purchase-orders', '/suppliers', '/stock-transfers', '/backorders', '/barcode', '/reports', '/accounting', '/tax', '/payroll', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/pos', '/online-orders', '/lot-tracking', '/cash-counter'],
  },
  general_retail: {
    label: 'General Retail',
    emoji: '🏪',
    modules: ['/', '/pos', '/cash-counter', '/inventory', '/customers', '/suppliers', '/purchase-orders', '/barcode', '/reports', '/accounting', '/tax', '/settings', '/subscription', '/ai-guardian'],
    addOns: ['/payroll', '/quotes', '/online-orders', '/lot-tracking', '/backorders'],
  },
  platform_admin: {
    label: 'Platform Admin (All Modules)',
    emoji: '⚙️',
    modules: ['ALL'],
    addOns: [],
  },
};
