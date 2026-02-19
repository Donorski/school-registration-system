import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}
