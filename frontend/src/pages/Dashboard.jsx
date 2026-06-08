import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { expensesApi, budgetsApi } from '../lib/api';
import { IndianRupee, TrendingUp, AlertCircle, Edit2, ScanLine } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Current month string YYYY-MM
  const currentMonth = new Date().toISOString().substring(0, 7);

  // Fetch Expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getAll(),
    enabled: !!currentUser
  });

  // Fetch Budget for current month
  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', currentMonth],
    queryFn: () => budgetsApi.get(currentMonth),
    enabled: !!currentUser
  });

  const currentBudget = budgets.length > 0 ? budgets[0].budgetAmount : 0;

  // Calculate current month expenses
  const currentMonthExpenses = expenses.filter(exp => 
    exp.expenseDate.startsWith(currentMonth)
  ).reduce((sum, exp) => sum + exp.amount, 0);

  const budgetUsedPercentage = currentBudget > 0 
    ? Math.min(Math.round((currentMonthExpenses / currentBudget) * 100), 100) 
    : 0;

  // Set Budget Mutation
  const setBudgetMutation = useMutation({
    mutationFn: (amount) => budgetsApi.upsert({ month: currentMonth, budgetAmount: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
    }
  });

  const handleSetBudget = () => {
    const amountStr = window.prompt("Enter your budget for this month (₹):", currentBudget || "");
    if (amountStr !== null) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0) {
        setBudgetMutation.mutate(amount);
      }
    }
  };

  // Create Expense Mutation
  const createMutation = useMutation({
    mutationFn: (newExpense) => expensesApi.create({ ...newExpense, userId: currentUser.uid }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setIsExpenseModalOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser?.displayName?.split(' ')[0] || 'User'}! 👋
        </h1>
        <div className="flex items-center space-x-2">
          <Link
            to="/scan"
            className="flex items-center border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <ScanLine className="h-4 w-4 mr-2" />
            Scan Receipt
          </Link>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            + New Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Month's Expenses</p>
            <p className="text-2xl font-bold text-gray-900">₹{currentMonthExpenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Monthly Budget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center relative group">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl mr-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Monthly Budget</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-gray-900">₹{currentBudget.toFixed(2)}</p>
              <button onClick={handleSetBudget} className="ml-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {currentBudget === 0 && (
            <button onClick={handleSetBudget} className="absolute right-4 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">
              Set Budget
            </button>
          )}
        </div>

        {/* Budget Used */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className={`p-3 rounded-xl mr-4 ${budgetUsedPercentage >= 80 ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <p className="text-sm font-medium text-gray-500">Budget Used</p>
              <p className={`text-lg font-bold ${budgetUsedPercentage >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                {budgetUsedPercentage}%
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${budgetUsedPercentage >= 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${budgetUsedPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
        {expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No expenses yet. Snap a receipt to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.slice(0, 5).map(exp => (
              <div key={exp._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  <p className="text-xs text-gray-500">{new Date(exp.expenseDate).toLocaleDateString()} • {exp.category}</p>
                </div>
                <p className="font-bold text-gray-900">₹{exp.amount.toFixed(2)}</p>
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
