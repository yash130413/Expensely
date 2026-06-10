import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { expensesApi } from '../lib/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { TrendingUp, Calendar, IndianRupee, ArrowUp, ArrowDown, BarChart3, Filter } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const PALETTE = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

export default function Analytics() {
  const { currentUser } = useAuth();
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', currentUser?.uid],
    queryFn: () => expensesApi.getAll(),
    enabled: !!currentUser?.uid
  });

  const filtered = useMemo(() => {
    if (dateRange === 'all') return expenses;
    const now = new Date(); let start = new Date();
    if (dateRange === '30') start.setDate(now.getDate() - 30);
    else if (dateRange === '90') start.setDate(now.getDate() - 90);
    else if (dateRange === 'custom' && customStart) {
      start = new Date(customStart);
      if (customEnd) { const end = new Date(customEnd); end.setHours(23,59,59,999); return expenses.filter(e => { const d = new Date(e.expenseDate); return d >= start && d <= end; }); }
    }
    return expenses.filter(e => new Date(e.expenseDate) >= start);
  }, [expenses, dateRange, customStart, customEnd]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s,e) => s+e.amount, 0);
    const avg = filtered.length > 0 ? total / filtered.length : 0;
    const max = filtered.length > 0 ? Math.max(...filtered.map(e=>e.amount)) : 0;
    const min = filtered.length > 0 ? Math.min(...filtered.map(e=>e.amount)) : 0;
    return { total, avg, max, min, count: filtered.length };
  }, [filtered]);

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
    </div>
  );

  if (expenses.length === 0) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
          <BarChart3 className="h-9 w-9 text-blue-300" />
        </div>
        <p className="text-gray-900 font-bold text-lg">No data yet</p>
        <p className="text-gray-400 text-sm mt-2">Add some expenses to see your analytics</p>
      </div>
    </div>
  );

  const catTotals = filtered.reduce((a,e) => { a[e.category]=(a[e.category]||0)+e.amount; return a; }, {});
  const sortedCats = Object.entries(catTotals).sort(([,a],[,b])=>b-a).map(([cat,amount])=>({cat,amount,pct:(amount/stats.total)*100}));

  const monthlyTotals = filtered.reduce((a,e) => { const m=e.expenseDate.substring(0,7); a[m]=(a[m]||0)+e.amount; return a; }, {});
  const sortedMonths = Object.keys(monthlyTotals).sort();

  const dailyTotals = filtered.reduce((a,e) => { const d=e.expenseDate.substring(0,10); a[d]=(a[d]||0)+e.amount; return a; }, {});
  const sortedDates = Object.keys(dailyTotals).sort();
  let cum=0; const cumData = sortedDates.map(d=>{cum+=dailyTotals[d];return cum;});

  const topExpenses = [...filtered].sort((a,b)=>b.amount-a.amount).slice(0,5);

  const chartTooltip = { callbacks: { label: ctx => ` ₹${ctx.parsed?.y?.toLocaleString('en-IN') || ctx.parsed?.toLocaleString('en-IN')}` }, backgroundColor: '#0f172a', titleColor: '#94a3b8', bodyColor: '#f1f5f9', borderColor: '#1e293b', borderWidth: 1, padding: 10, cornerRadius: 8 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Detailed insights into your spending</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select value={dateRange} onChange={e=>setDateRange(e.target.value)} className="text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer">
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
          <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400 text-sm font-medium">to</span>
          <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="px-3 py-2 border border-blue-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spent', value: `₹${stats.total.toLocaleString('en-IN')}`, icon: IndianRupee, gradient: 'from-blue-600 to-blue-700', shadow: 'shadow-blue-200', sub: `${stats.count} transactions` },
          { label: 'Average', value: `₹${Math.round(stats.avg).toLocaleString('en-IN')}`, icon: TrendingUp, gradient: 'from-violet-600 to-violet-700', shadow: 'shadow-violet-200', sub: 'per expense' },
          { label: 'Highest', value: `₹${stats.max.toLocaleString('en-IN')}`, icon: ArrowUp, gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-200', sub: 'single expense' },
          { label: 'Transactions', value: stats.count, icon: Calendar, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-200', sub: 'total entries' },
        ].map(({ label, value, icon: Icon, gradient, shadow, sub }) => (
          <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg ${shadow} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">{label}</span>
              <div className="bg-white/20 p-1.5 rounded-lg"><Icon className="h-3.5 w-3.5 text-white" /></div>
            </div>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-white/60 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Doughnut */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">By Category</h2>
          <p className="text-xs text-gray-400 mb-5">Spending distribution</p>
          <div className="flex items-center justify-center">
            <div className="w-52 h-52">
              <Doughnut data={{
                labels: sortedCats.map(c=>c.cat),
                datasets: [{ data: sortedCats.map(c=>c.amount), backgroundColor: PALETTE, borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }]
              }} options={{ cutout: '65%', plugins: { legend: { display: false }, tooltip: chartTooltip }, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {sortedCats.slice(0,4).map((c,i) => (
              <div key={c.cat} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: PALETTE[i]}} />
                  <span className="text-xs text-gray-600 font-medium">{c.cat}</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{c.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Monthly Trend</h2>
          <p className="text-xs text-gray-400 mb-5">Spending per month</p>
          <Bar data={{
            labels: sortedMonths.map(m => { const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); }),
            datasets: [{ label: 'Expenses', data: sortedMonths.map(m=>monthlyTotals[m]),
              backgroundColor: sortedMonths.map((_,i) => i===sortedMonths.length-1 ? '#3b82f6' : '#bfdbfe'),
              borderRadius: 8, borderSkipped: false }]
          }} options={{ responsive: true, plugins: { legend:{display:false}, tooltip: chartTooltip }, scales: {
            x: { grid:{display:false}, ticks:{color:'#94a3b8',font:{size:11}} },
            y: { grid:{color:'#f1f5f9'}, ticks:{color:'#94a3b8',font:{size:11},callback:v=>`₹${Number(v).toLocaleString('en-IN')}`}, beginAtZero:true }
          }}} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Line Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Cumulative Spending</h2>
          <p className="text-xs text-gray-400 mb-5">Running total over time</p>
          <Line data={{
            labels: sortedDates.map(d=>new Date(d).toLocaleDateString('default',{month:'short',day:'numeric'})),
            datasets: [{ label: 'Cumulative', data: cumData, borderColor:'#8b5cf6', backgroundColor:'rgba(139,92,246,0.08)', borderWidth:2.5, fill:true, tension:0.4, pointBackgroundColor:'#8b5cf6', pointBorderColor:'#fff', pointBorderWidth:2, pointRadius:4, pointHoverRadius:6 }]
          }} options={{ responsive:true, plugins:{ legend:{display:false}, tooltip:chartTooltip }, scales:{
            x:{grid:{display:false},ticks:{color:'#94a3b8',font:{size:11}}},
            y:{grid:{color:'#f1f5f9'},ticks:{color:'#94a3b8',font:{size:11},callback:v=>`₹${Number(v).toLocaleString('en-IN')}`},beginAtZero:true}
          }}} />
        </div>

        {/* Top Expenses */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900">Top Expenses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Highest spending entries</p>
          </div>
          <div className="divide-y divide-gray-50">
            {topExpenses.map((exp, i) => (
              <div key={exp._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                  style={{backgroundColor: PALETTE[i]}}>
                  {i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{exp.title}</p>
                  <p className="text-xs text-gray-400">{exp.category} • {new Date(exp.expenseDate).toLocaleDateString('en-IN')}</p>
                </div>
                <p className="text-sm font-extrabold text-gray-900 flex-shrink-0">₹{exp.amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">Category Breakdown</h2>
          <p className="text-xs text-gray-400 mt-0.5">Detailed spending per category</p>
        </div>
        <div className="divide-y divide-gray-50">
          {sortedCats.map((item, i) => (
            <div key={item.cat} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: PALETTE[i]}} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">{item.cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{item.pct.toFixed(1)}%</span>
                    <span className="text-sm font-extrabold text-gray-900">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{width:`${item.pct}%`,backgroundColor:PALETTE[i]}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
