import { useState, useEffect, useRef, useContext } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';

const TYPE_STYLES = {
  application_approved: 'bg-green-100 text-green-600',
  application_denied: 'bg-red-100 text-red-600',
  payment_verified: 'bg-green-100 text-green-600',
  payment_rejected: 'bg-red-100 text-red-600',
  subjects_assigned: 'bg-blue-100 text-blue-600',
  new_form_submitted: 'bg-yellow-100 text-yellow-600',
  new_receipt_uploaded: 'bg-purple-100 text-purple-600',
  student_approved: 'bg-green-100 text-green-600',
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useContext(NotificationContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                    !notif.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                  }}
                >
                  {/* Type dot */}
                  <div
                    className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      TYPE_STYLES[notif.type] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Bell size={14} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                  </div>

                  {/* Unread indicator */}
                  {!notif.is_read && (
                    <div className="mt-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
