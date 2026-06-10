import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { expensesApi, budgetsApi } from '../lib/api';
import { IndianRupee, TrendingUp, Target, ScanLine, Plus, ArrowRight, Pencil } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal';

const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-700',
  Travel: 'bg-blue-100 text-blue-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Utilities: 'bg-yellow-100 text-yellow-700',
  Healthcare: 'bg-green-100 text-green-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Education: 'bg-indigo-100 text-indigo-700',
  Rent: 'bg-red-100 text-red-700',
  Miscellaneous: 'bg-gray-100 text-gray-700',
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
    enabled: !!currentUser
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', currentMonth],
    queryFn: () => budgetsApi.get(currentMonth),
    enabled: !!currentUser
  });

  const currentBudget = budgets.length > 0 ? budgets[0].budgetAmount : 0;
  const currentMonthExpenses = expenses
    .filter(exp => exp.expenseDate.startsWith(currentMonth))
    .reduce((sum, exp) => sum + exp.amount, 0);
  const budgetUsedPercentage = currentBudget > 0
    ? Math.min(Math.round((currentMonthExpenses / currentBudget) * 100), 100) : 0;
  const remaining = currentBudget - currentMonthExpenses;

  const setBudgetMutation = useMutation({
    mutationFn: (amount) => budgetsApi.upsert({ month: currentMonth, budgetAmount: amount }),
    onSuccess: () => queryClient.invalidateQueries(['budgets'])
  });

  const handleSetBudget = () => {
    const amountStr = window.prompt('Enter your budget for this month (₹):', currentBudget || '');
    if (amountStr !== null) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0) setBudgetMutation.mutate(amount);
    }
  };

  const createMutation = useMutation({
    mutationFn: (newExpense) => expensesApi.create({ ...newExpense, userId: currentUser.uid }),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); setIsExpenseModalOpen(false); }
  });

  const firstName = currentUser?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}! 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/scan" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-all">
            <ScanLine className="h-4 w-4" /> Scan Receipt
          </Link>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
            <Plus className="h-4 w-4" /> New Expense
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Month Expenses */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-blue-100 text-sm font-medium">Month's Expenses</p>
            <div className="bg-white/20 p-2 rounded-lg">
              <IndianRupee className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold">₹{currentMonthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
          <p className="text-blue-200 text-xs mt-2">{expenses.filter(e => e.expenseDate.startsWith(currentMonth)).length} transactions this month</p>
        </div>

        {/* Monthly Budget */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm group">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Monthly Budget</p>
            <button onClick={handleSetBudget} className="bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors">
              {currentBudget > 0 ? <Pencil className="h-4 w-4 text-green-600" /> : <Plus className="h-4 w-4 text-green-600" />}
            </button>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currentBudget > 0 ? `₹${currentBudget.toLocaleString('en-IN')}` : <span className="text-gray-400 text-xl">Not set</span>}
          </p>
          {currentBudget > 0 && remaining >= 0 && (
            <p className="text-green-600 text-xs mt-2 font-medium">₹{remaining.toLocaleString('en-IN')} remaining</p>
          )}
          {currentBudget > 0 && remaining < 0 && (
            <p className="text-red-500 text-xs mt-2 font-medium">₹{Math.abs(remaining).toLocaleString('en-IN')} over budget</p>
          )}
        </div>

        {/* Budget Used */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Budget Used</p>
            <div className={`p-2 rounded-lg ${budgetUsedPercentage >= 80 ? 'bg-red-50' : 'bg-orange-50'}`}>
              <Target className={`h-4 w-4 ${budgetUsedPercentage >= 80 ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${budgetUsedPercentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
            {budgetUsedPercentage}%
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${budgetUsedPercentage >= 80 ? 'bg-red-500' : budgetUsedPercentage >= 60 ? 'bg-orange-400' : 'bg-blue-500'}`}
              style={{ width: `${budgetUsedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
          <Link to="/expenses" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {expenses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium">No expenses yet</p>
            <p className="text-gray-400 text-sm mt-1">Snap a receipt or add manually to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.slice(0, 6).map(exp => (
              <div key={exp._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                    <p className="text-xs text-gray-400">{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[exp.category] || 'bg-gray-100 text-gray-600'}`}>
                    {exp.category}
                  </span>
                  <p className="text-sm font-bold text-gray-900 min-w-[80px] text-right">₹{exp.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={(data) => createMutation.mutate(data)}
        initialData={null}
      />
    </div>
  );
}
