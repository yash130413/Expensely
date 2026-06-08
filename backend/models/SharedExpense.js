import mongoose from 'mongoose';

const sharedExpenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  paidBy: {
    userId: {
      type: String,
      required: true,
    },
    userName: String,
  },
  participants: [
    {
      userId: {
        type: String,
        required: true,
      },
      userName: String,
      share: {
        type: Number,
        required: true,
      },
    },
  ],
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal',
  },
  expenseDate: {
    type: Date,
    default: Date.now,
  },
  settled: {
    type: Boolean,
    default: false,
  },
  receipts: [String],
}, {
  timestamps: true
});

const SharedExpense = mongoose.model('SharedExpense', sharedExpenseSchema);

export default SharedExpense;
