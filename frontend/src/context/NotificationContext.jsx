import { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/api';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext(null);

const POLL_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch {
      // silently fail — polling will retry
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  // Poll for unread count when user is logged in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
