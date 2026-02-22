import { useEffect, useState } from 'react';
import { Trash2, Search, ChevronLeft, ChevronRight, Plus, KeyRound, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { getAccounts, createAccount, deleteAccount, resetAccountPassword, getAcademicCalendar, updateAcademicCalendar } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const roleBadge = (role) => {
  const colors = {
    admin: 'bg-purple-100 text-purple-700',
    registrar: 'bg-blue-100 text-blue-700',
    student: 'bg-emerald-100 text-emerald-700',
  };
  return colors[role] || 'bg-gray-100 text-gray-700';
};

const CURRENT_YEAR = new Date().getFullYear();
const SCHOOL_YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - 1 + i;
  return `${y}-${y + 1}`;
});

export default function Settings() {
  const { user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const perPage = 10;

  // Academic Calendar
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendar, setCalendar] = useState({
    school_year: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`,
    semester: '1st',
    enrollment_start: '',
    enrollment_end: '',
    is_open: false,
  });

  const fetchData = () => {
    setLoading(true);
    const params = { page, per_page: perPage };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    getAccounts(params)
      .then((res) => {
        setAccounts(res.data.accounts);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, roleFilter, search]);

  useEffect(() => {
    setCalendarLoading(true);
    getAcademicCalendar()
      .then((res) => {
        const d = res.data;
        setCalendar({
          school_year: d.school_year,
          semester: d.semester,
          enrollment_start: d.enrollment_start || '',
          enrollment_end: d.enrollment_end || '',
          is_open: d.is_open,
        });
      })
      .catch(() => {
        // No calendar set yet — keep defaults
      })
      .finally(() => setCalendarLoading(false));
  }, []);

  const handleCalendarSave = async (e) => {
    e.preventDefault();
    setCalendarSaving(true);
    try {
      const payload = {
        school_year: calendar.school_year,
        semester: calendar.semester,
        enrollment_start: calendar.enrollment_start || null,
        enrollment_end: calendar.enrollment_end || null,
        is_open: calendar.is_open,
      };
      await updateAcademicCalendar(payload);
      toast.success('Academic calendar saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCalendarSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccount(deleteTarget.id);
      toast.success('Account deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setShowCreateConfirm(true);
  };

  const handleCreateConfirm = async () => {
    setShowCreateConfirm(false);
    setCreating(true);
    try {
      await createAccount(form);
      toast.success('Account created successfully');
      setShowModal(false);
      setForm({ email: '', password: '', role: 'student' });
      setPage(1);
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    setShowResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    if (!resetTarget) return;
    setResetting(true);
    try {
      await resetAccountPassword(resetTarget.id, { new_password: newPassword });
      toast.success(`Password reset successfully for ${resetTarget.email}`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">Manage academic calendar and user accounts</p>
      </div>

      {/* Academic Calendar */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={20} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-800">Academic Calendar</h2>
        </div>

        {calendarLoading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleCalendarSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                <select
                  value={calendar.school_year}
                  onChange={(e) => setCalendar({ ...calendar, school_year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  {SCHOOL_YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={calendar.semester}
                  onChange={(e) => setCalendar({ ...calendar, semester: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Start Date</label>
                <input
                  type="date"
                  value={calendar.enrollment_start}
                  onChange={(e) => setCalendar({ ...calendar, enrollment_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment End Date</label>
                <input
                  type="date"
                  value={calendar.enrollment_end}
                  onChange={(e) => setCalendar({ ...calendar, enrollment_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Open / Closed toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div>
                <p className="text-sm font-medium text-gray-700">Enrollment Status</p>
                <p className="text-xs text-gray-500">Toggle to open or close student registration</p>
              </div>
              <button
                type="button"
                onClick={() => setCalendar({ ...calendar, is_open: !calendar.is_open })}
                className="flex items-center gap-2 focus:outline-none"
              >
                {calendar.is_open ? (
                  <>
                    <ToggleRight size={32} className="text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600">Open</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={32} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-500">Closed</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={calendarSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {calendarSaving ? 'Saving...' : 'Save Calendar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filters + Create */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or student number..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="registrar">Registrar</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          <Plus size={16} />
          Create Account
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No accounts found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Account</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {a.display_name || a.email.split('@')[0]}
                          {a.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-gray-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(a.role)}`}>
                          {a.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setResetTarget(a); setNewPassword(''); }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Reset password"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(a)}
                            disabled={a.id === currentUser?.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            title={a.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete account'}
                          >
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

      {/* Create Account Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Account">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Min 8 chars, upper, lower, number, special"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="student">Student</option>
              <option value="registrar">Registrar</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password">
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Resetting password for:</p>
            <p className="text-sm font-semibold text-gray-800">{resetTarget?.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge(resetTarget?.role)}`}>
              {resetTarget?.role}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              placeholder="Min 8 chars, upper, lower, number, special"
            />
            <p className="text-xs text-gray-400 mt-1">The password is shown in plain text so you can share it with the user.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setResetTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Are you sure you want to delete the account "${deleteTarget?.email}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Create Confirmation */}
      <ConfirmModal
        open={showCreateConfirm}
        onClose={() => setShowCreateConfirm(false)}
        onConfirm={handleCreateConfirm}
        title="Create Account"
        message={`Create a new ${form.role} account for "${form.email}"?`}
        confirmText="Create"
        variant="success"
        loading={creating}
      />

      {/* Reset Password Confirmation */}
      <ConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetConfirm}
        title="Reset Password"
        message={`Are you sure you want to reset the password for "${resetTarget?.email}"?`}
        confirmText="Reset Password"
        variant="info"
        loading={resetting}
      />
    </DashboardLayout>
  );
}
