import { createContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore user from localStorage immediately to avoid flicker
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Avatar is stored separately per user ID to survive /auth/me refreshes
  const [avatar, setAvatar] = useState(() => {
    const saved = localStorage.getItem('user');
    const u = saved ? JSON.parse(saved) : null;
    return u?.id ? (localStorage.getItem(`user_avatar_${u.id}`) || null) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          // Load avatar for this user
          setAvatar(localStorage.getItem(`user_avatar_${res.data.id}`) || null);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setAvatar(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setAvatar(localStorage.getItem(`user_avatar_${userData.id}`) || null);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAvatar(null);
  }, []);

  const updateAvatar = useCallback((base64DataUrl) => {
    setAvatar((prev) => {
      // Use functional update to access latest user id via closure over setUser
      return base64DataUrl;
    });
    setUser((prev) => {
      if (prev?.id) {
        if (base64DataUrl) {
          localStorage.setItem(`user_avatar_${prev.id}`, base64DataUrl);
        } else {
          localStorage.removeItem(`user_avatar_${prev.id}`);
        }
      }
      return prev;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, avatar, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}
