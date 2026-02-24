import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentSettings from './pages/student/StudentSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingStudents from './pages/admin/PendingStudents';
import AllStudents from './pages/admin/AllStudents';
import StudentDetails from './pages/admin/StudentDetails';
import Settings from './pages/admin/Settings';
import AuditLogs from './pages/admin/AuditLogs';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import Subjects from './pages/registrar/Subjects';
import AssignSubjects from './pages/registrar/AssignSubjects';
import PaymentReview from './pages/registrar/PaymentReview';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;

  const getHomeRedirect = () => {
    if (!user) return '/login';
    const routes = { student: '/student/dashboard', admin: '/admin/dashboard', registrar: '/registrar/dashboard' };
    return routes[user.role] || '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/profile" element={<PrivateRoute roles={['student']}><StudentProfile /></PrivateRoute>} />
      <Route path="/student/settings" element={<PrivateRoute roles={['student']}><StudentSettings /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/pending" element={<PrivateRoute roles={['admin']}><PendingStudents /></PrivateRoute>} />
      <Route path="/admin/students" element={<PrivateRoute roles={['admin']}><AllStudents /></PrivateRoute>} />
      <Route path="/admin/students/:id" element={<PrivateRoute roles={['admin']}><StudentDetails /></PrivateRoute>} />
      <Route path="/admin/audit-logs" element={<PrivateRoute roles={['admin']}><AuditLogs /></PrivateRoute>} />
      <Route path="/admin/settings" element={<PrivateRoute roles={['admin']}><Settings /></PrivateRoute>} />

      {/* Registrar */}
      <Route path="/registrar/dashboard" element={<PrivateRoute roles={['registrar']}><RegistrarDashboard /></PrivateRoute>} />
      <Route path="/registrar/subjects" element={<PrivateRoute roles={['registrar']}><Subjects /></PrivateRoute>} />
      <Route path="/registrar/payments" element={<PrivateRoute roles={['registrar']}><PaymentReview /></PrivateRoute>} />
      <Route path="/registrar/assign" element={<PrivateRoute roles={['registrar']}><AssignSubjects /></PrivateRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
  );
}
