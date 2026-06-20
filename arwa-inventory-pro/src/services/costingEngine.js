// FIFO, Average Cost, ABC Analysis, Dead Stock utilities

export function calcAverageCost(lots = []) {
  const totalQty  = lots.reduce((s, l) => s + (l.qty  || 0), 0);
  const totalCost = lots.reduce((s, l) => s + (l.qty  || 0) * (l.unitCost || 0), 0);
  return totalQty > 0 ? totalCost / totalQty : 0;
}

export function calcFIFOCost(lots = [], qtySold) {
  const sorted = [...lots].sort((a, b) => new Date(a.receivedDate || 0) - new Date(b.receivedDate || 0));
  let remaining  = qtySold;
  let totalCost  = 0;
  for (const lot of sorted) {
    if (remaining <= 0) break;
    const consume  = Math.min(remaining, lot.qty || 0);
    totalCost     += consume * (lot.unitCost || 0);
    remaining     -= consume;
  }
  return totalCost;
}

export function calcRealCOGS(orders = [], products = []) {
  return orders.reduce((total, order) => {
    const items = order.items || order.cart || [];
    return total + items.reduce((s, item) => {
      const product = products.find(p =>
        String(p.id) === String(item.productId || item.id) ||
        p.name?.toLowerCase() === item.name?.toLowerCase()
      );
      const cost    = product?.purchasePrice || product?.costPrice || (product?.price || 0) * 0.6;
      const qty     = item.qty || item.quantity || 1;
      return s + cost * qty;
    }, 0);
  }, 0);
}

export function classifyABC(products = [], orders = []) {
  // Sum revenue per product from order history
  const rev = {};
  orders.forEach(order => {
    const items = order.items || order.cart || [];
    items.forEach(item => {
      const pid = String(item.productId || item.id || '');
      const product = products.find(p => String(p.id) === pid || p.name?.toLowerCase() === item.name?.toLowerCase());
      if (!product) return;
      const key = String(product.id);
      rev[key] = (rev[key] || 0) + (item.qty || item.quantity || 1) * (item.price || product.price || 0);
    });
  });
  const sorted = products
    .map(p => ({ ...p, revenue: rev[String(p.id)] || 0 }))
    .sort((a, b) => b.revenue - a.revenue);
  const total = sorted.reduce((s, p) => s + p.revenue, 0);
  let cumulative = 0;
  return sorted.map(p => {
    cumulative += p.revenue;
    const pct = total > 0 ? cumulative / total : 1;
    return { ...p, abcClass: pct <= 0.80 ? 'A' : pct <= 0.95 ? 'B' : 'C', revenuePct: total > 0 ? p.revenue / total : 0 };
  });
}

export function findDeadStock(products = [], stockMovements = [], days = 60) {
  const cutoff = new Date(Date.now() - days * 86400000);
  return products
    .filter(p => (p.stock || 0) > 0)
    .map(p => {
      const moves = stockMovements
        .filter(m => String(m.productId) === String(p.id))
        .sort((a, b) => new Date(b.time || b.date) - new Date(a.time || a.date));
      const lastMove = moves[0];
      const lastMoveDate = lastMove ? new Date(lastMove.time || lastMove.date) : null;
      const daysSinceMove = lastMoveDate
        ? Math.floor((Date.now() - lastMoveDate.getTime()) / 86400000)
        : 999;
      return { ...p, lastMoveDate, daysSinceMove, isDeadStock: !lastMoveDate || lastMoveDate < cutoff };
    })
    .filter(p => p.isDeadStock)
    .sort((a, b) => b.daysSinceMove - a.daysSinceMove);
}

export function calcReorderAnalysis(products = [], orders = [], days = 30) {
  const cutoff = new Date(Date.now() - days * 86400000);
  const sold = {};
  orders.filter(o => new Date(o.date) > cutoff).forEach(order => {
    const items = order.items || order.cart || [];
    items.forEach(item => {
      const pid = String(item.productId || item.id || '');
      const product = products.find(p => String(p.id) === pid || p.name?.toLowerCase() === item.name?.toLowerCase());
      if (!product) return;
      sold[String(product.id)] = (sold[String(product.id)] || 0) + (item.qty || item.quantity || 1);
    });
  });
  return products
    .filter(p => (p.stock || 0) <= (p.minStock || 0) + 5)
    .map(p => {
      const soldLast30 = sold[String(p.id)] || 0;
      const dailyVelocity = soldLast30 / days;
      const daysUntilStockout = dailyVelocity > 0 ? Math.floor((p.stock || 0) / dailyVelocity) : null;
      const suggestedReorder = Math.max(soldLast30 * 2, (p.minStock || 10) * 2);
      return { ...p, soldLast30, dailyVelocity, daysUntilStockout, suggestedReorder };
    })
    .sort((a, b) => (a.daysUntilStockout ?? 999) - (b.daysUntilStockout ?? 999));
}
