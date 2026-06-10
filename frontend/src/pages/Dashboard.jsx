import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { expensesApi, budgetsApi } from '../lib/api';
import { IndianRupee, TrendingUp, Target, ScanLine, Plus, ArrowRight, Pencil, ShoppingBag, Utensils, Car, Zap, Heart, Tv, BookOpen, Home, MoreHorizontal } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal';

const CATEGORY_CONFIG = {
  Food:          { color: 'bg-orange-500',  light: 'bg-orange-50 text-orange-700 border-orange-100',   icon: Utensils },
  Travel:        { color: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700 border-blue-100',         icon: Car },
  Shopping:      { color: 'bg-pink-500',    light: 'bg-pink-50 text-pink-700 border-pink-100',         icon: ShoppingBag },
  Utilities:     { color: 'bg-yellow-500',  light: 'bg-yellow-50 text-yellow-700 border-yellow-100',   icon: Zap },
  Healthcare:    { color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-100',icon: Heart },
  Entertainment: { color: 'bg-purple-500',  light: 'bg-purple-50 text-purple-700 border-purple-100',   icon: Tv },
  Education:     { color: 'bg-indigo-500',  light: 'bg-indigo-50 text-indigo-700 border-indigo-100',   icon: BookOpen },
  Rent:          { color: 'bg-red-500',     light: 'bg-red-50 text-red-700 border-red-100',            icon: Home },
  Miscellaneous: { color: 'bg-gray-400',    light: 'bg-gray-50 text-gray-600 border-gray-100',         icon: MoreHorizontal },
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: () => expensesApi.getAll(), enabled: !!currentUser });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets', currentMonth], queryFn: () => budgetsApi.get(currentMonth), enabled: !!currentUser });

  const currentBudget = budgets[0]?.budgetAmount || 0;
  const monthExpenses = expenses.filter(e => e.expenseDate.startsWith(currentMonth));
  const currentMonthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = currentBudget > 0 ? Math.min(Math.round((currentMonthTotal / currentBudget) * 100), 100) : 0;
  const remaining = currentBudget - currentMonthTotal;

  const setBudgetMutation = useMutation({
    mutationFn: (amount) => budgetsApi.upsert({ month: currentMonth, budgetAmount: amount }),
    onSuccess: () => queryClient.invalidateQueries(['budgets'])
  });
  const createMutation = useMutation({
    mutationFn: (e) => expensesApi.create({ ...e, userId: currentUser.uid }),
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); setIsExpenseModalOpen(false); }
  });

  const handleSetBudget = () => {
    const v = window.prompt('Enter monthly budget (₹):', currentBudget || '');
    if (v !== null) { const n = parseFloat(v); if (!isNaN(n) && n >= 0) setBudgetMutation.mutate(n); }
  };

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
  const topCategories = Object.entries(categoryTotals).sort(([,a],[,b]) => b - a).slice(0, 4);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const firstName = currentUser?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/scan"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-all shadow-sm">
            <ScanLine className="h-4 w-4" /> Scan Receipt
          </Link>
          <button onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
            <Plus className="h-4 w-4" /> New Expense
          </button>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Card 1 — Month Spent */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-100 text-xs font-semibold uppercase tracking-widest">Month's Spending</span>
              <div className="bg-white/15 backdrop-blur-sm p-2 rounded-xl border border-white/20">
                <IndianRupee className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-4xl font-extrabold tracking-tight">₹{currentMonthTotal.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-blue-200" />
                <span className="text-blue-100 text-xs font-medium">{monthExpenses.length} transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 — Budget */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Monthly Budget</span>
            <button onClick={handleSetBudget}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100">
              {currentBudget > 0 ? <Pencil className="h-3.5 w-3.5 text-emerald-600" /> : <Plus className="h-3.5 w-3.5 text-emerald-600" />}
            </button>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {currentBudget > 0 ? `₹${currentBudget.toLocaleString('en-IN')}` : <span className="text-gray-300 text-2xl font-semibold">Not set</span>}
          </p>
          <div className="mt-3">
            {currentBudget > 0 && remaining >= 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                ₹{remaining.toLocaleString('en-IN')} remaining
              </span>
            )}
            {currentBudget > 0 && remaining < 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                ₹{Math.abs(remaining).toLocaleString('en-IN')} over budget
              </span>
            )}
            {!currentBudget && (
              <button onClick={handleSetBudget} className="text-xs text-blue-600 font-semibold hover:underline">Set a budget →</button>
            )}
          </div>
        </div>

        {/* Card 3 — Budget Used */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Budget Used</span>
            <div className={`p-2 rounded-xl border ${budgetPct >= 80 ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
              <Target className={`h-3.5 w-3.5 ${budgetPct >= 80 ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
          </div>
          <p className={`text-4xl font-extrabold tracking-tight ${budgetPct >= 100 ? 'text-red-600' : budgetPct >= 80 ? 'text-orange-500' : 'text-gray-900'}`}>
            {budgetPct}%
          </p>
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ease-out ${budgetPct >= 80 ? 'bg-gradient-to-r from-red-400 to-red-600' : budgetPct >= 60 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">{currentBudget > 0 ? `₹${currentMonthTotal.toLocaleString('en-IN')} of ₹${currentBudget.toLocaleString('en-IN')}` : 'Set a budget to track'}</p>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Transactions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest activity</p>
            </div>
            <Link to="/expenses" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {expenses.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                <IndianRupee className="h-7 w-7 text-blue-300" />
              </div>
              <p className="text-gray-700 font-semibold">No expenses yet</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">Start by scanning a receipt or adding an expense manually</p>
              <button onClick={() => setIsExpenseModalOpen(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">
                <Plus className="h-3.5 w-3.5" /> Add Expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {expenses.slice(0, 7).map((exp) => {
                const cfg = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.Miscellaneous;
                const Icon = cfg.icon;
                return (
                  <div key={exp._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/70 transition-colors group">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.light}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{exp.title}</p>
                        <p className="text-xs text-gray-400">{new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.light}`}>{exp.category}</span>
                      <p className="text-sm font-bold text-gray-900 min-w-[72px] text-right">₹{exp.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900">Spending by Category</h2>
            <p className="text-xs text-gray-400 mt-0.5">All time breakdown</p>
          </div>
          {topCategories.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="p-5 space-y-4">
              {topCategories.map(([cat, amount], idx) => {
                const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Miscellaneous;
                const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                        <span className="text-sm font-medium text-gray-700">{cat}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-gray-400 ml-1.5">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all duration-700 ${cfg.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-50">
                <Link to="/analytics" className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
                  Full analytics <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSave={(d) => createMutation.mutate(d)} initialData={null} />
    </div>
  );
}
