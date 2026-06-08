import express from 'express';
import Expense from '../models/Expense.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET all expenses for a user (requires auth)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    
    const expenses = await Expense.find({ userId }).sort({ expenseDate: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new expense (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newExpense = new Expense({
      ...req.body,
      userId: req.userId
    });
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (update) an expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedExpense) return res.status(404).json({ message: 'Expense not found' });
    
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE an expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!deletedExpense) return res.status(404).json({ message: 'Expense not found' });
    
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
