import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const dashboardRoutes = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  registrar: '/registrar/dashboard',
};

export default function Navbar({ onToggleSidebar, collapsed, onCollapse }) {
  const { user, logout, avatar } = useAuth();
  const navigate = useNavigate();

  const dashboardRoute = dashboardRoutes[user?.role] || '/';
  const displayName = user?.display_name || user?.email || '';
  const initials = displayName[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        {/* Mobile: hamburger to open sidebar overlay */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop: collapse/expand sidebar toggle */}
        <button
          onClick={onCollapse}
          className="hidden lg:flex p-2 hover:bg-emerald-50 rounded-lg text-emerald-500 hover:text-emerald-600 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen size={20} className="animate-pulse" />
            : <PanelLeftClose size={20} className="animate-pulse" />}
        </button>

        {/* Logo + title — click to go to role dashboard */}
        <Link
          to={dashboardRoute}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          title="Go to Dashboard"
        >
          <img src="/images/logo.png" alt="DBTC Logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-gray-800 hidden sm:block">
            Database Technology College Registration System
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* User info + avatar — students can click to open settings */}
        {user?.role === 'student' ? (
          <button
            onClick={() => navigate('/student/settings')}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            title="Profile Settings"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {avatar
                ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}
