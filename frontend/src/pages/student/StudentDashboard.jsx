import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Hash, Clock, Edit, Eye, CheckCircle, Upload, Loader2, AlertCircle, Printer, X, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import PrintableEnrollmentForm from '../../components/PrintableEnrollmentForm';
import { getMyProfile, getMySubjects, uploadPaymentReceipt, getMyEnrollmentHistory } from '../../services/api';
import { statusColor, getErrorMessage } from '../../utils/helpers';

// ── Enrollment Stepper ──────────────────────────────────────────────────────
const STEPS = ['Apply', 'Approved', 'Pay', 'Verified', 'Enrolled'];

function EnrollmentStepper({ profile, subjects }) {
  const paymentStatus = profile?.payment_status || 'unpaid';

  const completed = [
    !!profile?.first_name,                        // Step 1: Apply
    profile?.status === 'approved',               // Step 2: Approved
    paymentStatus !== 'unpaid',                   // Step 3: Pay
    paymentStatus === 'verified',                 // Step 4: Verified
    subjects.length > 0,                          // Step 5: Enrolled
  ];

  // Active step = last completed + 1 (capped at last step)
  const activeIndex = Math.min(
    completed.lastIndexOf(true) + 1,
    STEPS.length - 1
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Enrollment Progress</h2>
      <div className="flex items-center">
        {STEPS.map((label, i) => {
          const done = completed[i];
          const active = !done && i === activeIndex;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${done
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : active
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                        : 'border-gray-200 text-gray-400 bg-white'}`}
                >
                  {done ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium text-center leading-tight
                    ${done ? 'text-emerald-600' : active ? 'text-emerald-500' : 'text-gray-400'}`}
                >
                  {label}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 rounded transition-all
                    ${completed[i] ? 'bg-emerald-400' : 'bg-gray-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const receiptInputRef = useRef(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Enrollment-${profile?.student_number || 'DBTC'}`,
    pageStyle: `
      @page { size: 220mm 110mm; margin: 0; }
      body { margin: 0; }
    `,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, subjectsRes, historyRes] = await Promise.all([
          getMyProfile(),
          getMySubjects(),
          getMyEnrollmentHistory(),
        ]);
        setProfile(profileRes.data);
        setSubjects(subjectsRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadPaymentReceipt(formData);
      setProfile(res.data);
      toast.success('Receipt uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500 text-lg mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isApproved = profile?.status === 'approved';
  const paymentStatus = profile?.payment_status || 'unpaid';

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {profile?.first_name || 'Student'}!
        </h1>
        <p className="text-gray-500">Here's your registration overview</p>
      </div>

      {/* Enrollment Progress Stepper */}
      <EnrollmentStepper profile={profile} subjects={subjects} />

      {/* Payment Flow Banners (only for approved students) */}
      {isApproved && paymentStatus === 'unpaid' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              {profile?.payment_rejection_reason ? (
                <>
                  <h3 className="font-semibold text-amber-800">Receipt rejected — please upload a new one</h3>
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                    <span className="font-medium">Reason: </span>{profile.payment_rejection_reason}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-amber-800">You are accepted! Please pay your tuition fee</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Upload a photo of your payment receipt to proceed with enrollment.
                  </p>
                </>
              )}
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleReceiptUpload}
                className="hidden"
              />
              <button
                onClick={() => receiptInputRef.current?.click()}
                disabled={uploading}
                className="mt-3 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : 'Upload Payment Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isApproved && paymentStatus === 'pending_verification' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800">Receipt submitted — waiting for verification</h3>
              <p className="text-sm text-blue-700 mt-1">
                The registrar will review your payment receipt shortly.
              </p>
              {profile?.payment_receipt_path && (
                <div className="mt-3">
                  <p className="text-xs text-blue-600 mb-2">Uploaded receipt:</p>
                  <img
                    src={`/uploads/${profile.payment_receipt_path}`}
                    alt="Payment receipt"
                    className="max-w-xs rounded-lg border border-blue-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isApproved && paymentStatus === 'verified' && subjects.length === 0 && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <p>Payment verified! Please wait for your subjects to be assigned by the registrar.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Card */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Application</h2>
            <Link to="/student/profile" className="text-emerald-600 hover:text-emerald-700">
              {(profile?.status === 'pending' || profile?.status === 'approved') && profile?.first_name ? <Eye size={18} /> : <Edit size={18} />}
            </Link>
          </div>
          <div className="flex flex-col items-center mb-4">
            {profile?.student_photo_path ? (
              <img
                src={`/uploads/${profile.student_photo_path}`}
                alt="ID Photo"
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200 mb-3"
              />
            ) : (
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <User size={36} className="text-emerald-600" />
              </div>
            )}
            <h3 className="font-semibold text-gray-800">
              {profile?.first_name} {profile?.last_name}
            </h3>
            <p className="text-sm text-gray-500">{profile?.student_number || 'Not yet assigned'}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Hash size={16} />
              <span>{profile?.student_number || <span className="text-gray-400 italic">Pending</span>}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <BookOpen size={16} />
              <span>{profile?.strand || '—'} | {profile?.grade_level_to_enroll || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(profile?.status)}`}>
                {profile?.status?.toUpperCase()}
              </span>
            </div>
          </div>
          <Link
            to="/student/profile"
            className="mt-4 block text-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition"
          >
            {profile?.status === 'approved' && profile?.first_name
              ? 'View Application'
              : profile?.status === 'pending' && profile?.first_name
                ? 'View Application'
                : profile?.status === 'denied'
                  ? 'Edit & Resubmit'
                  : 'Fill Out Application'}
          </Link>
        </div>

        {/* Subjects */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Subjects</h2>
            {subjects.length > 0 && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
              >
                <Printer size={15} />
                Print / Save as PDF
              </button>
            )}
          </div>

          {/* Stats bar */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full border border-emerald-200">
                <BookOpen size={12} />
                {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
              </span>
              {profile?.semester && (
                <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
                  <Clock size={12} />
                  {profile.semester}
                </span>
              )}
            </div>
          )}

          {subjects.length === 0 ? (
            <div className="bg-emerald-50 rounded-xl text-center py-10 px-6">
              <BookOpen size={40} className="mx-auto mb-3 text-emerald-300" />
              <p className="font-medium text-gray-600">No subjects enrolled yet</p>
              <p className="text-sm text-gray-400 mt-1">Subjects will appear here once assigned by the registrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-emerald-600">{s.subject_code}</td>
                      <td className="py-3">{s.subject_name}</td>
                      <td className="py-3 text-gray-500">{s.schedule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Enrollment History ── */}
      {history.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">Enrollment History</h2>
            <span className="ml-auto text-xs text-gray-400">{history.length} record{history.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {history.map((record) => (
              <div key={record.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                >
                  <div className="flex items-center gap-3">
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

      {/* ── Print Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-auto" onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}>
          <div className="w-fit mx-auto my-6 animate-scale-in">

            {/* Toolbar */}
            <div className="flex items-center justify-between bg-gray-800 text-white px-5 py-3 rounded-t-xl">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Printer size={16} />
                Enrollment Certificate Preview
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Paper */}
            <div className="bg-white shadow-2xl rounded-b-xl overflow-hidden">
              <PrintableEnrollmentForm ref={printRef} profile={profile} subjects={subjects} />
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
