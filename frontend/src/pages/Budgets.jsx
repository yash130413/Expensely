import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { budgetsApi, expensesApi } from '../lib/api';
import { Wallet, Plus, Pencil, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

export default function Budgets() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.get(),
    enabled: !!currentUser
  });

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
    enabled: !!currentUser
  });

  const setBudgetMutation = useMutation({
    mutationFn: ({ month, amount }) => budgetsApi.upsert({ month, budgetAmount: amount }),
    onSuccess: () => queryClient.invalidateQueries(['budgets'])
  });

  const handleSetBudget = (month, currentAmount) => {
    const label = new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    const amountStr = window.prompt(`Enter budget for ${label} (₹):`, currentAmount || '');
    if (amountStr !== null) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0) setBudgetMutation.mutate({ month, amount });
    }
  };

  const historyData = useMemo(() => {
    const monthsMap = {};
    budgets.forEach(b => { monthsMap[b.month] = { month: b.month, budget: b.budgetAmount, spent: 0 }; });
    expenses.forEach(exp => {
      const m = exp.expenseDate.substring(0, 7);
      if (!monthsMap[m]) monthsMap[m] = { month: m, budget: 0, spent: 0 };
      monthsMap[m].spent += exp.amount;
    });
    return Object.values(monthsMap).sort((a, b) => b.month.localeCompare(a.month));
  }, [budgets, expenses]);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentData = historyData.find(d => d.month === currentMonth);
  const totalBudgeted = historyData.filter(d => d.budget > 0).reduce((s, d) => s + d.budget, 0);
  const totalSpent = historyData.reduce((s, d) => s + d.spent, 0);

  if (loadingBudgets || loadingExpenses) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage your monthly spending limits</p>
        </div>
        <button
          onClick={() => handleSetBudget(currentMonth, currentData?.budget || 0)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
        >
          <Plus className="h-4 w-4" /> Set Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-100">
          <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-3">This Month Budget</p>
          <p className="text-2xl font-bold">{currentData?.budget > 0 ? `₹${currentData.budget.toLocaleString('en-IN')}` : '—'}</p>
          <p className="text-blue-200 text-xs mt-1">{currentData?.budget > 0 ? 'Monthly limit set' : 'No budget set yet'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">This Month Spent</p>
          <p className="text-2xl font-bold text-gray-900">₹{(currentData?.spent || 0).toLocaleString('en-IN')}</p>
          <p className="text-gray-400 text-xs mt-1">
            {currentData?.budget > 0
              ? `${Math.round((currentData.spent / currentData.budget) * 100)}% of budget used`
              : 'Set a budget to track'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">All Time Spent</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</p>
          <p className="text-gray-400 text-xs mt-1">{historyData.length} months tracked</p>
        </div>
      </div>

      {/* Budget Cards */}
      {historyData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-900 font-semibold">No budget history yet</p>
          <p className="text-gray-400 text-sm mt-1">Set a budget to start tracking your finances</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyData.map((data) => {
            const variance = data.budget - data.spent;
            const isOver = variance < 0 && data.budget > 0;
            const pct = data.budget > 0 ? Math.min((data.spent / data.budget) * 100, 100) : 0;
            const monthLabel = new Date(data.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
            const isCurrentMonth = data.month === currentMonth;

            return (
              <div key={data.month} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${isCurrentMonth ? 'border-blue-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{monthLabel}</p>
                    {isCurrentMonth && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                  </div>
                  <button
                    onClick={() => handleSetBudget(data.month, data.budget)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Budget</p>
                    <p className="font-bold text-gray-900">{data.budget > 0 ? `₹${data.budget.toLocaleString('en-IN')}` : <span className="text-gray-300">Not set</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Spent</p>
                    <p className="font-bold text-gray-900">₹{data.spent.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Variance</p>
                    {data.budget > 0 ? (
                      <p className={`font-bold flex items-center gap-1 ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                        {isOver ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        ₹{Math.abs(variance).toLocaleString('en-IN')}
                      </p>
                    ) : <span className="text-gray-300 font-bold">—</span>}
                  </div>
                </div>

                {data.budget > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{Math.round(pct)}% used</span>
                      {!isOver && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" />Under budget</span>}
                      {isOver && <span className="text-red-600">Over budget</span>}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-orange-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
