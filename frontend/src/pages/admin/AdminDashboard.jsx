import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, XCircle, AlertTriangle, X, FileText, Download, Eye, Printer } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { getDashboardStats, generateEnrollmentReport } from '../../services/api';

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

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSchoolYear, setReportSchoolYear] = useState('');
  const [reportSemester, setReportSemester] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFilename, setPreviewFilename] = useState('enrollment_report.pdf');

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

  const fetchReportBlob = async () => {
    const params = {};
    if (reportSchoolYear.trim()) params.school_year = reportSchoolYear.trim();
    if (reportSemester) params.semester = reportSemester;
    const res = await generateEnrollmentReport(params);
    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'enrollment_report.pdf';
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    return { url, filename };
  };

  const handlePreview = async () => {
    setReportGenerating(true);
    try {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
      const { url, filename } = await fetchReportBlob();
      setPreviewUrl(url);
      setPreviewFilename(filename);
      setReportModalOpen(false);
    } catch {
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleDownload = async () => {
    setReportGenerating(true);
    try {
      const { url, filename } = await fetchReportBlob();
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
      setReportModalOpen(false);
    } catch {
      toast.error('Failed to download report. Please try again.');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = previewFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const closePreview = useCallback(() => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        <button
          onClick={() => setReportModalOpen(true)}
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group text-left w-full"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Generate Report</h3>
              <p className="text-sm text-gray-500">Download PDF enrollment report</p>
            </div>
          </div>
        </button>
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
      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              <span className="text-sm font-medium">{previewFilename}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadFromPreview}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Download size={15} />
                Download
              </button>
              <button
                onClick={closePreview}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                title="Close preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          {/* PDF iframe */}
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-0"
            title="PDF Preview"
          />
        </div>
      )}

      {/* Generate Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Generate Enrollment Report</h2>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                disabled={reportGenerating}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">
                Leave filters blank to include all records across all school years and semesters.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Year <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025-2026"
                  value={reportSchoolYear}
                  onChange={(e) => setReportSchoolYear(e.target.value)}
                  disabled={reportGenerating}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={reportSemester}
                  onChange={(e) => setReportSemester(e.target.value)}
                  disabled={reportGenerating}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
                >
                  <option value="">All Semesters</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setReportModalOpen(false)}
                disabled={reportGenerating}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={reportGenerating}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reportGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    Preview
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={reportGenerating}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reportGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
