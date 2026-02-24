import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, BookOpen, UserPlus, CreditCard,
  Settings, X, ScrollText,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPendingStudents, getPendingPayments } from '../services/api';

const links = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Application Form', icon: Users },
    { to: '/student/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/pending', label: 'Pending', icon: ClipboardList, badge: true },
    { to: '/admin/students', label: 'All Students', icon: Users },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  registrar: [
    { to: '/registrar/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/registrar/payments', label: 'Payment Review', icon: CreditCard, badge: true },
    { to: '/registrar/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/registrar/assign', label: 'Assign Subjects', icon: UserPlus },
  ],
};

// Fades + clips label text when collapsed (desktop only).
// Uses max-width + opacity so the transition is smooth.
function NavLabel({ collapsed, children }) {
  return (
    <span
      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out
        ${collapsed ? 'lg:max-w-0 lg:opacity-0' : 'max-w-xs opacity-100'}`}
    >
      {children}
    </span>
  );
}

export default function Sidebar({ open, onClose, collapsed }) {
  const { user, avatar } = useAuth();
  const navigate = useNavigate();
  const items = links[user?.role] || [];
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      getPendingStudents({ per_page: 1 })
        .then((res) => setBadgeCount(res.data.total || 0))
        .catch(() => {});
    } else if (user?.role === 'registrar') {
      getPendingPayments({ per_page: 1 })
        .then((res) => setBadgeCount(res.data.total || 0))
        .catch(() => {});
    }
  }, [user?.role]);

  const displayName = user?.display_name || user?.email || '';
  const initials = displayName[0]?.toUpperCase() || '?';
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col overflow-hidden
          transform transition-[width,transform] duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          w-64 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b lg:hidden shrink-0">
          <span className="font-bold text-gray-800">Menu</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Profile section — clickable for students to open settings */}
        <div
          className={`p-4 border-b border-gray-100 shrink-0 ${user?.role === 'student' ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
          onClick={user?.role === 'student' ? () => { navigate('/student/settings'); onClose(); } : undefined}
          title={user?.role === 'student' ? 'Profile Settings' : undefined}
        >
          <div className={`flex items-center gap-3 transition-[justify-content] duration-300 ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {avatar
                ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div
              className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out
                ${collapsed ? 'lg:max-w-0 lg:opacity-0' : 'max-w-xs opacity-100'}`}
            >
              <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full whitespace-nowrap">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={label}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                ${collapsed ? 'lg:justify-center' : ''}
                ${isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            >
              <Icon size={20} className="shrink-0" />
              <NavLabel collapsed={collapsed}>{label}</NavLabel>
              {badge && badgeCount > 0 && (
                <span
                  className={`flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 shrink-0
                    ${collapsed ? 'lg:absolute lg:-top-1 lg:-right-1 ml-auto' : 'ml-auto'}`}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  );
}
