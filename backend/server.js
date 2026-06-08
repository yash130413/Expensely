import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budgets.js';
import ocrRoutes from './routes/ocr.js';
import groupRoutes from './routes/groups.js';
import sharedExpenseRoutes from './routes/shared-expenses.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/shared-expenses', sharedExpenseRoutes);

app.get('/', (req, res) => {
  res.send('Expensely API is running...');
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expensely';

mongoose.connect(MONGODB_URI, { dbName: 'expensely' })
  .then(() => {
    console.log('Connected to MongoDB - Database: expensely');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
