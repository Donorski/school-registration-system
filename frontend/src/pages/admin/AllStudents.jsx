import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Trash2, Search, ChevronLeft, ChevronRight, FileText, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import { SkeletonRow } from '../../components/SkeletonLoader';
import ConfirmModal from '../../components/ConfirmModal';
import { getAdminStudents, deleteStudent, generateEnrollmentReport } from '../../services/api';
import { statusColor, formatDate, getErrorMessage } from '../../utils/helpers';

export default function AllStudents() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const perPage = 10;

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSchoolYear, setReportSchoolYear] = useState('');
  const [reportSemester, setReportSemester] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFilename, setPreviewFilename] = useState('enrollment_report.pdf');

  useEffect(() => {
    return () => { if (previewUrl) window.URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = () => {
    setLoading(true);
    const params = { page, per_page: perPage };
    if (statusFilter) params.status = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    getAdminStudents(params)
      .then((res) => {
        setStudents(res.data.students);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, statusFilter, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget.id);
      toast.success('Student deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
          <p className="text-gray-500">{total} total student(s)</p>
        </div>
        <button
          onClick={() => setReportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shrink-0"
        >
          <FileText size={16} />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or student number..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {!loading && students.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No students found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Student No.</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Strand</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{s.student_number || <span className="text-gray-400 italic">Pending</span>}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{s.first_name || '—'} {s.last_name || ''}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.enrollment_type ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.enrollment_type === 'NEW_ENROLLEE' ? 'bg-emerald-50 text-emerald-700' :
                            s.enrollment_type === 'TRANSFEREE' ? 'bg-amber-50 text-amber-700' :
                            'bg-purple-50 text-purple-700'
                          }`}>
                            {s.enrollment_type.replace(/_/g, ' ')}
                          </span>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">{s.strand || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/students/${s.id}`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                            <Eye size={16} />
                          </Link>
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.first_name || 'this student'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
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
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-0"
            title="PDF Preview"
          />
        </div>
      )}

      {/* Generate Report Modal */}
      {reportModalOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm animate-backdrop-enter">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-enter">
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
