import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, UserPlus, CreditCard } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
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

export default function RegistrarDashboard() {
  const [subjectCount, setSubjectCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSubjects(),
      getApprovedStudents({ per_page: 1 }),
      getPendingPayments({ per_page: 1 }),
    ])
      .then(([subjectsRes, studentsRes, paymentsRes]) => {
        setSubjectCount(subjectsRes.data.length);
        setStudentCount(studentsRes.data.total);
        setPendingPaymentCount(paymentsRes.data.total);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon, color }, i) => (
          <StatCard key={label} label={label} value={value} icon={icon} color={color} delay={`${i * 80}ms`} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </DashboardLayout>
  );
}
