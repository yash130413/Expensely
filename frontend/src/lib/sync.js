import { expensesApi, budgetsApi } from './api';
import {
  getSyncQueue,
  removeSyncQueueItem,
  saveLocalExpenses,
  saveLocalBudgets,
  getLocalExpenses,
  getLocalBudgets,
} from './db';

// Sync pending offline actions to the server
export async function syncPendingActions() {
  const queue = await getSyncQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const { type, payload } = item;

      if (type === 'CREATE_EXPENSE') await expensesApi.create(payload);
      else if (type === 'UPDATE_EXPENSE') await expensesApi.update(payload._id, payload);
      else if (type === 'DELETE_EXPENSE') await expensesApi.delete(payload._id);
      else if (type === 'CREATE_BUDGET') await budgetsApi.upsert(payload);
      else if (type === 'DELETE_BUDGET') await budgetsApi.delete(payload._id);

      await removeSyncQueueItem(item.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

// Pull latest data from server and cache locally
export async function syncFromServer() {
  try {
    const [expenses, budgets] = await Promise.all([
      expensesApi.getAll(),
      budgetsApi.get(),
    ]);
    await saveLocalExpenses(expenses);
    await saveLocalBudgets(budgets);
    return true;
  } catch {
    return false;
  }
}

// Full sync: push pending then pull fresh data
export async function fullSync() {
  const pushResult = await syncPendingActions();
  const pulled = await syncFromServer();
  return { ...pushResult, pulled };
}

// Listen for online event and auto-sync
export function registerOnlineSync(onSyncComplete) {
  const handler = async () => {
    const result = await fullSync();
    if (onSyncComplete) onSyncComplete(result);
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

export function isOnline() {
  return navigator.onLine;
}
