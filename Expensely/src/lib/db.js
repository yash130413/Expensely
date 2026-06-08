import { openDB } from 'idb';

const DB_NAME = 'expensely-db';
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: '_id' });
        expenseStore.createIndex('userId', 'userId');
        expenseStore.createIndex('expenseDate', 'expenseDate');
      }

      // Budgets store
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: '_id' });
      }

      // Pending sync queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getLocalExpenses() {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function saveLocalExpenses(expenses) {
  const db = await getDB();
  const tx = db.transaction('expenses', 'readwrite');
  await Promise.all([...expenses.map(e => tx.store.put(e)), tx.done]);
}

export async function addLocalExpense(expense) {
  const db = await getDB();
  await db.put('expenses', expense);
}

export async function updateLocalExpense(expense) {
  const db = await getDB();
  await db.put('expenses', expense);
}

export async function deleteLocalExpense(id) {
  const db = await getDB();
  await db.delete('expenses', id);
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export async function getLocalBudgets() {
  const db = await getDB();
  return db.getAll('budgets');
}

export async function saveLocalBudgets(budgets) {
  const db = await getDB();
  const tx = db.transaction('budgets', 'readwrite');
  await Promise.all([...budgets.map(b => tx.store.put(b)), tx.done]);
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export async function addToSyncQueue(action) {
  const db = await getDB();
  await db.add('syncQueue', { ...action, timestamp: Date.now() });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function removeSyncQueueItem(id) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearSyncQueue() {
  const db = await getDB();
  await db.clear('syncQueue');
}
