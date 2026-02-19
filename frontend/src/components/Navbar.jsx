import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <Menu size={20} />
        </button>
        <img src="/images/logo.png" alt="DBTC Logo" className="w-8 h-8 object-contain" />
        <span className="text-lg font-bold text-gray-800 hidden sm:block">
          Database Technology College Registration System
        </span>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700">{user?.display_name || user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
