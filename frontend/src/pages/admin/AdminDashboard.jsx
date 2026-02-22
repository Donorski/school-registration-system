import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '../../components/DashboardLayout';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { getDashboardStats } from '../../services/api';

/** Animates a number from 0 to `target` over `duration` ms using ease-out cubic. */
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

const STATUS_COLORS = ['#f59e0b', '#22c55e', '#ef4444'];
const STRAND_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
const ENROLLMENT_COLORS = ['#10b981', '#f59e0b', '#8b5cf6'];

function toChartData(obj) {
  return Object.entries(obj || {}).map(([name, value]) => ({ name, value }));
}

function StatCard({ label, value, icon: Icon, iconClass, delay }) {
  const count = useCountUp(value);
  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <div className="flex items-center gap-3 mt-2">
        <Icon size={20} className={iconClass} />
        <p className="text-3xl font-bold text-gray-800">{count}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-sm">
          <p className="font-medium text-gray-800">{payload[0].name}</p>
          <p className="text-gray-600">{payload[0].value} student{payload[0].value !== 1 ? 's' : ''}</p>
        </div>
      );
    }
    return null;
  };

  const renderPieLabel = ({ name, percent }) =>
    percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : '';

  const pendingCount = stats?.pending_students ?? 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of student registrations</p>
      </div>

      {/* Pending alert banner */}
      {!loading && pendingCount > 0 && !alertDismissed && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm">
              You have{' '}
              <span className="font-bold">{pendingCount}</span>{' '}
              pending application{pendingCount !== 1 ? 's' : ''} awaiting review.{' '}
              <Link to="/admin/pending" className="underline font-medium hover:text-amber-900">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/admin/pending"
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-xl group-hover:bg-yellow-200 transition">
              <ClipboardList size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Pending Registrations</h3>
              <p className="text-sm text-gray-500">{stats?.pending_students ?? 0} students awaiting review</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/students"
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-200 transition">
              <Users size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">All Students</h3>
              <p className="text-sm text-gray-500">View and manage all student records</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard label="Total Students" value={stats?.total_students ?? 0}   icon={Users}         iconClass="text-emerald-600" delay="0ms"   />
            <StatCard label="Pending"        value={stats?.pending_students ?? 0}  icon={ClipboardList} iconClass="text-yellow-500"  delay="80ms"  />
            <StatCard label="Approved"       value={stats?.approved_students ?? 0} icon={CheckCircle}   iconClass="text-green-500"   delay="160ms" />
            <StatCard label="Denied"         value={stats?.denied_students ?? 0}   icon={XCircle}       iconClass="text-red-500"     delay="240ms" />
          </>
        )}
      </div>

      {!loading && (
        <>
          {/* Row 1: Status Pie + Strand Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Application Status</h2>
              {(() => {
                const statusData = [
                  { name: 'Pending', value: stats?.pending_students || 0 },
                  { name: 'Approved', value: stats?.approved_students || 0 },
                  { name: 'Denied', value: stats?.denied_students || 0 },
                ].filter((d) => d.value > 0);
                return statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        dataKey="value"
                        label={renderPieLabel}
                        labelLine={false}
                        isAnimationActive
                        animationBegin={300}
                        animationDuration={900}
                        animationEasing="ease-out"
                      >
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 animate-slide-up" style={{ animationDelay: '180ms' }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Students by Strand</h2>
              {(() => {
                const strandData = toChartData(stats?.by_strand);
                return strandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={strandData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationBegin={300} animationDuration={700} animationEasing="ease-out">
                        {strandData.map((_, i) => (
                          <Cell key={i} fill={STRAND_COLORS[i % STRAND_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>
          </div>

          {/* Row 2: Grade Level + Enrollment Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6 animate-slide-up" style={{ animationDelay: '260ms' }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">By Grade Level</h2>
              {(() => {
                const gradeData = toChartData(stats?.by_grade_level);
                return gradeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={gradeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} isAnimationActive animationBegin={300} animationDuration={700} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 animate-slide-up" style={{ animationDelay: '340ms' }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Type</h2>
              {(() => {
                const enrollmentTypeData = toChartData(stats?.by_enrollment_type);
                return enrollmentTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={enrollmentTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                        label={renderPieLabel}
                        labelLine={false}
                        isAnimationActive
                        animationBegin={300}
                        animationDuration={900}
                        animationEasing="ease-out"
                      >
                        {enrollmentTypeData.map((_, i) => (
                          <Cell key={i} fill={ENROLLMENT_COLORS[i % ENROLLMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
