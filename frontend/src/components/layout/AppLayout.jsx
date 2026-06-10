import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ReceiptText, PieChart, Users, LogOut, Receipt, Wallet, ScanLine } from 'lucide-react';
import clsx from 'clsx';

export default function AppLayout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch {}
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scan Receipt', path: '/scan', icon: ScanLine },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Expenses', path: '/expenses', icon: ReceiptText },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'Groups', path: '/groups', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="bg-blue-600 p-1.5 rounded-lg mr-2.5">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Expensely</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={clsx('mr-3 flex-shrink-0 h-[18px] w-[18px]',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  )} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center px-3 py-2 mb-1 rounded-xl bg-gray-50">
            <img
              src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email || 'User'}&background=3b82f6&color=fff`}
              alt="User"
              className="h-8 w-8 rounded-full ring-2 ring-white"
            />
            <div className="ml-2.5 overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.displayName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="mr-3 h-4 w-4 text-gray-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
