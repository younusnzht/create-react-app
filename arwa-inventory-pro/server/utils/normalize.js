// normalize.js — maps each platform's webhook payload to Arwa's internal order schema
// Internal schema:
// {
//   id, platformOrderId, platform, customer, customerPhone, address,
//   items: [{ name, qty, price, notes }],
//   subtotal, tax, total, deliveryFee, tip,
//   status, type, notes, estimatedTime,
//   createdAt, updatedAt
// }

function genId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
}

function normalizeDeliverect(payload) {
  // Deliverect wraps the order from any platform (UE, DD, Skip, etc.)
  const o = payload.order || payload;
  const platform = (o.channelOrderDisplayId || '').toLowerCase().includes('uber') ? 'ubereats'
    : (o.channelOrderDisplayId || '').toLowerCase().includes('door') ? 'doordash'
    : (o.channelOrderDisplayId || '').toLowerCase().includes('skip') ? 'skipthedishes'
    : o.channelType || 'website';

  const items = (o.items || []).map(i => ({
    name:  i.name || i.productName || 'Item',
    qty:   i.quantity || 1,
    price: (i.price || 0) / 100,   // Deliverect uses cents
    notes: (i.subItems || []).map(s => s.name).join(', '),
  }));

  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax       = (o.taxes || 0) / 100;
  const deliveryFee = (o.deliveryCost || 0) / 100;
  const tip       = (o.tip || 0) / 100;

  return {
    id:              genId(),
    platformOrderId: o.channelOrderId || o._id || String(Date.now()),
    platform,
    customer:        o.customer?.name || o.customerName || 'Customer',
    customerPhone:   o.customer?.phoneNumber || '',
    address:         o.deliveryAddress?.formattedAddress || o.deliveryAddress || '',
    items,
    subtotal,
    tax,
    total:           subtotal + tax + deliveryFee + tip,
    deliveryFee,
    tip,
    status:          'new',
    type:            o.orderIsPickUp ? 'pickup' : 'delivery',
    notes:           o.note || o.orderNote || '',
    estimatedTime:   o.expectedDeliveryTime || 30,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
}

function normalizeOtter(payload) {
  const o = payload.order || payload;
  const platformMap = { UBER_EATS: 'ubereats', DOORDASH: 'doordash', SKIP: 'skipthedishes', WEBSITE: 'website' };
  const platform = platformMap[o.source] || 'website';

  const items = (o.lineItems || o.items || []).map(i => ({
    name:  i.name || 'Item',
    qty:   i.quantity || 1,
    price: parseFloat(i.unitPrice || i.price || 0),
    notes: (i.modifiers || []).map(m => m.name).join(', '),
  }));

  const subtotal    = parseFloat(o.subtotal || items.reduce((s, i) => s + i.price * i.qty, 0));
  const tax         = parseFloat(o.tax || 0);
  const deliveryFee = parseFloat(o.deliveryFee || 0);
  const tip         = parseFloat(o.tip || 0);

  return {
    id:              genId(),
    platformOrderId: o.id || o.orderId || String(Date.now()),
    platform,
    customer:        o.customer?.name || o.customerName || 'Customer',
    customerPhone:   o.customer?.phone || '',
    address:         o.deliveryAddress?.address1 || o.address || '',
    items,
    subtotal,
    tax,
    total:           subtotal + tax + deliveryFee + tip,
    deliveryFee,
    tip,
    status:          'new',
    type:            o.fulfillmentType === 'PICKUP' ? 'pickup' : 'delivery',
    notes:           o.specialInstructions || '',
    estimatedTime:   o.estimatedDeliveryTime || 30,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
}

function normalizeDoorDash(payload) {
  const o = payload;
  const items = (o.items || []).map(i => ({
    name:  i.name,
    qty:   i.quantity,
    price: (i.price || 0) / 100,
    notes: (i.options || []).map(opt => opt.name).join(', '),
  }));
  const subtotal    = (o.subtotal || 0) / 100;
  const tax         = (o.tax || 0) / 100;
  const deliveryFee = (o.delivery_fee || 0) / 100;
  const tip         = (o.tip || 0) / 100;

  return {
    id:              genId(),
    platformOrderId: o.id || o.external_delivery_id || String(Date.now()),
    platform:        'doordash',
    customer:        o.customer?.first_name + ' ' + (o.customer?.last_name || ''),
    customerPhone:   o.customer?.phone_number || '',
    address:         o.delivery_address?.street || '',
    items,
    subtotal,
    tax,
    total:           subtotal + tax + deliveryFee + tip,
    deliveryFee,
    tip,
    status:          'new',
    type:            o.order_fulfillment_method === 'PICKUP' ? 'pickup' : 'delivery',
    notes:           o.special_instructions || '',
    estimatedTime:   30,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
}

function normalizeUberEats(payload) {
  const o = payload.order || payload;
  const items = (o.cart?.items || []).map(i => ({
    name:  i.title || i.name,
    qty:   i.quantity,
    price: (i.price?.unit_price?.amount || 0) / 100,
    notes: (i.customizations || []).flatMap(c => c.customization_items || []).map(c => c.title).join(', '),
  }));
  const subtotal    = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax         = (o.payment?.charges?.tax?.total_charge?.amount || 0) / 100;
  const deliveryFee = (o.payment?.charges?.delivery?.unit_price?.amount || 0) / 100;
  const tip         = (o.payment?.charges?.gratuity?.amount || 0) / 100;

  return {
    id:              genId(),
    platformOrderId: o.id || String(Date.now()),
    platform:        'ubereats',
    customer:        o.eater?.first_name + ' ' + (o.eater?.last_name || ''),
    customerPhone:   o.eater?.phone || '',
    address:         o.delivery?.location?.address?.formatted_address || '',
    items,
    subtotal,
    tax,
    total:           subtotal + tax + deliveryFee + tip,
    deliveryFee,
    tip,
    status:          'new',
    type:            o.type === 'PICK_UP' ? 'pickup' : 'delivery',
    notes:           o.special_instructions || '',
    estimatedTime:   30,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
}

// Simulate a realistic demo order (used for testing without a real aggregator)
const DEMO_NAMES     = ['Ahmed Hassan', 'Sarah Johnson', 'Mike Chen', 'Priya Sharma', 'Carlos Rivera', 'Emma Williams', 'John Smith', 'Linda Wong'];
const DEMO_ITEMS     = [
  { name: 'Chicken Tikka Masala', price: 14.99 },
  { name: 'Beef Burger Combo', price: 12.49 },
  { name: 'Veggie Wrap', price: 9.99 },
  { name: 'Pepperoni Pizza (12")', price: 16.99 },
  { name: 'Caesar Salad', price: 8.49 },
  { name: 'Fish & Chips', price: 13.99 },
  { name: 'Chocolate Lava Cake', price: 6.99 },
  { name: 'Mango Lassi', price: 4.49 },
];
const DEMO_PLATFORMS = ['ubereats', 'doordash', 'skipthedishes', 'website'];
const DEMO_ADDRESSES = ['123 Main St', '456 Oak Ave', '789 Maple Dr', '321 Pine Rd'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function generateDemoOrder() {
  const itemCount = Math.floor(Math.random() * 3) + 1;
  const items = Array.from({ length: itemCount }, () => {
    const base = pick(DEMO_ITEMS);
    return { ...base, qty: Math.floor(Math.random() * 2) + 1, notes: '' };
  });
  const subtotal    = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax         = parseFloat((subtotal * 0.13).toFixed(2));
  const deliveryFee = parseFloat((Math.random() * 3 + 1.99).toFixed(2));
  const tip         = parseFloat((subtotal * (Math.random() * 0.15)).toFixed(2));
  return {
    id:              genId(),
    platformOrderId: 'DEMO-' + Date.now().toString(36).toUpperCase(),
    platform:        pick(DEMO_PLATFORMS),
    customer:        pick(DEMO_NAMES),
    customerPhone:   '+1-555-' + Math.floor(1000 + Math.random() * 9000),
    address:         pick(DEMO_ADDRESSES),
    items,
    subtotal:        parseFloat(subtotal.toFixed(2)),
    tax,
    total:           parseFloat((subtotal + tax + deliveryFee + tip).toFixed(2)),
    deliveryFee,
    tip,
    status:          'new',
    type:            Math.random() > 0.3 ? 'delivery' : 'pickup',
    notes:           '',
    estimatedTime:   Math.floor(Math.random() * 20) + 20,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
}

module.exports = { normalizeDeliverect, normalizeOtter, normalizeDoorDash, normalizeUberEats, generateDemoOrder };
