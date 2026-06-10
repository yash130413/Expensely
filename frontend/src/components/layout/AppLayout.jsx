import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ReceiptText, PieChart, Users, LogOut, Receipt, Wallet, ScanLine, ChevronRight } from 'lucide-react';

export default function AppLayout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch {}
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
    { name: 'Scan Receipt', path: '/scan', icon: ScanLine, color: 'text-violet-400' },
    { name: 'Budgets', path: '/budgets', icon: Wallet, color: 'text-emerald-400' },
    { name: 'Expenses', path: '/expenses', icon: ReceiptText, color: 'text-orange-400' },
    { name: 'Analytics', path: '/analytics', icon: PieChart, color: 'text-pink-400' },
    { name: 'Groups', path: '/groups', icon: Users, color: 'text-cyan-400' },
  ];

  const avatarUrl = currentUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'U')}&background=3b82f6&color=fff&bold=true`;

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-100 shadow-sm flex-shrink-0">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm shadow-blue-200">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-gray-900 font-bold text-lg tracking-tight">Expensely</span>
              <p className="text-gray-400 text-[10px] font-semibold tracking-widest uppercase">Finance Tracker</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-white/20' : 'bg-transparent'}`}>
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : item.color}`} />
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white/70" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 mb-1">
            <img src={avatarUrl} alt="avatar" className="h-8 w-8 rounded-full ring-2 ring-blue-100 flex-shrink-0" />
            <div className="overflow-hidden flex-1">
              <p className="text-gray-900 text-sm font-semibold truncate leading-tight">{currentUser?.displayName || 'User'}</p>
              <p className="text-gray-400 text-xs truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium group"
          >
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center px-8 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span className="text-gray-700 font-semibold">{currentUser?.displayName?.split(' ')[0] || 'User'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-blue-600 font-medium capitalize">
              {currentPage}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f8fafc]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
