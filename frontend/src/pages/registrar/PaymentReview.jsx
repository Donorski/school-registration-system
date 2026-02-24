import { useEffect, useState } from 'react';
import { Search, User, CheckCircle, XCircle, Loader2, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { getPendingPayments, getStudentCompleteInfo, verifyPayment, rejectPayment, downloadStudentFiles } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

export default function PaymentReview() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await getPendingPayments({ per_page: 100 });
      setStudents(res.data.students);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSelectStudent = async (studentId) => {
    if (!studentId) {
      setSelectedStudent(null);
      setStudentDetail(null);
      return;
    }
    setSelectedStudent(studentId);
    try {
      const res = await getStudentCompleteInfo(studentId);
      setStudentDetail(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleVerify = async () => {
    setShowVerifyConfirm(false);
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await verifyPayment(selectedStudent);
      toast.success('Payment verified successfully');
      setSelectedStudent(null);
      setStudentDetail(null);
      setLoading(true);
      await fetchStudents();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setShowRejectModal(false);
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await rejectPayment(selectedStudent, rejectReason);
      toast.success('Payment receipt rejected');
      setSelectedStudent(null);
      setStudentDetail(null);
      setRejectReason('');
      setLoading(true);
      await fetchStudents();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!studentDetail) return;
    setDownloading(true);
    try {
      const res = await downloadStudentFiles(studentDetail.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentDetail.first_name || ''}_${studentDetail.last_name || ''}_files.zip`.replace(/^_|_$/g, '');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Files downloaded successfully');
    } catch {
      toast.error('Failed to download files');
    } finally {
      setDownloading(false);
    }
  };

  const isPdf = (path) => path?.toLowerCase().endsWith('.pdf');

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.first_name?.toLowerCase() || '').includes(q) ||
      (s.last_name?.toLowerCase() || '').includes(q) ||
      (s.student_number?.toLowerCase() || '').includes(q)
    );
  });

  if (loading) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment Review</h1>
        <p className="text-gray-500">Review and verify student payment receipts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Receipts</h2>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredStudents.map((s) => (
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
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium truncate">{s.first_name || '—'} {s.last_name || ''}</p>
                    {s.enrollment_type === 'TRANSFEREE' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 shrink-0">T</span>
                    )}
                    {s.enrollment_type === 'RE_ENROLLEE' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 shrink-0">R</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{s.student_number || 'No ID yet'} | {s.strand || '—'}</p>
                </div>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm">No pending receipts</p>
            )}
          </div>
        </div>

        {/* Receipt Review */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          {!selectedStudent ? (
            <div className="text-center py-12 text-gray-400">
              <p>Select a student to review their payment receipt</p>
            </div>
          ) : studentDetail ? (
            <div>
              {/* Student Info */}
              <div className="flex items-center gap-3 mb-6">
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
                    {studentDetail.enrollment_type && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        studentDetail.enrollment_type === 'NEW_ENROLLEE' ? 'bg-blue-50 text-blue-700' :
                        studentDetail.enrollment_type === 'TRANSFEREE' ? 'bg-amber-50 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {studentDetail.enrollment_type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {studentDetail.student_number || 'No ID yet'} | {studentDetail.strand} - {studentDetail.grade_level_to_enroll}
                  </p>
                </div>
              </div>

              {/* Student Uploaded Documents */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Student Documents</h3>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                    title="Download all files as ZIP"
                  >
                    {downloading
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Download size={13} />}
                    {downloading ? 'Downloading…' : 'Download All Files'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ID Photo */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">ID Photo</p>
                    {studentDetail.student_photo_path ? (
                      <a href={`/uploads/${studentDetail.student_photo_path}`} target="_blank" rel="noopener noreferrer">
                        <img
                          src={`/uploads/${studentDetail.student_photo_path}`}
                          alt="Student ID"
                          className="w-full max-h-48 object-contain rounded border border-gray-100"
                        />
                      </a>
                    ) : (
                      <p className="text-gray-400 text-xs italic">Not uploaded</p>
                    )}
                  </div>

                  {/* Grades */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Last School Grades</p>
                    {studentDetail.grades_path ? (
                      isPdf(studentDetail.grades_path) ? (
                        <a href={`/uploads/${studentDetail.grades_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                          <FileText size={20} />
                          View PDF
                        </a>
                      ) : (
                        <a href={`/uploads/${studentDetail.grades_path}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`/uploads/${studentDetail.grades_path}`}
                            alt="Grades"
                            className="w-full max-h-48 object-contain rounded border border-gray-100"
                          />
                        </a>
                      )
                    ) : (
                      <p className="text-gray-400 text-xs italic">Not uploaded</p>
                    )}
                  </div>

                  {/* Voucher */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Voucher</p>
                    {studentDetail.voucher_path ? (
                      isPdf(studentDetail.voucher_path) ? (
                        <a href={`/uploads/${studentDetail.voucher_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                          <FileText size={20} />
                          View PDF
                        </a>
                      ) : (
                        <a href={`/uploads/${studentDetail.voucher_path}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`/uploads/${studentDetail.voucher_path}`}
                            alt="Voucher"
                            className="w-full max-h-48 object-contain rounded border border-gray-100"
                          />
                        </a>
                      )
                    ) : (
                      <p className="text-gray-400 text-xs italic">Not uploaded</p>
                    )}
                  </div>

                  {/* Transfer Credential — Transferee only */}
                  {studentDetail.enrollment_type === 'TRANSFEREE' && (
                    <div className="border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-600 mb-2">Transfer Credential / Form 137</p>
                      {studentDetail.transfer_credential_path ? (
                        isPdf(studentDetail.transfer_credential_path) ? (
                          <a href={`/uploads/${studentDetail.transfer_credential_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                            <FileText size={20} />
                            View PDF
                          </a>
                        ) : (
                          <a href={`/uploads/${studentDetail.transfer_credential_path}`} target="_blank" rel="noopener noreferrer">
                            <img
                              src={`/uploads/${studentDetail.transfer_credential_path}`}
                              alt="Transfer Credential"
                              className="w-full max-h-48 object-contain rounded border border-gray-100"
                            />
                          </a>
                        )
                      ) : (
                        <p className="text-amber-500 text-xs italic">Not uploaded</p>
                      )}
                    </div>
                  )}

                  {/* Good Moral Certificate — Transferee only */}
                  {studentDetail.enrollment_type === 'TRANSFEREE' && (
                    <div className="border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-600 mb-2">Good Moral Certificate</p>
                      {studentDetail.good_moral_path ? (
                        isPdf(studentDetail.good_moral_path) ? (
                          <a href={`/uploads/${studentDetail.good_moral_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                            <FileText size={20} />
                            View PDF
                          </a>
                        ) : (
                          <a href={`/uploads/${studentDetail.good_moral_path}`} target="_blank" rel="noopener noreferrer">
                            <img
                              src={`/uploads/${studentDetail.good_moral_path}`}
                              alt="Good Moral Certificate"
                              className="w-full max-h-48 object-contain rounded border border-gray-100"
                            />
                          </a>
                        )
                      ) : (
                        <p className="text-amber-500 text-xs italic">Not uploaded</p>
                      )}
                    </div>
                  )}

                  {/* PSA Birth Certificate */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">PSA Birth Certificate</p>
                    {studentDetail.psa_birth_cert_path ? (
                      isPdf(studentDetail.psa_birth_cert_path) ? (
                        <a href={`/uploads/${studentDetail.psa_birth_cert_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                          <FileText size={20} />
                          View PDF
                        </a>
                      ) : (
                        <a href={`/uploads/${studentDetail.psa_birth_cert_path}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`/uploads/${studentDetail.psa_birth_cert_path}`}
                            alt="PSA Birth Certificate"
                            className="w-full max-h-48 object-contain rounded border border-gray-100"
                          />
                        </a>
                      )
                    ) : (
                      <p className="text-gray-400 text-xs italic">Not uploaded</p>
                    )}
                  </div>

                  {/* Payment Receipt */}
                  <div className="border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Payment Receipt</p>
                    {studentDetail.payment_receipt_path ? (
                      isPdf(studentDetail.payment_receipt_path) ? (
                        <a href={`/uploads/${studentDetail.payment_receipt_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline text-sm">
                          <FileText size={20} />
                          View PDF
                        </a>
                      ) : (
                        <a href={`/uploads/${studentDetail.payment_receipt_path}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`/uploads/${studentDetail.payment_receipt_path}`}
                            alt="Payment receipt"
                            className="w-full max-h-48 object-contain rounded border border-gray-100"
                          />
                        </a>
                      )
                    ) : (
                      <p className="text-gray-400 text-xs italic">Not uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowVerifyConfirm(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Verify Payment
                </button>
                <button
                  onClick={() => { setRejectReason(''); setShowRejectModal(true); }}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Reject Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>

      {/* Verify Confirmation */}
      <ConfirmModal
        open={showVerifyConfirm}
        onClose={() => setShowVerifyConfirm(false)}
        onConfirm={handleVerify}
        title="Verify Payment"
        message={`Are you sure you want to verify the payment for "${studentDetail?.first_name} ${studentDetail?.last_name}"? This will assign a student number and allow subject assignment.`}
        confirmText="Verify"
        variant="success"
        loading={actionLoading}
      />

      {/* Reject with Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Reject Payment Receipt</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting receipt for <strong>{studentDetail?.first_name} {studentDetail?.last_name}</strong>. Optionally explain why so the student knows what to fix.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Receipt is blurry and unreadable. Please upload a clearer photo."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Optional — leave blank if no specific reason.</p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
