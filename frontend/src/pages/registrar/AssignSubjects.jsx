import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Search, User, CheckCircle, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { getApprovedStudents, getSubjects, assignSubject, unassignSubject, getStudentCompleteInfo, getStudentEnrolledSubjects, bulkAssignSubjects } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

const enrollmentTypeBadge = (type) => {
  if (!type) return null;
  const colors = {
    NEW_ENROLLEE: 'bg-blue-50 text-blue-700',
    TRANSFEREE: 'bg-amber-50 text-amber-700',
    RE_ENROLLEE: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
};

export default function AssignSubjects() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [strandFilter, setStrandFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const fetchStudents = () => {
    setLoading(true);
    const params = { per_page: 100, payment_status: 'verified' };
    if (strandFilter) params.strand = strandFilter;
    if (gradeFilter) params.grade_level = gradeFilter;
    if (typeFilter) params.enrollment_type = typeFilter;
    if (searchQuery) params.search = searchQuery;
    getApprovedStudents(params)
      .then((res) => setStudents(res.data.students))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, [strandFilter, gradeFilter, typeFilter, searchQuery]);

  const handleSelectStudent = async (studentId) => {
    if (!studentId) {
      setSelectedStudent(null);
      setStudentDetail(null);
      setSubjects([]);
      setEnrolledSubjects([]);
      return;
    }

    setSelectedStudent(studentId);
    try {
      const [infoRes, enrolledRes] = await Promise.all([
        getStudentCompleteInfo(studentId),
        getStudentEnrolledSubjects(studentId),
      ]);
      const student = infoRes.data;
      setStudentDetail(student);
      setEnrolledSubjects(enrolledRes.data.subject_ids || []);

      // Get subjects matching student's strand, grade, and semester
      const params = {};
      if (student.strand) params.strand = student.strand;
      if (student.grade_level_to_enroll) params.grade_level = student.grade_level_to_enroll;
      if (student.semester) params.semester = student.semester;
      const subjectsRes = await getSubjects(params);
      setSubjects(subjectsRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const refreshSubjects = async () => {
    if (!studentDetail) return;
    const params = {};
    if (studentDetail.strand) params.strand = studentDetail.strand;
    if (studentDetail.grade_level_to_enroll) params.grade_level = studentDetail.grade_level_to_enroll;
    if (studentDetail.semester) params.semester = studentDetail.semester;
    const [subjectsRes, enrolledRes] = await Promise.all([
      getSubjects(params),
      getStudentEnrolledSubjects(selectedStudent),
    ]);
    setSubjects(subjectsRes.data);
    setEnrolledSubjects(enrolledRes.data.subject_ids || []);
  };

  const handleAssign = async (subjectId) => {
    setAssigning(true);
    try {
      await assignSubject({ student_id: parseInt(selectedStudent), subject_id: subjectId });
      toast.success('Subject assigned');
      await refreshSubjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (subjectId) => {
    try {
      await unassignSubject({ student_id: parseInt(selectedStudent), subject_id: subjectId });
      toast.success('Subject removed');
      await refreshSubjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const unassignedSubjects = subjects.filter((s) => !enrolledSubjects.includes(s.id) && s.enrolled_count < s.max_students);

  const handleBulkAssign = async () => {
    setShowBulkConfirm(false);
    setBulkAssigning(true);
    try {
      const subjectIds = unassignedSubjects.map((s) => s.id);
      const res = await bulkAssignSubjects({ student_id: parseInt(selectedStudent), subject_ids: subjectIds });
      toast.success(res.data.message);
      await refreshSubjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBulkAssigning(false);
    }
  };

  const enrolledCount = enrolledSubjects.length;
  const totalSubjects = subjects.length;

  if (loading && students.length === 0) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assign Subjects</h1>
        <p className="text-gray-500">Select a student and assign subjects to them</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selector */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Student</h2>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or student no..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <select
              value={strandFilter}
              onChange={(e) => { setStrandFilter(e.target.value); setSelectedStudent(null); setStudentDetail(null); }}
              className="flex-1 border border-gray-300 rounded-lg text-xs px-2 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Strands</option>
              <option value="STEM">STEM</option>
              <option value="ABM">ABM</option>
              <option value="HUMSS">HUMSS</option>
              <option value="GAS">GAS</option>
              <option value="TVL-ICT">TVL-ICT</option>
              <option value="TVL-HE">TVL-HE</option>
              <option value="TVL-IA">TVL-IA</option>
              <option value="TVL-AFA">TVL-AFA</option>
              <option value="SPORTS">Sports</option>
              <option value="ARTS">Arts</option>
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setSelectedStudent(null); setStudentDetail(null); }}
              className="border border-gray-300 rounded-lg text-xs px-2 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Grades</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          {/* Enrollment Type Filter */}
          <div className="mb-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setSelectedStudent(null); setStudentDetail(null); }}
              className="w-full border border-gray-300 rounded-lg text-xs px-2 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">All Types</option>
              <option value="NEW_ENROLLEE">New Enrollee</option>
              <option value="TRANSFEREE">Transferee</option>
              <option value="RE_ENROLLEE">Re-Enrollee</option>
            </select>
          </div>

          {/* Student List */}
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {loading ? (
              <LoadingSpinner />
            ) : students.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">No students found</p>
            ) : (
              students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition flex items-center gap-3 ${
                    selectedStudent == s.id
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {s.student_photo_path ? (
                    <img src={`/uploads/${s.student_photo_path}`} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                      <User size={16} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.first_name || '—'} {s.last_name || ''}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-gray-400">{s.student_number || 'No ID'}</span>
                      {enrollmentTypeBadge(s.enrollment_type)}
                    </div>
                    <p className="text-[10px] text-gray-400">{s.strand || '—'} | {s.grade_level_to_enroll || '—'}{s.semester ? ` | ${s.semester}` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Available Subjects */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          {studentDetail && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {studentDetail.student_photo_path ? (
                  <img
                    src={`/uploads/${studentDetail.student_photo_path}`}
                    alt="Student Photo"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {studentDetail.first_name} {studentDetail.last_name}
                    </h2>
                    {enrollmentTypeBadge(studentDetail.enrollment_type)}
                  </div>
                  <p className="text-sm text-gray-500">{studentDetail.student_number || 'No ID yet'} | {studentDetail.strand} - {studentDetail.grade_level_to_enroll}{studentDetail.semester ? ` | ${studentDetail.semester}` : ''}</p>
                </div>
              </div>
              {/* Progress indicator */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{enrolledCount}/{totalSubjects} assigned</p>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                  <div
                    className="h-1.5 bg-emerald-500 rounded-full transition-all"
                    style={{ width: totalSubjects > 0 ? `${(enrolledCount / totalSubjects) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assign All button */}
          {studentDetail && unassignedSubjects.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={bulkAssigning}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {bulkAssigning ? <Loader2 size={16} className="animate-spin" /> : <ListChecks size={16} />}
                {bulkAssigning ? 'Assigning...' : `Assign All ${unassignedSubjects.length} Remaining`}
              </button>
            </div>
          )}

          {studentDetail && enrolledCount === totalSubjects && totalSubjects > 0 && (
            <div className="flex items-center gap-2 mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <CheckCircle size={16} />
              <span>All subjects have been assigned to this student.</span>
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Available Subjects
          </h2>

          {!selectedStudent ? (
            <div className="text-center py-12 text-gray-400">
              <p>Select a student to see available subjects</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No subjects found for this strand/grade</p>
              <p className="text-xs mt-1">Make sure you've created subjects for {studentDetail?.strand} — {studentDetail?.grade_level_to_enroll}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left pb-3 font-medium text-gray-500">Code</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Subject</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Units</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Schedule</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Slots</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => {
                    const isEnrolled = enrolledSubjects.includes(s.id);
                    const isFull = s.enrolled_count >= s.max_students;
                    return (
                      <tr key={s.id} className={`border-b last:border-0 ${isEnrolled ? 'bg-emerald-50/50' : ''}`}>
                        <td className="py-3 font-medium text-emerald-600">{s.subject_code}</td>
                        <td className="py-3">{s.subject_name}</td>
                        <td className="py-3">{s.units}</td>
                        <td className="py-3 text-gray-500">{s.schedule}</td>
                        <td className="py-3">{s.enrolled_count}/{s.max_students}</td>
                        <td className="py-3 text-right">
                          {isEnrolled ? (
                            <button
                              onClick={() => handleUnassign(s.id)}
                              className="inline-flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium"
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssign(s.id)}
                              disabled={assigning || isFull}
                              className="inline-flex items-center gap-1 text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium disabled:opacity-30"
                            >
                              {assigning ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              {isFull ? 'Full' : 'Assign'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-3 text-right text-sm text-gray-500">
                Total Units: {subjects.filter((s) => enrolledSubjects.includes(s.id)).reduce((sum, s) => sum + s.units, 0)} / {subjects.reduce((sum, s) => sum + s.units, 0)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Assign Confirmation */}
      <ConfirmModal
        open={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkAssign}
        title="Assign All Subjects"
        message={`Assign all ${unassignedSubjects.length} remaining subject(s) to ${studentDetail?.first_name || 'this student'}? Already assigned subjects will be skipped.`}
        confirmText="Assign All"
        variant="success"
        loading={bulkAssigning}
      />
    </DashboardLayout>
  );
}
