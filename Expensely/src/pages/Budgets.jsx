import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { budgetsApi, expensesApi } from '../lib/api';
import { Edit2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export default function Budgets() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all budgets
  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.get(), // No month specified gets all
    enabled: !!currentUser
  });

  // Fetch all expenses to calculate past actuals
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
    enabled: !!currentUser
  });

  // Set Budget Mutation
  const setBudgetMutation = useMutation({
    mutationFn: ({ month, amount }) => budgetsApi.upsert({ month, budgetAmount: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
    }
  });

  const handleSetBudget = (month, currentAmount) => {
    const amountStr = window.prompt(`Enter budget for ${month} (₹):`, currentAmount || "");
    if (amountStr !== null) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0) {
        setBudgetMutation.mutate({ month, amount });
      }
    }
  };

  // Process data to merge Budgets and Expenses by Month
  const historyData = useMemo(() => {
    const monthsMap = {};

    // Map budgets
    budgets.forEach(b => {
      monthsMap[b.month] = {
        month: b.month,
        budget: b.budgetAmount,
        spent: 0
      };
    });

    // Map expenses
    expenses.forEach(exp => {
      const monthStr = exp.expenseDate.substring(0, 7); // YYYY-MM
      if (!monthsMap[monthStr]) {
        monthsMap[monthStr] = { month: monthStr, budget: 0, spent: 0 };
      }
      monthsMap[monthStr].spent += exp.amount;
    });

    // Convert to array and sort descending (newest first)
    return Object.values(monthsMap).sort((a, b) => b.month.localeCompare(a.month));
  }, [budgets, expenses]);

  if (loadingBudgets || loadingExpenses) {
    return <div className="p-8 text-center text-gray-500">Loading budget history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <button 
          onClick={() => handleSetBudget(new Date().toISOString().substring(0, 7), 0)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Set New Budget
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {historyData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No budget history found</p>
            <p className="mt-1">Set a budget to start tracking your financial discipline!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Month</th>
                  <th className="px-6 py-4 font-medium">Budget Limit</th>
                  <th className="px-6 py-4 font-medium">Actual Spent</th>
                  <th className="px-6 py-4 font-medium">Variance</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyData.map((data) => {
                  const variance = data.budget - data.spent;
                  const isOverBudget = variance < 0 && data.budget > 0;
                  const percentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
                  const dateObj = new Date(data.month + "-01");
                  const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

                  return (
                    <tr key={data.month} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {monthName}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {data.budget > 0 ? `₹${data.budget.toFixed(2)}` : <span className="text-gray-400">Not set</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₹{data.spent.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {data.budget > 0 ? (
                          <span className={`flex items-center ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                            ₹{Math.abs(variance).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {data.budget > 0 ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : (percentage > 80 ? 'bg-orange-500' : 'bg-green-500')}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500">{Math.round(percentage)}%</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleSetBudget(data.month, data.budget)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Budget"
                        >
                          <Edit2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
