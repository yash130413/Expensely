import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { expensesApi } from '../lib/api';
import { getLocalExpenses, addLocalExpense, updateLocalExpense, deleteLocalExpense, addToSyncQueue } from '../lib/db';
import ExpenseModal from '../components/ExpenseModal';
import { Plus, Edit2, Trash2, IndianRupee, Calendar, WifiOff } from 'lucide-react';

export default function Expenses() {
  const { currentUser } = useAuth();
  const { online, setPendingCount } = useOffline();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

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
    if (editingExpense) {
      updateMutation.mutate({ ...expenseData, _id: editingExpense._id });
    } else {
      createMutation.mutate(expenseData);
    }
  };

  const handleEdit = (expense) => { setEditingExpense(expense); setIsModalOpen(true); };
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <div className="flex items-center gap-3">
          {!online && (
            <span className="flex items-center text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
              <WifiOff className="h-3 w-3 mr-1" /> Offline
            </span>
          )}
          <button
            onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load expenses. Is backend running?</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <IndianRupee className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No expenses found</p>
            <p className="mt-1">Add your first expense to start tracking!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{expense.title}</div>
                      {expense.merchantName && (
                        <div className="text-xs text-gray-500">{expense.merchantName}</div>
                      )}
                      {expense.createdOffline && (
                        <span className="text-xs text-orange-500">• Pending sync</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingExpense}
      />
    </div>
  );
}
