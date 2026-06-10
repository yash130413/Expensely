import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { expensesApi } from '../lib/api';
import { getLocalExpenses, addLocalExpense, updateLocalExpense, deleteLocalExpense, addToSyncQueue } from '../lib/db';
import ExpenseModal from '../components/ExpenseModal';
import { Plus, Edit2, Trash2, IndianRupee, WifiOff, Search } from 'lucide-react';

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

export default function Expenses() {
  const { currentUser } = useAuth();
  const { online, setPendingCount } = useOffline();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [search, setSearch] = useState('');

  const { data: expenses = [], isLoading, isError } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!online) return getLocalExpenses();
      return expensesApi.getAll();
    },
    enabled: !!currentUser
  });

  const createMutation = useMutation({
    mutationFn: async (newExpense) => {
      if (!online) {
        const tempExpense = { ...newExpense, _id: `temp_${Date.now()}`, createdOffline: true };
        await addLocalExpense(tempExpense);
        await addToSyncQueue({ type: 'CREATE_EXPENSE', payload: newExpense });
        setPendingCount(c => c + 1);
        return tempExpense;
      }
      return expensesApi.create(newExpense);
    },
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); setIsModalOpen(false); }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (!online) {
        await updateLocalExpense(data);
        await addToSyncQueue({ type: 'UPDATE_EXPENSE', payload: data });
        setPendingCount(c => c + 1);
        return data;
      }
      return expensesApi.update(data._id, data);
    },
    onSuccess: () => { queryClient.invalidateQueries(['expenses']); setIsModalOpen(false); setEditingExpense(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!online) {
        await deleteLocalExpense(id);
        await addToSyncQueue({ type: 'DELETE_EXPENSE', payload: { _id: id } });
        setPendingCount(c => c + 1);
        return;
      }
      return expensesApi.delete(id);
    },
    onSuccess: () => queryClient.invalidateQueries(['expenses'])
  });

  const handleSave = (expenseData) => {
    if (editingExpense) updateMutation.mutate({ ...expenseData, _id: editingExpense._id });
    else createMutation.mutate(expenseData);
  };

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.merchantName || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{expenses.length} total transactions</p>
        </div>
        <div className="flex items-center gap-2.5">
          {!online && (
            <span className="flex items-center text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg gap-1">
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          )}
          <button
            onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Search + Summary */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        {filtered.length > 0 && (
          <p className="text-sm text-gray-500">
            Total: <span className="font-bold text-gray-900">₹{totalFiltered.toLocaleString('en-IN')}</span>
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="animate-pulse space-y-3 px-6">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-red-500 font-medium">Failed to load expenses</p>
            <p className="text-gray-400 text-sm mt-1">Make sure the backend is running</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold">{search ? 'No results found' : 'No expenses yet'}</p>
            <p className="text-gray-400 text-sm mt-1">{search ? 'Try a different search term' : 'Add your first expense to start tracking'}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 border-b border-gray-50 bg-gray-50/80">
              <span>Date</span>
              <span>Details</span>
              <span>Category</span>
              <span>Amount</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((expense) => (
                <div key={expense._id} className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] items-center px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <span className="text-sm text-gray-500">{new Date(expense.expenseDate).toLocaleDateString('en-IN')}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                    {expense.merchantName && <p className="text-xs text-gray-400">{expense.merchantName}</p>}
                    {expense.createdOffline && <span className="text-xs text-orange-500">• Pending sync</span>}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-600'}`}>
                    {expense.category}
                  </span>
                  <span className="text-sm font-bold text-gray-900">₹{expense.amount.toLocaleString('en-IN')}</span>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditingExpense(expense); setIsModalOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this expense?')) deleteMutation.mutate(expense._id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} initialData={editingExpense} />
    </div>
  );
}
