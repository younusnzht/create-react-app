import Dexie from 'dexie';

const db = new Dexie('ArwaInventoryProDB');
db.version(1).stores({
  keyval: 'key'  // simple key-value store: { key: 'arwa_products', value: '[...]' }
});

export async function dbSet(key, value) {
  try {
    await db.keyval.put({ key, value: JSON.stringify(value) });
  } catch (e) {
    // IndexedDB unavailable (private mode, etc.) — silently fail
  }
}

export async function dbGet(key) {
  try {
    const record = await db.keyval.get(key);
    return record ? JSON.parse(record.value) : null;
  } catch (e) {
    return null;
  }
}

export async function dbGetAll() {
  try {
    const all = await db.keyval.toArray();
    return all.reduce((acc, row) => {
      try { acc[row.key] = JSON.parse(row.value); } catch(e) {}
      return acc;
    }, {});
  } catch (e) {
    return {};
  }
}

export async function dbSetMany(pairs) {
  try {
    await db.keyval.bulkPut(pairs.map(([key, value]) => ({ key, value: JSON.stringify(value) })));
  } catch (e) {}
}

export default db;
