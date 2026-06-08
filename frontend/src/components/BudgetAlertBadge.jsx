import { AlertCircle, TrendingUp, Zap } from 'lucide-react';

/**
 * BudgetAlertBadge - Shows budget status with visual indicators
 * Used in Dashboard to display real-time budget alerts
 */
export default function BudgetAlertBadge({ budget, spent, month }) {
  if (!budget || budget === 0) {
    return null;
  }

  const percentage = (spent / budget) * 100;
  const remaining = budget - spent;
  const isOverBudget = remaining < 0;

  // Determine alert level
  let alertLevel = 'safe'; // < 50%
  let severity = 'info';
  let icon = null;
  let bgColor = 'bg-green-50';
  let borderColor = 'border-green-200';
  let textColor = 'text-green-700';

  if (percentage >= 100) {
    alertLevel = 'critical';
    severity = 'error';
    icon = AlertCircle;
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    textColor = 'text-red-700';
  } else if (percentage >= 80) {
    alertLevel = 'warning';
    severity = 'warning';
    icon = TrendingUp;
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
    textColor = 'text-orange-700';
  } else if (percentage >= 50) {
    alertLevel = 'caution';
    severity = 'info';
    icon = Zap;
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-200';
    textColor = 'text-blue-700';
  }

  const IconComponent = icon;

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {IconComponent && (
            <IconComponent className={`h-5 w-5 ${textColor} flex-shrink-0 mt-0.5`} />
          )}
          <div>
            <p className={`font-semibold ${textColor}`}>
              {isOverBudget ? 'Over Budget!' : 'Budget Status'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isOverBudget
                ? `You've exceeded your budget by ₹${Math.abs(remaining).toFixed(2)}`
                : `₹${remaining.toFixed(2)} remaining`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            ₹{spent.toFixed(2)} / ₹{budget.toFixed(2)}
          </span>
          <span className={`font-medium ${textColor}`}>
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isOverBudget
                ? 'bg-red-500'
                : percentage >= 80
                ? 'bg-orange-500'
                : percentage >= 50
                ? 'bg-blue-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
