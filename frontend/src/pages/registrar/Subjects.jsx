import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const PER_PAGE = 20;

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [strandFilter, setStrandFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const totalPages = Math.ceil(total / PER_PAGE);

  const fetchData = (p = page, isPageChange = false) => {
    if (isPageChange) {
      const timer = setTimeout(() => setPageLoading(true), 150);
      const params = { page: p, per_page: PER_PAGE };
      if (strandFilter) params.strand = strandFilter;
      if (gradeFilter) params.grade_level = gradeFilter;
      if (semesterFilter) params.semester = semesterFilter;
      getSubjects(params)
        .then((res) => {
          setSubjects(res.data.subjects);
          setTotal(res.data.total);
        })
        .finally(() => {
          clearTimeout(timer);
          setPageLoading(false);
        });
    } else {
      setLoading(true);
      const params = { page: p, per_page: PER_PAGE };
      if (strandFilter) params.strand = strandFilter;
      if (gradeFilter) params.grade_level = gradeFilter;
      if (semesterFilter) params.semester = semesterFilter;
      getSubjects(params)
        .then((res) => {
          setSubjects(res.data.subjects);
          setTotal(res.data.total);
        })
        .finally(() => setLoading(false));
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1); // page useEffect will trigger fetchData
    } else {
      fetchData(1);
    }
  }, [strandFilter, gradeFilter, semesterFilter]);

  useEffect(() => {
    fetchData(page, page !== 1);
  }, [page]);

  const openAdd = () => {
    setEditing(null);
    reset({ subject_code: '', subject_name: '', schedule: '', strand: 'ABM', grade_level: 'Grade 11', semester: '1st Semester', max_students: 40 });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    reset(s);
    setModalOpen(true);
  };

  const onSubmit = (data) => {
    data.max_students = parseInt(data.max_students);
    setPendingSubmit(data);
  };

  const handleSaveConfirm = async () => {
    if (!pendingSubmit) return;
    setSaving(true);
    try {
      if (editing) {
        await updateSubject(editing.id, pendingSubmit);
        toast.success('Subject updated');
      } else {
        await createSubject(pendingSubmit);
        toast.success('Subject created');
      }
      setModalOpen(false);
      setPendingSubmit(null);
      fetchData(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget.id);
      toast.success('Subject deleted');
      setDeleteTarget(null);
      // If last item on page, go back one page
      const newPage = subjects.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      fetchData(newPage);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <p className="text-gray-500">{total} subject{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={strandFilter} onChange={(e) => setStrandFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">All Strands</option>
          <option value="ABM">ABM</option>
          <option value="HUMSS">HUMSS</option>
          <option value="GAS">GAS</option>
          <option value="CSS">CSS</option>
          <option value="EIM">EIM</option>
          <option value="EPAS">EPAS</option>
          <option value="PROG">PROG</option>
        </select>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">All Grades</option>
          <option value="Grade 11">Grade 11</option>
          <option value="Grade 12">Grade 12</option>
        </select>
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">All Semesters</option>
          <option value="1st Semester">1st Semester</option>
          <option value="2nd Semester">2nd Semester</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : subjects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No subjects found</div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${pageLoading ? 'opacity-40' : 'opacity-100'}`}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Subject Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Schedule</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Strand</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Grade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Semester</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Enrolled</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-emerald-600">{s.subject_code}</td>
                    <td className="px-4 py-3">{s.subject_name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.schedule}</td>
                    <td className="px-4 py-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">{s.strand}</span></td>
                    <td className="px-4 py-3">{s.grade_level}</td>
                    <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{s.semester}</span></td>
                    <td className="px-4 py-3">{s.enrolled_count}/{s.max_students}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit size={16} /></button>
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    p === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
            <input {...register('subject_code', { required: 'Required' })} className={inputClass} placeholder="e.g. ABM11S1CO01" />
            {errors.subject_code && <p className="text-red-500 text-xs mt-1">{errors.subject_code.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input {...register('subject_name', { required: 'Required' })} className={inputClass} placeholder="e.g. General Chemistry 1" />
            {errors.subject_name && <p className="text-red-500 text-xs mt-1">{errors.subject_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
            <input type="number" {...register('max_students', { required: 'Required', min: 1 })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
            <input {...register('schedule', { required: 'Required' })} className={inputClass} placeholder="e.g. MWF 9:00-10:00 AM" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
              <select {...register('strand')} className={inputClass}>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="GAS">GAS</option>
                <option value="CSS">CSS</option>
                <option value="EIM">EIM</option>
                <option value="EPAS">EPAS</option>
                <option value="PROG">PROG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
              <select {...register('grade_level')} className={inputClass}>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select {...register('semester')} className={inputClass}>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {editing ? 'Update Subject' : 'Create Subject'}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message={`Are you sure you want to delete subject "${deleteTarget?.subject_code}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      {/* Save Confirmation */}
      <ConfirmModal
        open={!!pendingSubmit}
        onClose={() => setPendingSubmit(null)}
        onConfirm={handleSaveConfirm}
        title={editing ? 'Update Subject' : 'Create Subject'}
        message={editing ? `Save changes to subject "${pendingSubmit?.subject_code}"?` : `Create new subject "${pendingSubmit?.subject_code}"?`}
        confirmText={editing ? 'Update' : 'Create'}
        variant="success"
        loading={saving}
      />
    </DashboardLayout>
  );
}
