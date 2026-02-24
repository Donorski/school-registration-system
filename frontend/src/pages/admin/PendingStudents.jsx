import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getPendingStudents, approveStudent, denyStudent } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

export default function PendingStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [denyTarget, setDenyTarget] = useState(null);
  const [denyReason, setDenyReason] = useState('');
  const [denying, setDenying] = useState(false);
  const perPage = 10;

  const fetchData = () => {
    setLoading(true);
    getPendingStudents({ page, per_page: perPage })
      .then((res) => {
        setStudents(res.data.students);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleApprove = async (id) => {
    try {
      await approveStudent(id);
      toast.success('Student approved');
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openDenyModal = (student) => {
    setDenyTarget(student);
    setDenyReason('');
  };

  const handleDenyConfirm = async () => {
    if (!denyTarget) return;
    setDenying(true);
    try {
      await denyStudent(denyTarget.id, denyReason);
      toast.success('Student denied');
      setDenyTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDenying(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pending Registrations</h1>
        <p className="text-gray-500">{total} student(s) awaiting review</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-2" />
            <p>No pending registrations</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Strand</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Grade</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date Applied</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {s.first_name || '—'} {s.last_name || ''}
                        <p className="text-xs text-gray-400 font-normal">{s.email}</p>
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
                      <td className="px-4 py-3">{s.grade_level_to_enroll || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/students/${s.id}`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="View">
                            <Eye size={16} />
                          </Link>
                          <button onClick={() => handleApprove(s.id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Approve">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => openDenyModal(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Deny">
                            <XCircle size={16} />
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
      {/* Deny with Reason Modal */}
      {denyTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Deny Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Denying <strong>{denyTarget.first_name} {denyTarget.last_name}</strong>. Optionally provide a reason so the student knows what to correct.
            </p>
            <textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="e.g. Incomplete documents — PSA birth certificate is missing."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Optional — leave blank if no specific reason.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setDenyTarget(null)}
                disabled={denying}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDenyConfirm}
                disabled={denying}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
              >
                {denying ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                {denying ? 'Denying...' : 'Confirm Deny'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
