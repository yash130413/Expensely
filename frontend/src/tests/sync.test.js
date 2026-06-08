import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  expensesApi: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), getAll: vi.fn() },
  budgetsApi: { upsert: vi.fn(), delete: vi.fn(), get: vi.fn() },
  getSyncQueue: vi.fn(),
  removeSyncQueueItem: vi.fn(),
  saveLocalExpenses: vi.fn(),
  saveLocalBudgets: vi.fn(),
  getLocalExpenses: vi.fn(),
  getLocalBudgets: vi.fn(),
}));

vi.mock('/c:/Expensely/Expensely/src/lib/api.js', () => ({
  expensesApi: mocks.expensesApi,
  budgetsApi: mocks.budgetsApi,
}));

vi.mock('/c:/Expensely/Expensely/src/lib/db.js', () => ({
  getSyncQueue: mocks.getSyncQueue,
  removeSyncQueueItem: mocks.removeSyncQueueItem,
  saveLocalExpenses: mocks.saveLocalExpenses,
  saveLocalBudgets: mocks.saveLocalBudgets,
  getLocalExpenses: mocks.getLocalExpenses,
  getLocalBudgets: mocks.getLocalBudgets,
}));

import { expensesApi, budgetsApi } from '../lib/api';
import { getSyncQueue, removeSyncQueueItem, saveLocalExpenses, saveLocalBudgets } from '../lib/db';
import { syncPendingActions, syncFromServer, isOnline } from '../lib/sync';

describe('Sync Utilities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('syncPendingActions returns 0 synced when queue is empty', async () => {
    mocks.getSyncQueue.mockResolvedValue([]);
    const result = await syncPendingActions();
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('syncPendingActions processes CREATE_EXPENSE action', async () => {
    mocks.getSyncQueue.mockResolvedValue([{ id: 1, type: 'CREATE_EXPENSE', payload: { title: 'Test', amount: 100 } }]);
    mocks.expensesApi.create.mockResolvedValue({ _id: 'abc' });
    mocks.removeSyncQueueItem.mockResolvedValue();
    const result = await syncPendingActions();
    expect(mocks.expensesApi.create).toHaveBeenCalledWith({ title: 'Test', amount: 100 });
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('syncPendingActions processes DELETE_EXPENSE action', async () => {
    mocks.getSyncQueue.mockResolvedValue([{ id: 2, type: 'DELETE_EXPENSE', payload: { _id: 'exp1' } }]);
    mocks.expensesApi.delete.mockResolvedValue({});
    mocks.removeSyncQueueItem.mockResolvedValue();
    const result = await syncPendingActions();
    expect(mocks.expensesApi.delete).toHaveBeenCalledWith('exp1');
    expect(result.synced).toBe(1);
  });

  it('syncPendingActions counts failed when API throws', async () => {
    mocks.getSyncQueue.mockResolvedValue([{ id: 3, type: 'CREATE_EXPENSE', payload: {} }]);
    mocks.expensesApi.create.mockRejectedValue(new Error('Network Error'));
    const result = await syncPendingActions();
    expect(result.failed).toBe(1);
    expect(result.synced).toBe(0);
  });

  it('syncFromServer saves expenses and budgets locally', async () => {
    mocks.expensesApi.getAll.mockResolvedValue([{ _id: '1', title: 'Food', amount: 100 }]);
    mocks.budgetsApi.get.mockResolvedValue([{ _id: 'b1', budgetAmount: 5000 }]);
    mocks.saveLocalExpenses.mockResolvedValue();
    mocks.saveLocalBudgets.mockResolvedValue();
    const result = await syncFromServer();
    expect(result).toBe(true);
    expect(mocks.saveLocalExpenses).toHaveBeenCalled();
    expect(mocks.saveLocalBudgets).toHaveBeenCalled();
  });

  it('syncFromServer returns false on network failure', async () => {
    mocks.expensesApi.getAll.mockRejectedValue(new Error('Network Error'));
    const result = await syncFromServer();
    expect(result).toBe(false);
  });

  it('isOnline returns a boolean', () => {
    expect(typeof isOnline()).toBe('boolean');
  });
});
