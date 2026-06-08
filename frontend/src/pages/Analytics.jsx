import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { expensesApi } from '../lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { TrendingUp, Calendar, DollarSign, Tag, ArrowUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#64748b', '#f97316', '#14b8a6'
];

export default function Analytics() {
  const { currentUser } = useAuth();
  const [dateRange, setDateRange] = useState('all'); // 'all', '30', '90', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', currentUser?.uid],
    queryFn: () => expensesApi.getAll(),
    enabled: !!currentUser?.uid
  });

  // Filter expenses based on date range
  const filteredExpenses = useMemo(() => {
    if (dateRange === 'all') return expenses;
    
    const now = new Date();
    let startDate = new Date();

    if (dateRange === '30') startDate.setDate(now.getDate() - 30);
    else if (dateRange === '90') startDate.setDate(now.getDate() - 90);
    else if (dateRange === 'custom') {
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) {
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        return expenses.filter(exp => {
          const expDate = new Date(exp.expenseDate);
          return expDate >= startDate && expDate <= endDate;
        });
      }
    }

    return expenses.filter(exp => new Date(exp.expenseDate) >= startDate);
  }, [expenses, dateRange, customStartDate, customEndDate]);

  // Summary Statistics
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const average = filteredExpenses.length > 0 ? total / filteredExpenses.length : 0;
    const highest = filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0;
    const lowest = filteredExpenses.length > 0 ? Math.min(...filteredExpenses.map(e => e.amount)) : 0;

    return { total, average, highest, lowest, count: filteredExpenses.length };
  }, [filteredExpenses]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  if (expenses.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center py-10 text-gray-500">
          Not enough data to display analytics yet. Add some expenses first!
        </div>
      </div>
    );
  }

  // Category Breakdown
  const categoryTotals = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ category: cat, amount, percentage: (amount / stats.total) * 100 }));

  const pieData = {
    labels: sortedCategories.map(c => c.category),
    datasets: [
      {
        label: 'Amount (₹)',
        data: sortedCategories.map(c => c.amount),
        backgroundColor: COLORS.slice(0, sortedCategories.length),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { 
        callbacks: { 
          label: (context) => `₹${context.parsed.y.toFixed(2)}`
        }
      }
    },
  };

  // Monthly Trends - Bar Chart
  const monthlyTotals = filteredExpenses.reduce((acc, exp) => {
    const date = new Date(exp.expenseDate);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[month] = (acc[month] || 0) + exp.amount;
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyTotals).sort();
  
  const barData = {
    labels: sortedMonths.map(m => {
      const [year, month] = m.split('-');
      return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Total Expenses (₹)',
        data: sortedMonths.map(m => monthlyTotals[m]),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { 
        callbacks: { 
          label: (context) => `₹${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => `₹${v}` } }
    }
  };

  // Daily Trend - Line Chart
  const dailyTotals = filteredExpenses.reduce((acc, exp) => {
    const date = exp.expenseDate.substring(0, 10);
    acc[date] = (acc[date] || 0) + exp.amount;
    return acc;
  }, {});

  const sortedDates = Object.keys(dailyTotals).sort();
  let cumulativeTotal = 0;
  const cumulativeData = sortedDates.map(date => {
    cumulativeTotal += dailyTotals[date];
    return cumulativeTotal;
  });

  const lineData = {
    labels: sortedDates.map(d => new Date(d).toLocaleDateString('default', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Cumulative Spending (₹)',
        data: cumulativeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { 
        callbacks: { 
          label: (context) => `₹${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => `₹${v}` } }
    }
  };

  // Top Expenses
  const topExpenses = [...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400"
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-3 py-2 border border-blue-300 rounded-lg text-sm"
            placeholder="Start Date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-3 py-2 border border-blue-300 rounded-lg text-sm"
            placeholder="End Date"
          />
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.total.toFixed(0)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Avg per Expense</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.average.toFixed(0)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Highest</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.highest.toFixed(0)}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArrowUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.count}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Category Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          <div className="aspect-square flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedCategories.map((item, idx) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[idx] }}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">₹{item.amount.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend - Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h2>
          <Bar data={barData} options={barOptions} />
        </div>

        {/* Cumulative Trend - Line Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Spending</h2>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Top Expenses */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Expenses</h2>
        <div className="space-y-3">
          {topExpenses.map((exp, idx) => (
            <div key={exp._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                  <p className="text-xs text-gray-500">{exp.category} • {new Date(exp.expenseDate).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900">₹{exp.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
