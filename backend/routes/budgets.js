import express from 'express';
import Budget from '../models/Budget.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET budget for a specific user and month (requires auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    const { month } = req.query;
    
    // If month is provided, find that specific month, else get all budgets for user
    const query = { userId };
    if (month) query.month = month;

    const budgets = await Budget.find(query).sort({ month: -1 });
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST (Create) or PUT (Update) a budget for a month (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { month, budgetAmount } = req.body;
    const { userId } = req;

    if (!month || !budgetAmount) {
      return res.status(400).json({ message: 'month and budgetAmount are required' });
    }

    // Upsert: Create if doesn't exist, update if it does
    const budget = await Budget.findOneAndUpdate(
      { userId, month },
      { budgetAmount },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.status(200).json(budget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a budget (requires auth)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedBudget = await Budget.findByIdAndDelete(req.params.id);
    if (!deletedBudget) return res.status(404).json({ message: 'Budget not found' });
    res.status(200).json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
