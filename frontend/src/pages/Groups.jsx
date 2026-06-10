import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { groupsApi, sharedExpensesApi } from '../lib/api';
import { Users, Plus, Trash2, Check, X, ArrowLeft, UserPlus, Receipt, CheckCircle2 } from 'lucide-react';

const GROUP_COLORS = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-green-500 to-green-600', 'from-orange-500 to-orange-600', 'from-pink-500 to-pink-600', 'from-indigo-500 to-indigo-600'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

export default function Groups() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ groupName: '', description: '' });
  const [memberForm, setMemberForm] = useState({ userId: '', userName: '', email: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'General', splitType: 'equal', participants: [] });

  const { data: groups = [] } = useQuery({ queryKey: ['groups', currentUser?.uid], queryFn: () => groupsApi.getAll(currentUser.uid), enabled: !!currentUser?.uid });
  const { data: groupDetail } = useQuery({ queryKey: ['group', selectedGroup?._id], queryFn: () => groupsApi.getOne(selectedGroup._id), enabled: !!selectedGroup?._id });
  const { data: groupExpenses = [] } = useQuery({ queryKey: ['sharedExpenses', selectedGroup?._id], queryFn: () => sharedExpensesApi.getByGroup(selectedGroup._id), enabled: !!selectedGroup?._id });
  const { data: groupSummary } = useQuery({ queryKey: ['groupSummary', selectedGroup?._id], queryFn: () => sharedExpensesApi.getSummary(selectedGroup._id), enabled: !!selectedGroup?._id });

  const createGroupMutation = useMutation({
    mutationFn: (data) => groupsApi.create({ ...data, createdBy: currentUser.uid, initialMembers: [{ userId: currentUser.uid, userName: currentUser.displayName || 'Me', email: currentUser.email }] }),
    onSuccess: () => { queryClient.invalidateQueries(['groups']); setShowCreateModal(false); setGroupForm({ groupName: '', description: '' }); }
  });
  const addMemberMutation = useMutation({
    mutationFn: (data) => groupsApi.addMember(selectedGroup._id, data),
    onSuccess: () => { queryClient.invalidateQueries(['group', selectedGroup._id]); setShowAddMemberModal(false); setMemberForm({ userId: '', userName: '', email: '' }); }
  });
  const addExpenseMutation = useMutation({
    mutationFn: (data) => sharedExpensesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['sharedExpenses', selectedGroup._id]); queryClient.invalidateQueries(['groupSummary', selectedGroup._id]); setShowAddExpenseModal(false); setExpenseForm({ description: '', amount: '', category: 'General', splitType: 'equal', participants: [] }); }
  });
  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => sharedExpensesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['sharedExpenses', selectedGroup._id]); queryClient.invalidateQueries(['groupSummary', selectedGroup._id]); }
  });
  const deleteGroupMutation = useMutation({
    mutationFn: (id) => groupsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['groups']); setSelectedGroup(null); }
  });
  const settleMutation = useMutation({
    mutationFn: () => sharedExpensesApi.settle(selectedGroup._id),
    onSuccess: () => { queryClient.invalidateQueries(['sharedExpenses', selectedGroup._id]); queryClient.invalidateQueries(['groupSummary', selectedGroup._id]); setShowSettleModal(false); }
  });

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount || expenseForm.participants.length === 0) return;
    const participants = expenseForm.splitType === 'equal'
      ? expenseForm.participants.map(p => ({ ...p, share: parseFloat(expenseForm.amount) / expenseForm.participants.length }))
      : expenseForm.participants;
    addExpenseMutation.mutate({ groupId: selectedGroup._id, amount: parseFloat(expenseForm.amount), description: expenseForm.description, category: expenseForm.category, paidBy: { userId: currentUser.uid, userName: currentUser.displayName }, participants, splitType: expenseForm.splitType });
  };

  const totalSpent = groupSummary?.totalAmount || 0;
  const yourShare = groupSummary?.balances?.[currentUser?.uid]?.owes || 0;

  // ── Group List ──────────────────────────────────────────────────────────────
  if (!selectedGroup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
            <p className="text-sm text-gray-500 mt-0.5">Split expenses with friends & family</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
            <Plus className="h-4 w-4" /> Create Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
            <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Users className="h-9 w-9 text-blue-400" />
            </div>
            <p className="text-gray-900 font-bold text-lg">No groups yet</p>
            <p className="text-gray-400 text-sm mt-2 mb-6">Create a group to start splitting expenses with friends</p>
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
              <Plus className="h-4 w-4" /> Create your first group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group, idx) => (
              <div key={group._id} onClick={() => setSelectedGroup(group)} className="bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all overflow-hidden group">
                <div className={`bg-gradient-to-r ${GROUP_COLORS[idx % GROUP_COLORS.length]} px-6 py-5`}>
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white/80 text-xs font-medium">{group.members.length} members</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mt-3">{group.groupName}</h3>
                  {group.description && <p className="text-white/70 text-xs mt-1 truncate">{group.description}</p>}
                </div>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total Spent</p>
                    <p className="font-bold text-gray-900">₹{(group.totalSpent || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-blue-600 text-xs font-medium group-hover:underline">View details →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <Modal title="Create Group" onClose={() => setShowCreateModal(false)}>
            <div className="space-y-4">
              <input type="text" placeholder="Group Name *" value={groupForm.groupName} onChange={e => setGroupForm({ ...groupForm, groupName: e.target.value })} className={inputCls} />
              <textarea placeholder="Description (optional)" value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} className={inputCls} rows="3" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={() => groupForm.groupName && createGroupMutation.mutate(groupForm)} disabled={createGroupMutation.isPending || !groupForm.groupName} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">Create</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── Group Detail ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Groups
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedGroup.groupName}</h1>
          {selectedGroup.description && <p className="text-gray-400 text-sm mt-0.5">{selectedGroup.description}</p>}
        </div>
        <button onClick={() => { if (window.confirm('Delete this group?')) deleteGroupMutation.mutate(selectedGroup._id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-100">
          <p className="text-blue-100 text-xs mb-2">Total Spent</p>
          <p className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs mb-2">Your Share</p>
          <p className="text-2xl font-bold text-blue-600">₹{yourShare.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-xs mb-2">Members</p>
          <p className="text-2xl font-bold text-gray-900">{groupDetail?.members?.length || 0}</p>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Members</h2>
          {currentUser.uid === selectedGroup.createdBy && (
            <button onClick={() => setShowAddMemberModal(true)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <UserPlus className="h-3.5 w-3.5" /> Add Member
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {groupDetail?.members?.map(member => (
            <div key={member.userId} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                {member.userName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-800">{member.userName}</span>
              {currentUser.uid === selectedGroup.createdBy && member.userId !== currentUser.uid && (
                <button onClick={() => groupsApi.removeMember(selectedGroup._id, member.userId).then(() => queryClient.invalidateQueries(['group', selectedGroup._id]))} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Shared Expenses</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowAddExpenseModal(true)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 bg-blue-50 rounded-lg">
              <Receipt className="h-3.5 w-3.5" /> Add Expense
            </button>
            <button onClick={() => setShowSettleModal(true)} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1.5 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5" /> Settle Up
            </button>
          </div>
        </div>
        {groupExpenses.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No shared expenses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {groupExpenses.map(expense => (
              <div key={expense._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{expense.description}</p>
                  <p className="text-xs text-gray-400">{expense.paidBy.userName} • {new Date(expense.expenseDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-gray-900 text-sm">₹{expense.amount.toLocaleString('en-IN')}</p>
                  <button onClick={() => deleteExpenseMutation.mutate(expense._id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddMemberModal && (
        <Modal title="Add Member" onClose={() => setShowAddMemberModal(false)}>
          <div className="space-y-3">
            <input type="text" placeholder="User ID *" value={memberForm.userId} onChange={e => setMemberForm({ ...memberForm, userId: e.target.value })} className={inputCls} />
            <input type="text" placeholder="Name *" value={memberForm.userName} onChange={e => setMemberForm({ ...memberForm, userName: e.target.value })} className={inputCls} />
            <input type="email" placeholder="Email (optional)" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} className={inputCls} />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddMemberModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => memberForm.userId && memberForm.userName && addMemberMutation.mutate(memberForm)} disabled={addMemberMutation.isPending} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Add</button>
            </div>
          </div>
        </Modal>
      )}

      {showAddExpenseModal && (
        <Modal title="Add Shared Expense" onClose={() => setShowAddExpenseModal(false)}>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <input type="text" placeholder="Description *" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Amount (₹) *" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputCls} />
            <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className={inputCls}>
              {['Food','Travel','Accommodation','Entertainment','General'].map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={expenseForm.splitType} onChange={e => setExpenseForm({ ...expenseForm, splitType: e.target.value })} className={inputCls}>
              <option value="equal">Split Equally</option>
              <option value="custom">Custom Split</option>
            </select>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Select participants *</p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {groupDetail?.members?.map(member => (
                  <label key={member.userId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={expenseForm.participants.some(p => p.userId === member.userId)}
                      onChange={e => {
                        if (e.target.checked) setExpenseForm({ ...expenseForm, participants: [...expenseForm.participants, { userId: member.userId, userName: member.userName, share: 0 }] });
                        else setExpenseForm({ ...expenseForm, participants: expenseForm.participants.filter(p => p.userId !== member.userId) });
                      }}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{member.userName}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddExpenseModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddExpense} disabled={addExpenseMutation.isPending} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Add</button>
            </div>
          </div>
        </Modal>
      )}

      {showSettleModal && (
        <Modal title="Settle Up" onClose={() => setShowSettleModal(false)}>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">This will mark all <span className="font-semibold text-gray-900">{groupExpenses.length} expenses</span> as settled.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSettleModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => settleMutation.mutate()} disabled={settleMutation.isPending} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">Confirm Settle</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
