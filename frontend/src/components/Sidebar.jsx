import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, BookOpen, UserPlus, CreditCard, Settings, X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const links = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Application Form', icon: Users },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/pending', label: 'Pending', icon: ClipboardList },
    { to: '/admin/students', label: 'All Students', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  registrar: [
    { to: '/registrar/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/registrar/payments', label: 'Payment Review', icon: CreditCard },
    { to: '/registrar/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/registrar/assign', label: 'Assign Subjects', icon: UserPlus },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = links[user?.role] || [];

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <span className="font-bold text-gray-800">Menu</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
