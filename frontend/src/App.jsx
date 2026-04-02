import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import PageTransition from './components/PageTransition';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentSettings = lazy(() => import('./pages/student/StudentSettings'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const PendingStudents = lazy(() => import('./pages/admin/PendingStudents'));
const AllStudents = lazy(() => import('./pages/admin/AllStudents'));
const StudentDetails = lazy(() => import('./pages/admin/StudentDetails'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const Announcements = lazy(() => import('./pages/admin/Announcements'));
const RegistrarDashboard = lazy(() => import('./pages/registrar/RegistrarDashboard'));
const Subjects = lazy(() => import('./pages/registrar/Subjects'));
const AssignSubjects = lazy(() => import('./pages/registrar/AssignSubjects'));
const PaymentReview = lazy(() => import('./pages/registrar/PaymentReview'));
const Notifications = lazy(() => import('./pages/Notifications'));

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;

  const getHomeRedirect = () => {
    if (!user) return '/login';
    const routes = { student: '/student/dashboard', admin: '/admin/dashboard', registrar: '/registrar/dashboard' };
    return routes[user.role] || '/login';
  };

  return (
    <PageTransition>
    <Suspense fallback={<LoadingSpinner size="lg" />}>
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
      <Route path="/admin/announcements" element={<PrivateRoute roles={['admin']}><Announcements /></PrivateRoute>} />
      <Route path="/admin/settings" element={<PrivateRoute roles={['admin']}><Settings /></PrivateRoute>} />

      {/* Registrar */}
      <Route path="/registrar/dashboard" element={<PrivateRoute roles={['registrar']}><RegistrarDashboard /></PrivateRoute>} />
      <Route path="/registrar/subjects" element={<PrivateRoute roles={['registrar']}><Subjects /></PrivateRoute>} />
      <Route path="/registrar/payments" element={<PrivateRoute roles={['registrar']}><PaymentReview /></PrivateRoute>} />
      <Route path="/registrar/assign" element={<PrivateRoute roles={['registrar']}><AssignSubjects /></PrivateRoute>} />

      {/* Notifications — shared across all roles */}
      <Route path="/notifications" element={<PrivateRoute roles={['student', 'admin', 'registrar']}><Notifications /></PrivateRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={getHomeRedirect()} replace />} />
    </Routes>
    </Suspense>
    </PageTransition>
  );
}
