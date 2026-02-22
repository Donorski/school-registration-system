import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, UserPlus, CreditCard, AlertTriangle, X, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { getSubjects, getApprovedStudents, getPendingPayments } from '../../services/api';

function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

function StatCard({ label, value, icon: Icon, color, delay }) {
  const count = useCountUp(value);
  return (
    <div
      className="bg-white rounded-xl shadow-sm border p-5 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{count}</p>
        </div>
        <div className={`${color} p-3 rounded-xl`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function StudentInitials({ name }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function RegistrarDashboard() {
  const [subjectCount, setSubjectCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [recentVerified, setRecentVerified] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    Promise.all([
      getSubjects(),
      getApprovedStudents({ per_page: 1 }),
      getPendingPayments({ per_page: 1 }),
      getApprovedStudents({ payment_status: 'verified', per_page: 5 }),
    ])
      .then(([subjectsRes, studentsRes, paymentsRes, verifiedRes]) => {
        setSubjectCount(subjectsRes.data.length);
        setStudentCount(studentsRes.data.total);
        setPendingPaymentCount(paymentsRes.data.total);
        setRecentVerified(verifiedRes.data.students || verifiedRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Subjects', value: subjectCount, icon: BookOpen, color: 'bg-emerald-600' },
    { label: 'Approved Students', value: studentCount, icon: Users, color: 'bg-green-500' },
    { label: 'Pending Payments', value: pendingPaymentCount, icon: CreditCard, color: 'bg-amber-500' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Registrar Dashboard</h1>
        <p className="text-gray-500">Manage subjects and student enrollment</p>
      </div>

      {/* Pending payment alert banner */}
      {!loading && pendingPaymentCount > 0 && !alertDismissed && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm">
              You have{' '}
              <span className="font-bold">{pendingPaymentCount}</span>{' '}
              payment receipt{pendingPaymentCount !== 1 ? 's' : ''} pending verification.{' '}
              <Link to="/registrar/payments" className="underline font-medium hover:text-amber-900">
                Review now
              </Link>
            </p>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            title="Dismiss"
            className="p-1 hover:bg-amber-100 rounded-lg transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          cards.map(({ label, value, icon, color }, i) => (
            <StatCard key={label} label={label} value={value} icon={icon} color={color} delay={`${i * 80}ms`} />
          ))
        )}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/registrar/payments"
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group animate-slide-up"
          style={{ animationDelay: '160ms' }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl group-hover:bg-amber-200 transition">
              <CreditCard size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Payment Review</h3>
              <p className="text-sm text-gray-500">Verify student payment receipts</p>
            </div>
          </div>
        </Link>
        <Link
          to="/registrar/subjects"
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group animate-slide-up"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-200 transition">
              <BookOpen size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Manage Subjects</h3>
              <p className="text-sm text-gray-500">Create, edit, and delete subjects</p>
            </div>
          </div>
        </Link>
        <Link
          to="/registrar/assign"
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group animate-slide-up"
          style={{ animationDelay: '320ms' }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition">
              <UserPlus size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Assign Subjects</h3>
              <p className="text-sm text-gray-500">Enroll students into subjects</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent activity feed */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Recently Verified Students</h2>
          </div>
          {recentVerified.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={36} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No verified students yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVerified.map((student) => {
                const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ') || student.email || 'Unknown';
                return (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <StudentInitials name={fullName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{fullName}</p>
                      <p className="text-xs text-gray-400">{student.student_number || 'No student number'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle size={11} />
                      Payment verified
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
