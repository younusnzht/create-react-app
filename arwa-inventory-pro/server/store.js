// store.js — in-memory order store with basic CRUD
// In production, replace with a real database (MongoDB, PostgreSQL, etc.)

const orders = new Map();

function add(order) {
  orders.set(order.id, order);
  return order;
}

function getAll() {
  return Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function getById(id) {
  return orders.get(id) || null;
}

function updateStatus(id, status) {
  const order = orders.get(id);
  if (!order) return null;
  const updated = { ...order, status, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  return updated;
}

function remove(id) {
  const order = orders.get(id);
  if (!order) return null;
  orders.delete(id);
  return order;
}

function count() {
  return orders.size;
}

module.exports = { add, getAll, getById, updateStatus, remove, count };
