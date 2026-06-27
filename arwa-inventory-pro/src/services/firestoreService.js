import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { firebaseApp } from './firebase';

let db = null;

function getDB() {
  if (!db) {
    try { db = getFirestore(firebaseApp); } catch { return null; }
  }
  return db;
}

export async function submitB2BOrder(clientCode, order) {
  const database = getDB();
  if (!database) throw new Error('Firestore not available — please enable Firestore in the Firebase console for project arwa-001.');
  const ref = collection(database, 'b2b_orders', String(clientCode), 'orders');
  const docRef = await addDoc(ref, {
    ...order,
    status: 'pending',
    source: 'b2b_portal',
    submittedAt: Timestamp.now(),
  });
  return docRef.id;
}

export function listenB2BOrders(clientCode, callback) {
  const database = getDB();
  if (!database) return () => {};
  try {
    const q = query(
      collection(database, 'b2b_orders', String(clientCode), 'orders'),
      orderBy('submittedAt', 'desc')
    );
    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(d => ({
        firestoreId: d.id,
        ...d.data(),
        submittedAt: d.data().submittedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      callback(orders);
    }, () => {});
  } catch { return () => {}; }
}
