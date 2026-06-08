import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  merchantName: {
    type: String,
  },
  expenseDate: {
    type: Date,
    default: Date.now,
  },
  receiptImageUrl: {
    type: String,
  },
  paymentMethod: {
    type: String,
  }
}, {
  timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
