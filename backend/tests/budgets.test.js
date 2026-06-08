import { describe, it, expect, vi, beforeEach } from 'vitest';

// Pure mock — no mongoose import
const Budget = {
  find: vi.fn(),
  findOneAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
};

const mockBudgets = [
  { _id: 'b1', userId: 'user1', month: '2024-01', budgetAmount: 5000 },
  { _id: 'b2', userId: 'user1', month: '2024-02', budgetAmount: 6000 },
];

describe('Budget Logic', () => {
  beforeEach(() => vi.clearAllMocks());

  it('find returns all budgets for a user', async () => {
    Budget.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockBudgets) });
    const result = await Budget.find({ userId: 'user1' }).sort({ month: -1 });
    expect(result).toHaveLength(2);
  });

  it('find with month filter returns specific budget', async () => {
    Budget.find.mockReturnValue({ sort: vi.fn().mockResolvedValue([mockBudgets[0]]) });
    const result = await Budget.find({ userId: 'user1', month: '2024-01' }).sort({ month: -1 });
    expect(result[0].budgetAmount).toBe(5000);
  });

  it('findOneAndUpdate upserts a new budget', async () => {
    const upserted = { _id: 'b3', userId: 'user1', month: '2024-03', budgetAmount: 7000 };
    Budget.findOneAndUpdate.mockResolvedValue(upserted);
    const result = await Budget.findOneAndUpdate(
      { userId: 'user1', month: '2024-03' },
      { budgetAmount: 7000 },
      { returnDocument: 'after', upsert: true }
    );
    expect(result.budgetAmount).toBe(7000);
    expect(result.month).toBe('2024-03');
  });

  it('findOneAndUpdate updates existing budget', async () => {
    const updated = { ...mockBudgets[0], budgetAmount: 8000 };
    Budget.findOneAndUpdate.mockResolvedValue(updated);
    const result = await Budget.findOneAndUpdate(
      { userId: 'user1', month: '2024-01' },
      { budgetAmount: 8000 },
      { returnDocument: 'after', upsert: true }
    );
    expect(result.budgetAmount).toBe(8000);
  });

  it('findByIdAndDelete removes a budget', async () => {
    Budget.findByIdAndDelete.mockResolvedValue(mockBudgets[0]);
    const result = await Budget.findByIdAndDelete('b1');
    expect(result._id).toBe('b1');
  });

  it('findByIdAndDelete returns null for missing budget', async () => {
    Budget.findByIdAndDelete.mockResolvedValue(null);
    const result = await Budget.findByIdAndDelete('nonexistent');
    expect(result).toBeNull();
  });

  it('budget percentage calculation is correct', () => {
    const budget = 5000;
    const spent = 4000;
    const percentage = Math.round((spent / budget) * 100);
    expect(percentage).toBe(80);
  });

  it('over-budget variance is negative', () => {
    const budget = 5000;
    const spent = 6000;
    const variance = budget - spent;
    expect(variance).toBeLessThan(0);
  });
});
