import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Loader2, Search, User, CheckCircle, ListChecks, Printer, X, BookMarked, AlertCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import PrintableClassList from '../../components/PrintableClassList';
import { getApprovedStudents, getSubjects, assignSubject, unassignSubject, getStudentCompleteInfo, getStudentEnrolledSubjects, bulkAssignSubjects, getClassList, updateTransfereeCreditStatus } from '../../services/api';
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
  const [transfereeSubjectsDraft, setTransfereeSubjectsDraft] = useState([]);
  const [savingCredits, setSavingCredits] = useState(false);

  // Class list
  const [showClassListPicker, setShowClassListPicker] = useState(false);
  const [clStrand, setClStrand] = useState('STEM');
  const [clGrade, setClGrade] = useState('Grade 11');
  const [clSemester, setClSemester] = useState('');
  const [classListStudents, setClassListStudents] = useState([]);
  const [showClassList, setShowClassList] = useState(false);
  const [loadingClassList, setLoadingClassList] = useState(false);
  const classListRef = useRef(null);

  const handlePrintClassList = useReactToPrint({
    contentRef: classListRef,
    documentTitle: `ClassList-${clStrand}-${clGrade}`,
    pageStyle: `@page { size: A4 portrait; margin: 0; } body { margin: 0; }`,
  });

  const handleGenerateClassList = async () => {
    setLoadingClassList(true);
    try {
      const params = { strand: clStrand, grade_level: clGrade };
      if (clSemester) params.semester = clSemester;
      const res = await getClassList(params);
      setClassListStudents(res.data);
      setShowClassListPicker(false);
      setShowClassList(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingClassList(false);
    }
  };

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
      setTransfereeSubjectsDraft([]);
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
      setTransfereeSubjectsDraft(student.transferee_subjects || []);

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

  const handleSaveCredits = async () => {
    setSavingCredits(true);
    try {
      await updateTransfereeCreditStatus(selectedStudent, { subjects: transfereeSubjectsDraft });
      toast.success('Credit statuses saved successfully');
      // Refresh student detail to sync
      const infoRes = await getStudentCompleteInfo(selectedStudent);
      setTransfereeSubjectsDraft(infoRes.data.transferee_subjects || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingCredits(false);
    }
  };

  if (loading && students.length === 0) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assign Subjects</h1>
          <p className="text-gray-500">Select a student and assign subjects to them</p>
        </div>
        <button
          onClick={() => setShowClassListPicker(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Printer size={16} />
          Print Class List
        </button>
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

      {/* Transferee Credit Review Panel */}
      {studentDetail && studentDetail.enrollment_type === 'TRANSFEREE' && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookMarked size={20} className="text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Transferee Credit Evaluation
                </h2>
                <p className="text-xs text-gray-500">
                  Review subjects from {studentDetail.last_school_attended || 'previous school'} and mark each as credited or not.
                </p>
              </div>
            </div>
            {transfereeSubjectsDraft.length > 0 && (
              <button
                onClick={handleSaveCredits}
                disabled={savingCredits}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {savingCredits ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {savingCredits ? 'Saving...' : 'Save Credit Decisions'}
              </button>
            )}
          </div>

          {transfereeSubjectsDraft.length === 0 ? (
            <div className="text-center py-8 bg-amber-50 rounded-xl border border-dashed border-amber-200">
              <BookMarked size={32} className="mx-auto mb-2 text-amber-300" />
              <p className="text-sm text-gray-500">This student has not submitted any previous school subjects yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left pb-3 font-medium text-gray-500">Subject Name</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Code</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Units</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Grade</th>
                      <th className="text-left pb-3 font-medium text-gray-500">Credit Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfereeSubjectsDraft.map((subj, idx) => (
                      <tr key={idx} className={`border-b last:border-0 ${
                        subj.credit_status === 'credited' ? 'bg-emerald-50/40' :
                        subj.credit_status === 'not_credited' ? 'bg-red-50/40' : ''
                      }`}>
                        <td className="py-3 font-medium">{subj.subject_name || '—'}</td>
                        <td className="py-3 text-gray-500">{subj.subject_code || '—'}</td>
                        <td className="py-3">{subj.units || '—'}</td>
                        <td className="py-3">{subj.grade || '—'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const updated = [...transfereeSubjectsDraft];
                                updated[idx] = { ...updated[idx], credit_status: 'credited' };
                                setTransfereeSubjectsDraft(updated);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                                subj.credit_status === 'credited'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50'
                              }`}
                            >
                              <CheckCircle size={12} /> Credited
                            </button>
                            <button
                              onClick={() => {
                                const updated = [...transfereeSubjectsDraft];
                                updated[idx] = { ...updated[idx], credit_status: 'not_credited' };
                                setTransfereeSubjectsDraft(updated);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                                subj.credit_status === 'not_credited'
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-white text-red-500 border-red-300 hover:bg-red-50'
                              }`}
                            >
                              <AlertCircle size={12} /> Not Credited
                            </button>
                            {subj.credit_status !== 'pending' && (
                              <button
                                onClick={() => {
                                  const updated = [...transfereeSubjectsDraft];
                                  updated[idx] = { ...updated[idx], credit_status: 'pending' };
                                  setTransfereeSubjectsDraft(updated);
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="text-emerald-600 font-medium">
                  {transfereeSubjectsDraft.filter((s) => s.credit_status === 'credited').length} Credited
                </span>
                <span className="text-red-500 font-medium">
                  {transfereeSubjectsDraft.filter((s) => s.credit_status === 'not_credited').length} Not Credited
                </span>
                <span className="text-gray-400">
                  {transfereeSubjectsDraft.filter((s) => s.credit_status === 'pending').length} Pending
                </span>
              </div>
            </>
          )}
        </div>
      )}

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

      {/* Class List Picker Modal */}
      {showClassListPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Generate Class List</h3>
              <button onClick={() => setShowClassListPicker(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
                <select
                  value={clStrand}
                  onChange={(e) => setClStrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['STEM','ABM','HUMSS','GAS','TVL-ICT','TVL-HE','TVL-IA','TVL-AFA','SPORTS','ARTS'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select
                  value={clGrade}
                  onChange={(e) => setClGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={clSemester}
                  onChange={(e) => setClSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Semesters</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateClassList}
              disabled={loadingClassList}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              {loadingClassList
                ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
                : <><Printer size={16} /> Generate Class List</>}
            </button>
          </div>
        </div>
      )}

      {/* Class List Print Preview */}
      {showClassList && (
        <div
          className="fixed inset-0 z-50 bg-black/70 overflow-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowClassList(false); }}
        >
          <div className="w-fit mx-auto my-6 animate-scale-in">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-gray-800 text-white px-5 py-3 rounded-t-xl">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Printer size={16} />
                Class List — {clStrand} · {clGrade}{clSemester ? ` · ${clSemester}` : ''}
                <span className="ml-2 text-gray-400 text-xs">{classListStudents.length} student(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintClassList}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowClassList(false)}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Paper */}
            <div className="bg-white shadow-2xl rounded-b-xl overflow-hidden">
              <PrintableClassList
                ref={classListRef}
                strand={clStrand}
                gradeLevel={clGrade}
                semester={clSemester}
                students={classListStudents}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
