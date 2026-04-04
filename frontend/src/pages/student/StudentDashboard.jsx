import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { User, BookOpen, Hash, Clock, Edit, Eye, CheckCircle, Upload, Loader2, AlertCircle, Printer, X, History, ChevronDown, ChevronUp, ArrowRight, Calendar, MapPin, Info, Megaphone, Pin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import PrintableEnrollmentForm from '../../components/PrintableEnrollmentForm';
import { getMyProfile, getMySubjects, uploadPaymentReceipt, getMyEnrollmentHistory, getEnrollmentStatus, getAnnouncements, updateMyProfile } from '../../services/api';
import { statusColor, getErrorMessage } from '../../utils/helpers';

function WelcomeModal({ onComplete }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [saving, setSaving] = useState(false);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await updateMyProfile(data);
      toast.success('Welcome! Your info has been saved.');
      onComplete(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-backdrop-enter p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-modal-enter overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <img src="/images/logo.png" alt="DBTC Logo" className="w-16 h-16 object-contain drop-shadow-md" />
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to DBTC!</h2>
          <p className="text-emerald-100 text-sm mt-1">Let's set up your profile to get started</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Enter your basic info below — this will pre-fill your enrollment form so you don't have to type it again.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
              <input
                {...register('first_name', { required: 'Required' })}
                className={inputClass}
                placeholder="e.g. Juan"
                autoFocus
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
              <input
                {...register('last_name', { required: 'Required' })}
                className={inputClass}
                placeholder="e.g. Dela Cruz"
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Middle Name <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
            <input
              {...register('middle_name')}
              className={inputClass}
              placeholder="e.g. Santos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Birthday <span className="text-red-500">*</span></label>
              <input
                type="date"
                {...register('birthday', { required: 'Required' })}
                className={inputClass}
              />
              {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Sex <span className="text-red-500">*</span></label>
              <select {...register('sex', { required: 'Required' })} className={inputClass}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 mt-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Announcement Carousel ────────────────────────────────────────────────────
function AnnouncementCarousel({ announcements }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState('right');
  const [animKey, setAnimKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = announcements.length;
  const ann = announcements[current];

  const prev = () => {
    setDirection('left');
    setAnimKey((k) => k + 1);
    setCurrent((c) => (c - 1 + total) % total);
  };
  const next = () => {
    setDirection('right');
    setAnimKey((k) => k + 1);
    setCurrent((c) => (c + 1) % total);
  };
  const goTo = (i) => {
    setDirection(i > current ? 'right' : 'left');
    setAnimKey((k) => k + 1);
    setCurrent(i);
  };

  // Auto-slide every 5 seconds, pause on hover
  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = setInterval(() => {
      setDirection('right');
      setAnimKey((k) => k + 1);
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total, paused]);

  return (
    <div
      className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Megaphone size={18} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-emerald-900">Announcements</h2>
            <p className="text-xs text-emerald-600">{total} active announcement{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {/* Prev / Next buttons — only show if more than 1 */}
        {total > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              className="p-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="p-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Slide */}
      <div className="overflow-hidden rounded-xl">
      <div
        key={animKey}
        className={`p-4 rounded-xl border shadow-sm ${direction === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left'} ${ann.is_pinned ? 'bg-amber-50 border-amber-300' : 'bg-white border-emerald-100'}`}
      >
        <div className="flex items-center gap-2 mb-1">
          {ann.is_pinned && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <Pin size={10} /> Pinned
            </span>
          )}
          <h3 className="font-semibold text-gray-800 text-sm">{ann.title}</h3>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-line">{ann.message}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>{new Date(ann.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          {ann.expires_at && (
            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-medium">
              Until {new Date(ann.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === current ? 'bg-emerald-600 w-4 h-2' : 'bg-emerald-200 w-2 h-2'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

// ── Next Steps Guide ────────────────────────────────────────────────────────
function NextStepsGuide({ profile, subjects, calendar }) {
  const status = profile?.status;
  const paymentStatus = profile?.payment_status || 'unpaid';
  const hasSubjects = subjects.length > 0;

  const deadline = calendar?.enrollment_end
    ? new Date(calendar.enrollment_end).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // Fully enrolled — nothing to do
  if (status === 'approved' && paymentStatus === 'verified' && hasSubjects) return null;

  let step = null;

  if (!profile?.first_name) {
    step = {
      color: 'emerald',
      title: 'Fill out your application form',
      desc: 'Complete your enrollment application to get started. Make sure all required fields and documents are provided.',
      action: { label: 'Go to Application Form', to: '/student/profile' },
    };
  } else if (status === 'pending') {
    step = {
      color: 'amber',
      title: 'Your application is under review',
      desc: 'The admin is reviewing your application. You will be notified once it has been approved or if further action is required.',
      action: null,
    };
  } else if (status === 'denied') {
    step = {
      color: 'red',
      title: 'Your application was not approved',
      desc: `Please review the admin's remarks, update your application, and resubmit.`,
      action: { label: 'Edit & Resubmit', to: '/student/profile' },
    };
  } else if (status === 'approved' && paymentStatus === 'unpaid') {
    step = {
      color: 'amber',
      title: 'Pay your tuition fee and upload your receipt',
      desc: (
        <span>
          Your application has been approved! Pay your tuition at the school cashier or via the designated payment channel,
          then upload your payment receipt below.
          {deadline && (
            <span className="block mt-1.5 font-medium text-amber-800">
              Enrollment deadline: {deadline}
            </span>
          )}
        </span>
      ),
      action: null,
    };
  } else if (status === 'approved' && paymentStatus === 'pending_verification') {
    step = {
      color: 'blue',
      title: 'Receipt submitted — awaiting verification',
      desc: 'The registrar is reviewing your payment receipt. This usually takes 1–2 business days.',
      action: null,
    };
  } else if (status === 'approved' && paymentStatus === 'verified' && !hasSubjects) {
    step = {
      color: 'green',
      title: 'Payment verified — waiting for subject assignment',
      desc: 'Your payment has been verified. The registrar will assign your subjects shortly. Check back soon!',
      action: null,
    };
  }

  if (!step) return null;

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', title: 'text-emerald-800', desc: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-500',   title: 'text-amber-800',   desc: 'text-amber-700',   btn: 'bg-amber-600 hover:bg-amber-700' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-500',     title: 'text-red-800',     desc: 'text-red-700',     btn: 'bg-red-600 hover:bg-red-700' },
    green:   { bg: 'bg-green-50',   border: 'border-green-200',   icon: 'text-green-500',   title: 'text-green-800',   desc: 'text-green-700',   btn: 'bg-green-600 hover:bg-green-700' },
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-500',    title: 'text-blue-800',    desc: 'text-blue-700',    btn: 'bg-blue-600 hover:bg-blue-700' },
  };
  const c = colorMap[step.color];

  return (
    <div className={`mb-6 ${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className="flex items-start gap-3">
        <Info size={20} className={`${c.icon} shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${c.title}`}>{step.title}</h3>
          <div className={`text-sm ${c.desc} mt-1`}>{step.desc}</div>
          {step.action && (
            <a
              href={step.action.to}
              className={`mt-3 inline-flex items-center gap-2 ${c.btn} text-white text-sm font-medium px-4 py-2 rounded-lg transition`}
            >
              {step.action.label}
              <ArrowRight size={15} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Payment Info Card ────────────────────────────────────────────────────────
function PaymentInfoCard({ calendar }) {
  if (!calendar) return null;

  const start = calendar.enrollment_start
    ? new Date(calendar.enrollment_start).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const end = calendar.enrollment_end
    ? new Date(calendar.enrollment_end).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={17} className="text-emerald-600" />
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Enrollment Period</h2>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {calendar.school_year && (
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">School Year</span>
            <span className="font-medium text-gray-800">{calendar.school_year}</span>
          </div>
        )}
        {calendar.semester && (
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Semester</span>
            <span className="font-medium text-gray-800">{calendar.semester} Semester</span>
          </div>
        )}
        {start && (
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Starts</span>
            <span className="font-medium text-gray-800">{start}</span>
          </div>
        )}
        {end && (
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Deadline</span>
            <span className="font-medium text-red-600">{end}</span>
          </div>
        )}
        <div className="flex items-center">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${calendar.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${calendar.is_open ? 'bg-green-500' : 'bg-gray-400'}`} />
            {calendar.is_open ? 'Enrollment Open' : 'Enrollment Closed'}
          </span>
        </div>
      </div>
      {/* Payment instructions */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-600">Where to pay</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Proceed to the <span className="font-medium text-gray-700">School Cashier</span> during office hours (Mon–Fri, 8:00 AM – 5:00 PM).
              Keep your official receipt — you will need to upload a clear photo as proof of payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
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
        const [profileRes, subjectsRes, historyRes, calendarRes, annRes] = await Promise.all([
          getMyProfile(),
          getMySubjects(),
          getMyEnrollmentHistory(),
          getEnrollmentStatus().catch(() => ({ data: null })),
          getAnnouncements().catch(() => ({ data: [] })),
        ]);
        setProfile(profileRes.data);
        setSubjects(subjectsRes.data);
        setHistory(historyRes.data);
        setCalendar(calendarRes.data);
        setAnnouncements(annRes.data);
        if (!profileRes.data?.first_name) setShowWelcomeModal(true);
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
      {showWelcomeModal && createPortal(
        <WelcomeModal
          onComplete={(data) => {
            setProfile((prev) => ({ ...prev, ...data }));
            setShowWelcomeModal(false);
          }}
        />,
        document.body
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {profile?.first_name || 'Student'}!
        </h1>
        <p className="text-gray-500">Here's your registration overview</p>
      </div>

      {/* ── Announcements Carousel ── */}
      {announcements.length > 0 && (
        <AnnouncementCarousel announcements={announcements} />
      )}

      {/* Enrollment Period Info */}
      <PaymentInfoCard calendar={calendar} />

      {/* Enrollment Progress Stepper */}
      <EnrollmentStepper profile={profile} subjects={subjects} />

      {/* Next Steps Guide */}
      <NextStepsGuide profile={profile} subjects={subjects} calendar={calendar} />

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
        <div className="mb-6 bg-teal-50 border border-teal-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-teal-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-teal-800">Receipt submitted — waiting for verification</h3>
              <p className="text-sm text-teal-700 mt-1">
                The registrar will review your payment receipt shortly.
              </p>
              {profile?.payment_receipt_path && (
                <div className="mt-3">
                  <p className="text-xs text-teal-600 mb-2">Uploaded receipt:</p>
                  <img
                    src={`/uploads/${profile.payment_receipt_path}`}
                    alt="Payment receipt"
                    className="max-w-xs rounded-lg border border-teal-200 shadow-sm"
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
                            record.enrollment_type === 'NEW_ENROLLEE' ? 'bg-emerald-50 text-emerald-700' :
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
