import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAuditLogs } from '../../services/api';

const ACTION_COLORS = {
  // Green — positive
  STUDENT_APPROVED: 'bg-green-100 text-green-700',
  PAYMENT_VERIFIED: 'bg-green-100 text-green-700',
  SUBJECT_ASSIGNED: 'bg-green-100 text-green-700',
  BULK_SUBJECTS_ASSIGNED: 'bg-green-100 text-green-700',
  SUBJECT_CREATED: 'bg-green-100 text-green-700',
  ACCOUNT_CREATED: 'bg-green-100 text-green-700',
  // Red — negative
  STUDENT_DENIED: 'bg-red-100 text-red-700',
  STUDENT_DELETED: 'bg-red-100 text-red-700',
  PAYMENT_REJECTED: 'bg-red-100 text-red-700',
  SUBJECT_DELETED: 'bg-red-100 text-red-700',
  SUBJECT_UNASSIGNED: 'bg-red-100 text-red-700',
  ACCOUNT_DELETED: 'bg-red-100 text-red-700',
  // Blue — informational
  APPLICATION_SUBMITTED: 'bg-blue-100 text-blue-700',
  RECEIPT_UPLOADED: 'bg-blue-100 text-blue-700',
  SUBJECT_UPDATED: 'bg-blue-100 text-blue-700',
  CREDITS_UPDATED: 'bg-blue-100 text-blue-700',
  CALENDAR_UPDATED: 'bg-blue-100 text-blue-700',
  PASSWORD_RESET: 'bg-blue-100 text-blue-700',
  // Purple — archive
  ENROLLMENT_ARCHIVED: 'bg-purple-100 text-purple-700',
};

const ROLE_COLORS = {
  admin: 'bg-gray-100 text-gray-700',
  registrar: 'bg-yellow-100 text-yellow-700',
  student: 'bg-emerald-100 text-emerald-700',
};

const ACTION_OPTIONS = [
  'STUDENT_APPROVED', 'STUDENT_DENIED', 'STUDENT_DELETED',
  'ACCOUNT_CREATED', 'ACCOUNT_DELETED', 'PASSWORD_RESET',
  'CALENDAR_UPDATED',
  'PAYMENT_VERIFIED', 'PAYMENT_REJECTED',
  'SUBJECT_CREATED', 'SUBJECT_UPDATED', 'SUBJECT_DELETED',
  'SUBJECT_ASSIGNED', 'SUBJECT_UNASSIGNED', 'BULK_SUBJECTS_ASSIGNED',
  'CREDITS_UPDATED',
  'APPLICATION_SUBMITTED', 'RECEIPT_UPLOADED', 'ENROLLMENT_ARCHIVED',
];

function formatAction(action) {
  return action.replace(/_/g, ' ');
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterAction, setFilterAction] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const perPage = 20;

  const fetchData = () => {
    setLoading(true);
    const params = { page, per_page: perPage };
    if (filterAction) params.action = filterAction;
    if (filterRole) params.role = filterRole;
    if (filterSearch) params.search = filterSearch;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;

    getAuditLogs(params)
      .then((res) => {
        setLogs(res.data.logs);
        setTotal(res.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, filterAction, filterRole, filterSearch, filterDateFrom, filterDateTo]);

  const handleFilterChange = () => {
    setPage(1);
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ScrollText size={24} />
          Audit Logs
        </h1>
        <p className="text-gray-500">{total} event(s) recorded</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Action filter */}
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); handleFilterChange(); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{formatAction(a)}</option>
            ))}
          </select>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); handleFilterChange(); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="registrar">Registrar</option>
            <option value="student">Student</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search email or target…"
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); handleFilterChange(); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />

          {/* Date from */}
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); handleFilterChange(); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />

          {/* Date to */}
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); handleFilterChange(); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ScrollText size={40} className="mx-auto mb-2" />
            <p>No audit log entries found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Date / Time</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Target</th>
                    <th className="px-4 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-[180px] truncate" title={log.user_email}>
                        {log.user_email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[log.user_role] || 'bg-gray-100 text-gray-600'}`}>
                          {log.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={log.target_name || ''}>
                        {log.target_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
                <span>
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
