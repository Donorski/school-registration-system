import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle, XCircle, AlertTriangle, X, FileText, Download, Eye } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { SkeletonCard } from '../../components/SkeletonLoader';
import { getDashboardStats, generateEnrollmentReport } from '../../services/api';
import { useCountUp } from '../../hooks/useCountUp';

function toChartData(obj) {
  return Object.entries(obj || {}).map(([name, value]) => ({ name, value }));
}

function StatCard({ label, value, icon: Icon, iconClass, delay, to }) {
  const count = useCountUp(value);
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-gray-100 p-5 animate-slide-up hover:shadow-md hover:border-emerald-300 transition group block cursor-pointer"
      style={{ animationDelay: delay }}
    >
      <p className="text-sm text-gray-500 group-hover:text-emerald-600 transition">{label}</p>
      <div className="flex items-center gap-3 mt-2">
        <Icon size={20} className={`${iconClass} group-hover:scale-110 transition-transform`} />
        <p className="text-3xl font-bold text-gray-800">{count}</p>
      </div>
      <p className="text-xs text-gray-400 mt-3 group-hover:text-emerald-500 transition">Click to view →</p>
    </Link>
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

  useEffect(() => {
    return () => { if (previewUrl) window.URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

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

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <DashboardLayout>
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

      {/* Charts */}
      {!loading && (
        <>
          {/* Row 1: Donut Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-base font-semibold text-gray-700 mb-1">Application Status</h2>
              <p className="text-xs text-gray-400 mb-4">Breakdown of student application states</p>
              {(() => {
                const statusData = [
                  { name: 'Pending', value: stats?.pending_students || 0 },
                  { name: 'Approved', value: stats?.approved_students || 0 },
                  { name: 'Denied', value: stats?.denied_students || 0 },
                ].filter((d) => d.value > 0);
                return statusData.length > 0 ? (
                  <ReactApexChart
                    type="donut"
                    height={280}
                    series={statusData.map((d) => d.value)}
                    options={{
                      labels: statusData.map((d) => d.name),
                      colors: ['#f59e0b', '#10b981', '#ef4444'],
                      chart: { fontFamily: 'inherit', toolbar: { show: false } },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '65%',
                            labels: {
                              show: true,
                              total: {
                                show: true,
                                label: 'Total',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#6b7280',
                                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0),
                              },
                            },
                          },
                        },
                      },
                      dataLabels: { enabled: false },
                      legend: { position: 'bottom', fontSize: '13px', markers: { radius: 4 } },
                      stroke: { width: 0 },
                      tooltip: { y: { formatter: (v) => `${v} student${v !== 1 ? 's' : ''}` } },
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '180ms' }}>
              <h2 className="text-base font-semibold text-gray-700 mb-1">Enrollment Type</h2>
              <p className="text-xs text-gray-400 mb-4">New enrollee, transferee, and re-enrollee split</p>
              {(() => {
                const enrollmentTypeData = toChartData(stats?.by_enrollment_type);
                return enrollmentTypeData.length > 0 ? (
                  <ReactApexChart
                    type="donut"
                    height={280}
                    series={enrollmentTypeData.map((d) => d.value)}
                    options={{
                      labels: enrollmentTypeData.map((d) => d.name.replace(/_/g, ' ')),
                      colors: ['#10b981', '#f59e0b', '#8b5cf6'],
                      chart: { fontFamily: 'inherit', toolbar: { show: false } },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '65%',
                            labels: {
                              show: true,
                              total: {
                                show: true,
                                label: 'Total',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#6b7280',
                                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0),
                              },
                            },
                          },
                        },
                      },
                      dataLabels: { enabled: false },
                      legend: { position: 'bottom', fontSize: '13px', markers: { radius: 4 } },
                      stroke: { width: 0 },
                      tooltip: { y: { formatter: (v) => `${v} student${v !== 1 ? 's' : ''}` } },
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>
          </div>

          {/* Row 2: Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '260ms' }}>
              <h2 className="text-base font-semibold text-gray-700 mb-1">Students by Strand</h2>
              <p className="text-xs text-gray-400 mb-4">Enrollment count per academic strand</p>
              {(() => {
                const strandData = toChartData(stats?.by_strand);
                return strandData.length > 0 ? (
                  <ReactApexChart
                    type="bar"
                    height={260}
                    series={[{ name: 'Students', data: strandData.map((d) => d.value) }]}
                    options={{
                      chart: { fontFamily: 'inherit', toolbar: { show: false }, sparkline: { enabled: false } },
                      xaxis: { categories: strandData.map((d) => d.name), labels: { style: { fontSize: '12px', colors: '#6b7280' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                      yaxis: { labels: { style: { fontSize: '12px', colors: '#6b7280' } }, forceNiceScale: true },
                      grid: { borderColor: '#f3f4f6', strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
                      plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: true } },
                      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'],
                      dataLabels: { enabled: false },
                      legend: { show: false },
                      tooltip: { y: { formatter: (v) => `${v} student${v !== 1 ? 's' : ''}` } },
                      states: { hover: { filter: { type: 'lighten', value: 0.1 } } },
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up" style={{ animationDelay: '340ms' }}>
              <h2 className="text-base font-semibold text-gray-700 mb-1">By Grade Level</h2>
              <p className="text-xs text-gray-400 mb-4">Students enrolled per grade</p>
              {(() => {
                const gradeData = toChartData(stats?.by_grade_level);
                return gradeData.length > 0 ? (
                  <ReactApexChart
                    type="bar"
                    height={260}
                    series={[{ name: 'Students', data: gradeData.map((d) => d.value) }]}
                    options={{
                      chart: { fontFamily: 'inherit', toolbar: { show: false } },
                      plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '40%', distributed: true } },
                      colors: ['#10b981', '#3b82f6'],
                      xaxis: { categories: gradeData.map((d) => d.name), labels: { style: { fontSize: '12px', colors: '#6b7280' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                      yaxis: { labels: { style: { fontSize: '13px', colors: '#374151', fontWeight: 500 } } },
                      grid: { borderColor: '#f3f4f6', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
                      dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600 }, formatter: (v) => v },
                      legend: { show: false },
                      tooltip: { y: { formatter: (v) => `${v} student${v !== 1 ? 's' : ''}` } },
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/admin/pending"
          className="bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm p-6 hover:bg-emerald-100 hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-200 p-3 rounded-xl group-hover:bg-emerald-300 transition">
              <ClipboardList size={24} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">Pending Registrations</h3>
              <p className="text-sm text-emerald-600">{stats?.pending_students ?? 0} students awaiting review</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/students"
          className="bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm p-6 hover:bg-emerald-100 hover:shadow-md transition group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-200 p-3 rounded-xl group-hover:bg-emerald-300 transition">
              <Users size={24} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">All Students</h3>
              <p className="text-sm text-emerald-600">View and manage all student records</p>
            </div>
          </div>
        </Link>
        <button
          onClick={() => setReportModalOpen(true)}
          className="bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm p-6 hover:bg-emerald-100 hover:shadow-md transition group text-left w-full cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-200 p-3 rounded-xl group-hover:bg-emerald-300 transition">
              <FileText size={24} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">Generate Report</h3>
              <p className="text-sm text-emerald-600">Download PDF enrollment report</p>
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
            <StatCard label="Total Students" value={stats?.total_students ?? 0}   icon={Users}         iconClass="text-emerald-600" delay="0ms"   to="/admin/students" />
            <StatCard label="Pending"        value={stats?.pending_students ?? 0}  icon={ClipboardList} iconClass="text-yellow-500"  delay="80ms"  to="/admin/pending" />
            <StatCard label="Approved"       value={stats?.approved_students ?? 0} icon={CheckCircle}   iconClass="text-green-500"   delay="160ms" to="/admin/students?status=approved" />
            <StatCard label="Denied"         value={stats?.denied_students ?? 0}   icon={XCircle}       iconClass="text-red-500"     delay="240ms" to="/admin/students?status=denied" />
          </>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              <span className="text-sm font-medium">{previewFilename}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadFromPreview}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
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

      {/* Generate Report Modal — rendered via portal to escape CSS transform stacking context */}
      {reportModalOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm animate-backdrop-enter">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Generate Enrollment Report</h2>
                  <p className="text-xs text-emerald-100">Export student data as PDF</p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                disabled={reportGenerating}
                className="p-1.5 hover:bg-white/20 rounded-lg transition disabled:opacity-50 text-white"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  School Year <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025-2026"
                  value={reportSchoolYear}
                  onChange={(e) => setReportSchoolYear(e.target.value)}
                  disabled={reportGenerating}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Semester <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={reportSemester}
                  onChange={(e) => setReportSemester(e.target.value)}
                  disabled={reportGenerating}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 disabled:opacity-60"
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
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
        </div>
      , document.body)}
    </DashboardLayout>
  );
}
