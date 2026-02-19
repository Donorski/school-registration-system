import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { getAdminStudents, deleteStudent } from '../../services/api';
import { statusColor, formatDate, getErrorMessage } from '../../utils/helpers';

export default function AllStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const perPage = 10;

  const fetchData = () => {
    setLoading(true);
    const params = { page, per_page: perPage };
    if (statusFilter) params.status = statusFilter;
    getAdminStudents(params)
      .then((res) => {
        setStudents(res.data.students);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

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

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.first_name?.toLowerCase() || '').includes(q) ||
      (s.last_name?.toLowerCase() || '').includes(q) ||
      (s.student_number?.toLowerCase() || '').includes(q)
    );
  });

  const totalPages = Math.ceil(total / perPage);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
        <p className="text-gray-500">{total} total student(s)</p>
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
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No students found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{s.student_number || <span className="text-gray-400 italic">Pending</span>}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{s.first_name || '—'} {s.last_name || ''}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.enrollment_type ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.enrollment_type === 'NEW_ENROLLEE' ? 'bg-blue-50 text-blue-700' :
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
            {totalPages > 1 && (
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
    </DashboardLayout>
  );
}
