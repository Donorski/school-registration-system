import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, CheckCircle, XCircle, CreditCard,
  BookOpen, FileText, User, AlertCircle, ExternalLink,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { NotificationContext } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';

// Maps notification type + user role → destination route
const NOTIF_LINKS = {
  // Student receives these
  application_approved: { student: '/student/dashboard' },
  application_denied:   { student: '/student/profile' },
  payment_verified:     { student: '/student/dashboard' },
  payment_rejected:     { student: '/student/dashboard' },
  subjects_assigned:    { student: '/student/dashboard' },
  // Admin receives these
  new_form_submitted:   { admin: '/admin/pending' },
  // Registrar receives these
  student_approved:     { registrar: '/registrar/payments' },
  new_receipt_uploaded: { registrar: '/registrar/payments' },
};

function getLinkForNotif(type, role) {
  return NOTIF_LINKS[type]?.[role] || null;
}

const TYPE_META = {
  application_approved: { icon: CheckCircle,  style: 'bg-green-100 text-green-600' },
  application_denied:   { icon: XCircle,      style: 'bg-red-100 text-red-600' },
  payment_verified:     { icon: CreditCard,   style: 'bg-green-100 text-green-600' },
  payment_rejected:     { icon: AlertCircle,  style: 'bg-red-100 text-red-600' },
  subjects_assigned:    { icon: BookOpen,     style: 'bg-emerald-100 text-emerald-600' },
  new_form_submitted:   { icon: FileText,     style: 'bg-yellow-100 text-yellow-600' },
  new_receipt_uploaded: { icon: CreditCard,   style: 'bg-purple-100 text-purple-600' },
  student_approved:     { icon: User,         style: 'bg-green-100 text-green-600' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Notifications() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useContext(NotificationContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              filter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
              filter === 'unread' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading notifications...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === 'unread'
                  ? 'Switch to "All" to see your history'
                  : "You'll be notified about important updates here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((notif) => {
                const meta = TYPE_META[notif.type] || { icon: Bell, style: 'bg-gray-100 text-gray-500' };
                const Icon = meta.icon;
                const link = getLinkForNotif(notif.type, user?.role);

                const handleClick = async () => {
                  if (!notif.is_read) await markAsRead(notif.id);
                  if (link) navigate(link);
                };

                return (
                  <div
                    key={notif.id}
                    onClick={handleClick}
                    className={`flex items-start gap-4 px-5 py-4 transition hover:bg-gray-50 ${
                      link ? 'cursor-pointer' : 'cursor-default'
                    } ${!notif.is_read ? 'bg-emerald-50/40' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.style}`}>
                      <Icon size={18} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </p>
                        {link && (
                          <ExternalLink size={12} className="text-gray-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 leading-snug">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notif.created_at)}</p>
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div className="mt-2 w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
