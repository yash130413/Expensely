import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { groupsApi, sharedExpensesApi } from '../lib/api';
import { Users, Plus, Trash2, DollarSign, Check, Settings, X } from 'lucide-react';

export default function Groups() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  // Form states
  const [groupForm, setGroupForm] = useState({ groupName: '', description: '' });
  const [memberForm, setMemberForm] = useState({ userId: '', userName: '', email: '' });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'General',
    splitType: 'equal',
    participants: []
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['groups', currentUser?.uid],
    queryFn: () => groupsApi.getAll(currentUser.uid),
    enabled: !!currentUser?.uid
  });

  // Fetch selected group details
  const { data: groupDetail } = useQuery({
    queryKey: ['group', selectedGroup?._id],
    queryFn: () => groupsApi.getOne(selectedGroup._id),
    enabled: !!selectedGroup?._id
  });

  // Fetch group expenses
  const { data: groupExpenses = [] } = useQuery({
    queryKey: ['sharedExpenses', selectedGroup?._id],
    queryFn: () => sharedExpensesApi.getByGroup(selectedGroup._id),
    enabled: !!selectedGroup?._id
  });

  // Fetch group summary
  const { data: groupSummary } = useQuery({
    queryKey: ['groupSummary', selectedGroup?._id],
    queryFn: () => sharedExpensesApi.getSummary(selectedGroup._id),
    enabled: !!selectedGroup?._id
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data) => groupsApi.create({
      ...data,
      createdBy: currentUser.uid,
      initialMembers: [{
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Me',
        email: currentUser.email
      }]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      setShowCreateModal(false);
      setGroupForm({ groupName: '', description: '' });
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data) => groupsApi.addMember(selectedGroup._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', selectedGroup._id]);
      setShowAddMemberModal(false);
      setMemberForm({ userId: '', userName: '', email: '' });
    }
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: (data) => sharedExpensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sharedExpenses', selectedGroup._id]);
      queryClient.invalidateQueries(['groupSummary', selectedGroup._id]);
      setShowAddExpenseModal(false);
      setExpenseForm({ description: '', amount: '', category: 'General', splitType: 'equal', participants: [] });
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => sharedExpensesApi.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['sharedExpenses', selectedGroup._id]);
      queryClient.invalidateQueries(['groupSummary', selectedGroup._id]);
    }
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId) => groupsApi.delete(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      setSelectedGroup(null);
    }
  });

  // Settle mutation
  const settleMutation = useMutation({
    mutationFn: () => sharedExpensesApi.settle(selectedGroup._id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sharedExpenses', selectedGroup._id]);
      queryClient.invalidateQueries(['groupSummary', selectedGroup._id]);
      setShowSettleModal(false);
    }
  });

  const handleCreateGroup = () => {
    if (groupForm.groupName) {
      createGroupMutation.mutate(groupForm);
    }
  };

  const handleAddMember = () => {
    if (memberForm.userId && memberForm.userName) {
      addMemberMutation.mutate(memberForm);
    }
  };

  const handleAddExpense = () => {
    if (expenseForm.description && expenseForm.amount && expenseForm.participants.length > 0) {
      const participants = expenseForm.splitType === 'equal'
        ? expenseForm.participants.map(p => ({ ...p, share: parseFloat(expenseForm.amount) / expenseForm.participants.length }))
        : expenseForm.participants;

      addExpenseMutation.mutate({
        groupId: selectedGroup._id,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: expenseForm.category,
        paidBy: { userId: currentUser.uid, userName: currentUser.displayName },
        participants: participants,
        splitType: expenseForm.splitType
      });
    }
  };

  const totalSpent = groupSummary?.totalAmount || 0;
  const yourShare = groupSummary?.balances?.[currentUser?.uid]?.owes || 0;

  if (!selectedGroup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No groups yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a group to start splitting expenses with friends</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map(group => (
              <div
                key={group._id}
                onClick={() => setSelectedGroup(group)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{group.groupName}</h3>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                {group.description && (
                  <p className="text-sm text-gray-500 mb-3">{group.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Members:</span> {group.members.length}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Total Spent:</span> ₹{(group.totalSpent || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Group</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Group Name"
                value={groupForm.groupName}
                onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <textarea
                placeholder="Description (optional)"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Group Detail View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-blue-600 text-sm font-medium mb-2 hover:underline"
          >
            ← Back to Groups
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedGroup.groupName}</h1>
          {selectedGroup.description && (
            <p className="text-gray-500 mt-1">{selectedGroup.description}</p>
          )}
        </div>
        <button
          onClick={() => deleteGroupMutation.mutate(selectedGroup._id)}
          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Group"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalSpent.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Your Share</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{yourShare.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Members</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{groupDetail?.members?.length || 0}</p>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Members</h2>
          {currentUser.uid === selectedGroup.createdBy && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Member
            </button>
          )}
        </div>
        <div className="space-y-3">
          {groupDetail?.members?.map(member => (
            <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{member.userName}</p>
                {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
              </div>
              {currentUser.uid === selectedGroup.createdBy && member.userId !== currentUser.uid && (
                <button
                  onClick={() => groupsApi.removeMember(selectedGroup._id, member.userId).then(() => queryClient.invalidateQueries(['group', selectedGroup._id]))}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Shared Expenses</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </button>
            <button
              onClick={() => setShowSettleModal(true)}
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Settle Up
            </button>
          </div>
        </div>

        {groupExpenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expenses yet</p>
        ) : (
          <div className="space-y-3">
            {groupExpenses.map(expense => (
              <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <p className="text-xs text-gray-500">
                    {expense.paidBy.userName} • {new Date(expense.expenseDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-900">₹{expense.amount.toFixed(0)}</p>
                  <button
                    onClick={() => deleteExpenseMutation.mutate(expense._id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Member</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="User ID"
              value={memberForm.userId}
              onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <input
              type="text"
              placeholder="Name"
              value={memberForm.userName}
              onChange={(e) => setMemberForm({ ...memberForm, userName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <input
              type="email"
              placeholder="Email (optional)"
              value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={addMemberMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Shared Expense</h2>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <input
              type="number"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option>Food</option>
              <option>Travel</option>
              <option>Accommodation</option>
              <option>Entertainment</option>
              <option>General</option>
            </select>

            <select
              value={expenseForm.splitType}
              onChange={(e) => setExpenseForm({ ...expenseForm, splitType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="equal">Split Equally</option>
              <option value="custom">Custom Split</option>
            </select>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Who is this for?</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {groupDetail?.members?.map(member => (
                  <label key={member.userId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={expenseForm.participants.some(p => p.userId === member.userId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExpenseForm({
                            ...expenseForm,
                            participants: [...expenseForm.participants, { userId: member.userId, userName: member.userName, share: 0 }]
                          });
                        } else {
                          setExpenseForm({
                            ...expenseForm,
                            participants: expenseForm.participants.filter(p => p.userId !== member.userId)
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">{member.userName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                disabled={addExpenseMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Settle Up</h2>
              <button onClick={() => setShowSettleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-600">This will mark all expenses as settled. Are you sure?</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => settleMutation.mutate()}
                disabled={settleMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Settle All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
