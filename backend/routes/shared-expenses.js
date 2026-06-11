import express from 'express';
import SharedExpense from '../models/SharedExpense.js';
import Group from '../models/Group.js';

const router = express.Router();

// GET all shared expenses for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const expenses = await SharedExpense.find({ groupId: req.params.groupId })
      .sort({ expenseDate: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new shared expense
router.post('/', async (req, res) => {
  try {
    const { groupId, amount, description, category, paidBy, participants, splitType } = req.body;

    if (!groupId || !amount || !description || !paidBy) {
      return res.status(400).json({ message: 'groupId, amount, description, and paidBy are required' });
    }

    // Calculate shares based on split type
    let sharesData = participants;
    if (splitType === 'equal') {
      const sharePerPerson = amount / participants.length;
      sharesData = participants.map(p => ({
        ...p,
        share: sharePerPerson
      }));
    }

    const newExpense = new SharedExpense({
      groupId,
      amount,
      description,
      category: category || 'General',
      paidBy,
      participants: sharesData,
      splitType,
    });

    const savedExpense = await newExpense.save();

    // Update group's totalSpent
    const group = await Group.findById(groupId);
    if (group) {
      group.totalSpent = (group.totalSpent || 0) + amount;
      await group.save();
    }

    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update shared expense
router.put('/:id', async (req, res) => {
  try {
    const { amount, description, category, participants, splitType } = req.body;

    let sharesData = participants;
    if (splitType === 'equal' && amount) {
      const sharePerPerson = amount / participants.length;
      sharesData = participants.map(p => ({
        ...p,
        share: sharePerPerson
      }));
    }

    const updatedExpense = await SharedExpense.findByIdAndUpdate(
      req.params.id,
      { amount, description, category, participants: sharesData, splitType },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE shared expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await SharedExpense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Update group's totalSpent
    const group = await Group.findById(expense.groupId);
    if (group) {
      group.totalSpent = Math.max(0, (group.totalSpent || 0) - expense.amount);
      await group.save();
    }

    await SharedExpense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST calculate settlements for a group
router.post('/group/:groupId/settle', async (req, res) => {
  try {
    const expenses = await SharedExpense.find({ groupId: req.params.groupId, settled: false });

    // Calculate balances for each member
    const balances = {};

    expenses.forEach(exp => {
      const paidByUserId = exp.paidBy.userId;
      
      if (!balances[paidByUserId]) {
        balances[paidByUserId] = 0;
      }
      balances[paidByUserId] += exp.amount;

      exp.participants.forEach(participant => {
        if (!balances[participant.userId]) {
          balances[participant.userId] = 0;
        }
        balances[participant.userId] -= participant.share;
      });
    });

    // Create settlement transactions
    const settlements = [];
    const userIds = Object.keys(balances);
    
    userIds.forEach(userId => {
      if (balances[userId] > 0.01) {
        // This user is owed money
        userIds.forEach(otherUserId => {
          if (balances[otherUserId] < -0.01) {
            const amount = Math.min(balances[userId], Math.abs(balances[otherUserId]));
            settlements.push({
              from: otherUserId,
              to: userId,
              amount: parseFloat(amount.toFixed(2))
            });
            balances[userId] -= amount;
            balances[otherUserId] += amount;
          }
        });
      }
    });

    // Mark expenses as settled
    await SharedExpense.updateMany(
      { groupId: req.params.groupId, settled: false },
      { settled: true }
    );

    res.status(200).json({
      settlements: settlements.filter(s => s.amount > 0.01),
      balances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET settlement summary for a group
router.get('/group/:groupId/summary', async (req, res) => {
  try {
    const expenses = await SharedExpense.find({ groupId: req.params.groupId, settled: false });

    const summary = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      byCategory: {},
      byPerson: {},
      balances: {}
    };

    expenses.forEach(exp => {
      // By category
      if (!summary.byCategory[exp.category]) {
        summary.byCategory[exp.category] = 0;
      }
      summary.byCategory[exp.category] += exp.amount;

      // By person (who paid)
      const paidByName = exp.paidBy.userName;
      if (!summary.byPerson[paidByName]) {
        summary.byPerson[paidByName] = 0;
      }
      summary.byPerson[paidByName] += exp.amount;

      // Balances calculation
      const paidByUserId = exp.paidBy.userId;
      if (!summary.balances[paidByUserId]) {
        summary.balances[paidByUserId] = { paid: 0, owes: 0 };
      }
      summary.balances[paidByUserId].paid += exp.amount;

      exp.participants.forEach(participant => {
        if (!summary.balances[participant.userId]) {
          summary.balances[participant.userId] = { paid: 0, owes: 0 };
        }
        summary.balances[participant.userId].owes += participant.share;
      });
    });

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
