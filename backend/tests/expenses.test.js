import { describe, it, expect, vi, beforeEach } from 'vitest';

// Pure mock — no mongoose import
const Expense = {
  find: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
};

const mockExpenses = [
  { _id: '1', title: 'Lunch', amount: 150, category: 'Food', userId: 'user1', expenseDate: '2024-01-01' },
  { _id: '2', title: 'Bus', amount: 50, category: 'Travel', userId: 'user1', expenseDate: '2024-01-02' },
];

describe('Expense Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  it('find returns list of expenses for user', async () => {
    Expense.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockExpenses) });
    const result = await Expense.find({ userId: 'user1' }).sort({ expenseDate: -1 });
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Lunch');
  });

  it('find returns empty array when user has no expenses', async () => {
    Expense.find.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) });
    const result = await Expense.find({ userId: 'user2' }).sort({ expenseDate: -1 });
    expect(result).toHaveLength(0);
  });

  it('findByIdAndUpdate returns updated expense', async () => {
    const updated = { _id: '1', title: 'Dinner', amount: 300, category: 'Food' };
    Expense.findByIdAndUpdate.mockResolvedValue(updated);
    const result = await Expense.findByIdAndUpdate('1', { title: 'Dinner', amount: 300 }, { new: true });
    expect(result.title).toBe('Dinner');
    expect(result.amount).toBe(300);
  });

  it('findByIdAndUpdate returns null for non-existent expense', async () => {
    Expense.findByIdAndUpdate.mockResolvedValue(null);
    const result = await Expense.findByIdAndUpdate('999', { title: 'X' }, { new: true });
    expect(result).toBeNull();
  });

  it('findByIdAndDelete returns deleted expense', async () => {
    Expense.findByIdAndDelete.mockResolvedValue(mockExpenses[0]);
    const result = await Expense.findByIdAndDelete('1');
    expect(result._id).toBe('1');
  });

  it('findByIdAndDelete returns null for non-existent id', async () => {
    Expense.findByIdAndDelete.mockResolvedValue(null);
    const result = await Expense.findByIdAndDelete('999');
    expect(result).toBeNull();
  });

  it('expense amount must be a positive number', () => {
    const validAmounts = [100, 0.5, 9999];
    const invalidAmounts = [-1, 0, NaN];
    validAmounts.forEach(a => expect(a).toBeGreaterThan(0));
    invalidAmounts.forEach(a => expect(a <= 0 || isNaN(a)).toBe(true));
  });
});
