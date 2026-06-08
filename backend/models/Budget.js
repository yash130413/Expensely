import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  month: {
    // Format: YYYY-MM
    type: String,
    required: true,
  },
  budgetAmount: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true
});

// Ensure a user can only have one budget per month
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
