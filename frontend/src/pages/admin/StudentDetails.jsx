import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Loader2, User, FileText, AlertCircle, History, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { getStudentById, approveStudent, denyStudent, getAdminStudentEnrollmentHistory } from '../../services/api';
import { statusColor, formatDate, getErrorMessage } from '../../utils/helpers';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [enrollmentHistory, setEnrollmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [denying, setDenying] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    enrollment_date: '',
    place_of_birth: '',
    nationality: '',
    civil_status: '',
  });

  useEffect(() => {
    Promise.all([
      getStudentById(id),
      getAdminStudentEnrollmentHistory(id),
    ]).then(([studentRes, historyRes]) => {
      setStudent(studentRes.data);
      setEnrollmentHistory(historyRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleApproveClick = () => {
    setShowEnrollModal(true);
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      const data = {};
      if (enrollForm.enrollment_date) data.enrollment_date = enrollForm.enrollment_date;
      if (enrollForm.place_of_birth) data.place_of_birth = enrollForm.place_of_birth;
      if (enrollForm.nationality) data.nationality = enrollForm.nationality;
      if (enrollForm.civil_status) data.civil_status = enrollForm.civil_status;

      await approveStudent(id, data);
      toast.success('Student approved and enrolled');
      setStudent({ ...student, status: 'approved', ...data });
      setShowEnrollModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleDenyConfirm = async () => {
    setDenying(true);
    try {
      await denyStudent(id, denyReason);
      toast.success('Student denied');
      setStudent({ ...student, status: 'denied', denial_reason: denyReason || null });
      setShowDenyModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDenying(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;
  if (!student) return <DashboardLayout><p className="text-center text-gray-400 py-12">Student not found</p></DashboardLayout>;

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{student.student_number || 'Not yet assigned'}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(student.status)}`}>
                {student.status}
              </span>
              {student.enrollment_type && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  student.enrollment_type === 'NEW_ENROLLEE' ? 'bg-blue-50 text-blue-700' :
                  student.enrollment_type === 'TRANSFEREE' ? 'bg-amber-50 text-amber-700' :
                  'bg-purple-50 text-purple-700'
                }`}>
                  {student.enrollment_type.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
        {student.status === 'pending' && (
          <div className="flex gap-2">
            <button onClick={handleApproveClick} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <CheckCircle size={16} /> Approve
            </button>
            <button onClick={() => { setDenyReason(''); setShowDenyModal(true); }} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <XCircle size={16} /> Deny
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* School Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">A. Grade Level & School Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="School Year" value={student.school_year} />
            <Field label="Semester" value={student.semester} />
            <Field label="LRN" value={student.lrn} />
            <Field label="Returning Student" value={student.is_returning_student ? 'Yes' : 'No'} />
            <Field label="Grade to Enroll" value={student.grade_level_to_enroll} />
            <Field label="Last Grade Completed" value={student.last_grade_level_completed} />
            <Field label="Last SY Completed" value={student.last_school_year_completed} />
            <Field label="Last School Attended" value={student.last_school_attended} />
            <Field label="School Type" value={student.school_type} />
            <Field label="Strand" value={student.strand} />
            <Field label="School to Enroll In" value={student.school_to_enroll_in} />
            <Field label="School Address" value={student.school_address} />
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">B. Student Information</h2>
          {/* ID Photo */}
          <div className="mb-4">
            {student.student_photo_path ? (
              <img
                src={`/uploads/${student.student_photo_path}`}
                alt="Student ID Photo"
                className="w-28 h-28 rounded-xl object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-28 h-28 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <User size={32} />
                <span className="text-xs mt-1">No photo</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="Last Name" value={student.last_name} />
            <Field label="First Name" value={student.first_name} />
            <Field label="Middle Name" value={student.middle_name} />
            <Field label="Suffix" value={student.suffix} />
            <Field label="Birthday" value={formatDate(student.birthday)} />
            <Field label="Age" value={student.age} />
            <Field label="Sex" value={student.sex} />
            <Field label="Mother Tongue" value={student.mother_tongue} />
            <Field label="Religion" value={student.religion} />
            <Field label="PSA Birth Cert No." value={student.psa_birth_certificate_no} />
            <Field label="Email" value={student.email} />
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Documents</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Grades */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Last School Grades</p>
              {student.grades_path ? (
                student.grades_path.endsWith('.pdf') ? (
                  <a href={`/uploads/${student.grades_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                    <FileText size={20} /> View PDF
                  </a>
                ) : (
                  <a href={`/uploads/${student.grades_path}`} target="_blank" rel="noopener noreferrer">
                    <img src={`/uploads/${student.grades_path}`} alt="Grades" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
                  </a>
                )
              ) : <p className="text-gray-400 text-xs italic">Not uploaded</p>}
            </div>
            {/* Voucher */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Voucher</p>
              {student.voucher_path ? (
                student.voucher_path.endsWith('.pdf') ? (
                  <a href={`/uploads/${student.voucher_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                    <FileText size={20} /> View PDF
                  </a>
                ) : (
                  <a href={`/uploads/${student.voucher_path}`} target="_blank" rel="noopener noreferrer">
                    <img src={`/uploads/${student.voucher_path}`} alt="Voucher" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
                  </a>
                )
              ) : <p className="text-gray-400 text-xs italic">Not uploaded</p>}
            </div>
            {/* PSA Birth Certificate */}
            <div>
              <p className="text-xs text-gray-500 mb-2">PSA Birth Certificate</p>
              {student.psa_birth_cert_path ? (
                student.psa_birth_cert_path.endsWith('.pdf') ? (
                  <a href={`/uploads/${student.psa_birth_cert_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                    <FileText size={20} /> View PDF
                  </a>
                ) : (
                  <a href={`/uploads/${student.psa_birth_cert_path}`} target="_blank" rel="noopener noreferrer">
                    <img src={`/uploads/${student.psa_birth_cert_path}`} alt="PSA Birth Certificate" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
                  </a>
                )
              ) : <p className="text-gray-400 text-xs italic">Not uploaded</p>}
            </div>
            {/* Transfer Credential — Transferee only */}
            {student.enrollment_type === 'TRANSFEREE' && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Transfer Credential / Form 137</p>
                {student.transfer_credential_path ? (
                  student.transfer_credential_path.endsWith('.pdf') ? (
                    <a href={`/uploads/${student.transfer_credential_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                      <FileText size={20} /> View PDF
                    </a>
                  ) : (
                    <a href={`/uploads/${student.transfer_credential_path}`} target="_blank" rel="noopener noreferrer">
                      <img src={`/uploads/${student.transfer_credential_path}`} alt="Transfer Credential" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
                    </a>
                  )
                ) : <p className="text-amber-500 text-xs italic">Not uploaded</p>}
              </div>
            )}
            {/* Good Moral Certificate — Transferee only */}
            {student.enrollment_type === 'TRANSFEREE' && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Good Moral Certificate</p>
                {student.good_moral_path ? (
                  student.good_moral_path.endsWith('.pdf') ? (
                    <a href={`/uploads/${student.good_moral_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                      <FileText size={20} /> View PDF
                    </a>
                  ) : (
                    <a href={`/uploads/${student.good_moral_path}`} target="_blank" rel="noopener noreferrer">
                      <img src={`/uploads/${student.good_moral_path}`} alt="Good Moral Certificate" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
                    </a>
                  )
                ) : <p className="text-amber-500 text-xs italic">Not uploaded</p>}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">C. Student Address</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Field label="Region" value={student.region} />
            <Field label="Province" value={student.province} />
            <Field label="City / Municipality" value={student.city_municipality} />
            <Field label="Barangay" value={student.barangay} />
            <Field label="House No. / Street" value={student.house_no_street} />
          </div>
        </div>

        {/* Parent/Guardian */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">D. Parent / Guardian Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Father's Name" value={student.father_full_name} />
            <Field label="Father's Contact" value={student.father_contact} />
            <Field label="Mother's Name" value={student.mother_full_name} />
            <Field label="Mother's Contact" value={student.mother_contact} />
            <Field label="Guardian's Name" value={student.guardian_full_name} />
            <Field label="Guardian's Contact" value={student.guardian_contact} />
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Created At" value={formatDate(student.created_at)} />
            <Field label="Updated At" value={formatDate(student.updated_at)} />
          </div>
        </div>
      </div>

      {/* Enrollment History */}
      {enrollmentHistory.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Enrollment History</h2>
            <span className="ml-auto text-xs text-gray-400">{enrollmentHistory.length} record{enrollmentHistory.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {enrollmentHistory.map((record) => (
              <div key={record.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {record.school_year || '—'} · {record.semester || '—'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {record.grade_level || '—'} · {record.strand || '—'}
                      {record.enrollment_type && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          record.enrollment_type === 'NEW_ENROLLEE' ? 'bg-blue-50 text-blue-700' :
                          record.enrollment_type === 'TRANSFEREE' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {record.enrollment_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">
                      {new Date(record.archived_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {expandedRecord === record.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>
                {expandedRecord === record.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    {record.subjects_snapshot && record.subjects_snapshot.length > 0 ? (
                      <table className="w-full text-sm mt-3">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 font-medium">Code</th>
                            <th className="pb-2 font-medium">Subject</th>
                            <th className="pb-2 font-medium">Schedule</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.subjects_snapshot.map((s, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-2 font-medium text-emerald-600">{s.subject_code || '—'}</td>
                              <td className="py-2">{s.subject_name}</td>
                              <td className="py-2 text-gray-500">{s.schedule || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-gray-400 mt-3">No subjects in this record.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Denial Reason Banner */}
      {student.status === 'denied' && student.denial_reason && (
        <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold mb-0.5">Denial Reason</p>
            <p>{student.denial_reason}</p>
          </div>
        </div>
      )}

      {/* Deny with Reason Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Deny Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Denying <strong>{student.first_name} {student.last_name}</strong>. Optionally provide a reason so the student knows what to correct.
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
                onClick={() => setShowDenyModal(false)}
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

      {/* Enrollment Approval Modal */}
      <Modal open={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Enrollment Form — Approve & Enroll" size="lg">
        <form onSubmit={handleEnrollSubmit} className="space-y-5">
          {/* Student Photo & ID */}
          <div className="flex items-start gap-4">
            {student?.student_photo_path ? (
              <img
                src={`/uploads/${student.student_photo_path}`}
                alt="Student ID Photo"
                className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0">
                <User size={28} />
                <span className="text-xs mt-1">No photo</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Student ID</label>
                <input value={student?.student_number || 'Not yet assigned'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">LRN</label>
                <input value={student?.lrn || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Enrollment Type</label>
                <input value={student?.enrollment_type ? student.enrollment_type.replace(/_/g, ' ') : '—'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Enrollment Date (new input) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Enrollment Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={enrollForm.enrollment_date}
                onChange={(e) => setEnrollForm({ ...enrollForm, enrollment_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Pre-filled Name fields (read-only) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                <input value={student?.last_name || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">First Name</label>
                <input value={student?.first_name || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Middle Name</label>
                <input value={student?.middle_name || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Suffix</label>
                <input value={student?.suffix || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Pre-filled DOB, Age, Sex (read-only) + new editable fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
              <input value={formatDate(student?.birthday)} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Age</label>
              <input value={student?.age || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sex</label>
              <input value={student?.sex || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Place of Birth</label>
              <input
                value={enrollForm.place_of_birth}
                onChange={(e) => setEnrollForm({ ...enrollForm, place_of_birth: e.target.value })}
                placeholder="City, Province"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Nationality & Civil Status (new inputs) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nationality</label>
              <input
                value={enrollForm.nationality}
                onChange={(e) => setEnrollForm({ ...enrollForm, nationality: e.target.value })}
                placeholder="e.g. Filipino"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Civil Status</label>
              <select
                value={enrollForm.civil_status}
                onChange={(e) => setEnrollForm({ ...enrollForm, civil_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>

          {/* Pre-filled Guardian info (read-only) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Guardian Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Father</label>
                <input value={student?.father_full_name || '—'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mother</label>
                <input value={student?.mother_full_name || '—'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Guardian</label>
                <input value={student?.guardian_full_name || '—'} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowEnrollModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={enrolling}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {enrolling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {enrolling ? 'Processing...' : 'Approve & Enroll'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
