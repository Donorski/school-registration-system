import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { regions as phRegions, provinces as phProvinces, cities as phCities } from 'philippines';
import {
  ArrowLeft, ArrowRight, Send, Loader2, Lock, AlertCircle, CheckCircle,
  Camera, User, Upload, FileText, Ticket, Search, Plus, Trash2, BookOpen, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import {
  getMyProfile, updateMyProfile, uploadPhoto, uploadGrades, uploadVoucher,
  uploadPsaBirthCert, uploadTransferCredential, uploadGoodMoral, lookupStudent,
  getEnrollmentStatus,
} from '../../services/api';

const SCHOOL_NAME = 'DATABASE TECHNOLOGY COLLEGE';
const SCHOOL_ADDRESS = 'GUBAT SORSOGON CITY';
import { getErrorMessage, getCloudinaryViewUrl } from '../../utils/helpers';

const STEPS = [
  { id: 1, label: 'Enrollment Type' },
  { id: 2, label: 'School Info' },
  { id: 3, label: 'Personal Info' },
  { id: 4, label: 'Address' },
  { id: 5, label: 'Parent / Guardian' },
  { id: 6, label: 'Documents' },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-start mb-8 overflow-x-auto pb-2 gap-0">
      {STEPS.map((s, idx) => (
        <div key={s.id} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${current > s.id
                ? 'bg-emerald-500 text-white'
                : current === s.id
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : 'bg-gray-200 text-gray-500'}`}
            >
              {current > s.id ? <CheckCircle size={14} /> : s.id}
            </div>
            <span className={`text-xs mt-1 font-medium whitespace-nowrap
              ${current >= s.id ? 'text-emerald-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-8 sm:w-14 h-0.5 mx-1 mb-4 flex-shrink-0 transition-colors
              ${current > s.id ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [denialReason, setDenialReason] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [photoPath, setPhotoPath] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [gradesPath, setGradesPath] = useState(null);
  const [uploadingGrades, setUploadingGrades] = useState(false);
  const [voucherPath, setVoucherPath] = useState(null);
  const [uploadingVoucher, setUploadingVoucher] = useState(false);
  const [psaBirthCertPath, setPsaBirthCertPath] = useState(null);
  const [uploadingPsaBirthCert, setUploadingPsaBirthCert] = useState(false);
  const [transferCredentialPath, setTransferCredentialPath] = useState(null);
  const [uploadingTransferCredential, setUploadingTransferCredential] = useState(false);
  const [goodMoralPath, setGoodMoralPath] = useState(null);
  const [uploadingGoodMoral, setUploadingGoodMoral] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [enrollmentType, setEnrollmentType] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [transfereeSubjects, setTransfereeSubjects] = useState([]);
  const [showTransfereeModal, setShowTransfereeModal] = useState(false);
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState('forward');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  const fileInputRef = useRef(null);
  const gradesInputRef = useRef(null);
  const voucherInputRef = useRef(null);
  const psaBirthCertInputRef = useRef(null);
  const transferCredentialInputRef = useRef(null);
  const goodMoralInputRef = useRef(null);

  const { register, reset, setValue, watch, getValues } = useForm();

  const watchedEnrollmentType = watch('enrollment_type');

  useEffect(() => {
    if (watchedEnrollmentType !== undefined) {
      setEnrollmentType(watchedEnrollmentType || '');

      // Auto-fill grade level fields for new enrollees
      if (watchedEnrollmentType === 'NEW_ENROLLEE') {
        setValue('grade_level_to_enroll', 'Grade 11');
        setValue('last_grade_level_completed', 'Grade 10');
      }
    }
  }, [watchedEnrollmentType]);

  useEffect(() => {
    Promise.all([getMyProfile(), getEnrollmentStatus()])
      .then(([profileRes, calendarRes]) => {
        const data = profileRes.data;
        const cal = calendarRes.data;
        const submitted = !!data.first_name && !!data.last_name && !!data.enrollment_type;

        reset(data);
        setStatus(data.status);
        setDenialReason(data.denial_reason || null);
        setPhotoPath(data.student_photo_path);
        setGradesPath(data.grades_path);
        setVoucherPath(data.voucher_path);
        setPsaBirthCertPath(data.psa_birth_cert_path);
        setTransferCredentialPath(data.transfer_credential_path);
        setGoodMoralPath(data.good_moral_path);
        setEnrollmentType(data.enrollment_type || '');
        setTransfereeSubjects(data.transferee_subjects || []);
        setHasSubmitted(submitted);

        const locked = (data.status === 'pending' || data.status === 'approved') && submitted;

        // Auto-fill fixed fields (always, unless locked)
        if (!locked) {
          if (cal.school_year) setValue('school_year', cal.school_year);
          if (cal.semester) setValue('semester', cal.semester.replace(' Semester', '').trim() === '1st' ? '1st Semester' : cal.semester.includes('2') ? '2nd Semester' : cal.semester);
          setValue('school_to_enroll_in', SCHOOL_NAME);
          setValue('school_address', SCHOOL_ADDRESS);
        }

        // Initialize address cascade from saved data
        if (data.region) {
          const saved = data.region.toLowerCase().trim();
          const found = phRegions.find(r =>
            r.name.toLowerCase() === saved ||
            r.long.toLowerCase() === saved ||
            r.key.toLowerCase() === saved
          );
          if (found) setSelectedRegion(found.key);
        }
        if (data.province) {
          const saved = data.province.toLowerCase().trim();
          const found = phProvinces.find(p => p.name.toLowerCase() === saved || p.key.toLowerCase() === saved);
          if (found) setSelectedProvince(found.key);
        }
      })
      .finally(() => setLoading(false));
  }, [reset]);

  // ── Address cascade ──────────────────────────────────────────────────
  const filteredProvinces = phProvinces.filter(p => p.region === selectedRegion);
  const filteredCities = phCities.filter(c => c.province === selectedProvince);

  const handleRegionChange = (e) => {
    const key = e.target.value;
    setSelectedRegion(key);
    setSelectedProvince('');
    const region = phRegions.find(r => r.key === key);
    setValue('region', region ? region.name : '');
    setValue('province', '');
    setValue('city_municipality', '');
  };

  const handleProvinceChange = (e) => {
    const key = e.target.value;
    setSelectedProvince(key);
    const prov = phProvinces.find(p => p.key === key);
    setValue('province', prov ? prov.name : '');
    setValue('city_municipality', '');
  };

  const handleCityChange = (e) => {
    setValue('city_municipality', e.target.value);
  };

  // ── Step navigation ──────────────────────────────────────────────────
  const handleNext = () => {
    if (!isLocked) {
      const values = getValues();
      if (step === 1) {
        if (!values.enrollment_type) {
          toast.error('Please select an enrollment type');
          return;
        }
      } else if (step === 2) {
        const missing = [];
        if (!values.grade_level_to_enroll) missing.push('Grade Level to Enroll');
        if (!values.strand) missing.push('Strand');
        if (!values.lrn) missing.push('LRN');
        if (values.enrollment_type === 'TRANSFEREE' && !values.last_school_attended) missing.push('Last School Attended');
        if (missing.length > 0) { toast.error(`Please fill in: ${missing.join(', ')}`); return; }
      } else if (step === 3) {
        const missing = [];
        if (!values.first_name) missing.push('First Name');
        if (!values.last_name) missing.push('Last Name');
        if (!values.birthday) missing.push('Birthday');
        if (!values.sex) missing.push('Sex');
        if (missing.length > 0) { toast.error(`Please fill in: ${missing.join(', ')}`); return; }
      }
    }
    setStepDirection('forward');
    setStep(s => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStepDirection('back');
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Upload handlers ──────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Only JPG and PNG files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be less than 5MB'); return; }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadPhoto(formData);
      setPhotoPath(res.data.student_photo_path);
      toast.success('Photo uploaded successfully');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingPhoto(false); }
  };

  const handleGradesUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setUploadingGrades(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadGrades(formData);
      setGradesPath(res.data.grades_path);
      toast.success('Grades uploaded successfully');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingGrades(false); }
  };

  const handleVoucherUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setUploadingVoucher(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadVoucher(formData);
      setVoucherPath(res.data.voucher_path);
      toast.success('Voucher uploaded successfully');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingVoucher(false); }
  };

  const handlePsaBirthCertUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setUploadingPsaBirthCert(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadPsaBirthCert(formData);
      setPsaBirthCertPath(res.data.psa_birth_cert_path);
      toast.success('PSA Birth Certificate uploaded successfully');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingPsaBirthCert(false); }
  };

  const handleTransferCredentialUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setUploadingTransferCredential(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadTransferCredential(formData);
      setTransferCredentialPath(res.data.transfer_credential_path);
      toast.success('Transfer Credential uploaded successfully');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingTransferCredential(false); }
  };

  const handleGoodMoralUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setUploadingGoodMoral(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadGoodMoral(formData);
      setGoodMoralPath(res.data.good_moral_path);
      toast.success('Good Moral Certificate uploaded successfully');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingGoodMoral(false); }
  };

  const handleLookup = async () => {
    if (!lookupId.trim()) { toast.error('Please enter your student number'); return; }
    setLookingUp(true);
    try {
      const res = await lookupStudent(lookupId.trim());
      const data = res.data;
      const fillFields = [
        'school_year', 'semester', 'lrn', 'is_returning_student', 'last_grade_level_completed',
        'last_school_year_completed', 'last_school_attended', 'school_type', 'strand', 'school_to_enroll_in',
        'school_address', 'psa_birth_certificate_no', 'lrn_learner_ref_no', 'last_name', 'first_name',
        'middle_name', 'suffix', 'birthday', 'sex', 'mother_tongue', 'religion', 'province', 'city_municipality',
        'barangay', 'house_no_street', 'region', 'father_full_name', 'father_contact', 'mother_full_name',
        'mother_contact', 'guardian_full_name', 'guardian_contact',
      ];
      fillFields.forEach((f) => {
        if (data[f] !== undefined && data[f] !== null && data[f] !== '') setValue(f, data[f]);
      });
      setValue('enrollment_type', 'RE_ENROLLEE');
      setEnrollmentType('RE_ENROLLEE');
      if (data.grade_level_to_enroll === 'Grade 11') {
        setValue('grade_level_to_enroll', 'Grade 12');
        setValue('last_grade_level_completed', 'Grade 11');
      }
      if (data.student_photo_path) setPhotoPath(data.student_photo_path);
      if (data.grades_path) setGradesPath(data.grades_path);
      if (data.voucher_path) setVoucherPath(data.voucher_path);
      if (data.psa_birth_cert_path) setPsaBirthCertPath(data.psa_birth_cert_path);

      // Re-initialize address cascade from loaded data
      if (data.region) {
        const saved = data.region.toLowerCase().trim();
        const found = phRegions.find(r => r.name.toLowerCase() === saved || r.long.toLowerCase() === saved || r.key.toLowerCase() === saved);
        if (found) setSelectedRegion(found.key);
      }
      if (data.province) {
        const saved = data.province.toLowerCase().trim();
        const found = phProvinces.find(p => p.name.toLowerCase() === saved || p.key.toLowerCase() === saved);
        if (found) setSelectedProvince(found.key);
      }

      setLookupDone(true);
      toast.success('Previous records loaded! Please review and update any changes before submitting.');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLookingUp(false); }
  };

  // ── Submission ───────────────────────────────────────────────────────
  const isLocked = (status === 'pending' || status === 'approved') && hasSubmitted && !!enrollmentType;
  const isDenied = status === 'denied';

  const doSubmit = (data) => {
    if (isLocked) return;
    const requiredFields = {
      first_name: 'First Name',
      last_name: 'Last Name',
      enrollment_type: 'Enrollment Type',
      grade_level_to_enroll: 'Grade Level to Enroll',
      semester: 'Semester',
      strand: 'Strand',
      lrn: 'LRN',
      birthday: 'Birthday',
      sex: 'Sex',
    };
    if (data.enrollment_type === 'TRANSFEREE') requiredFields.last_school_attended = 'Last School Attended';
    const missing = Object.entries(requiredFields).filter(([key]) => !data[key] || data[key] === '').map(([, label]) => label);
    if (missing.length > 0) { toast.error(`Please fill in: ${missing.join(', ')}`); return; }

    const fields = [
      'enrollment_type', 'school_year', 'semester', 'lrn', 'is_returning_student', 'grade_level_to_enroll',
      'last_grade_level_completed', 'last_school_year_completed', 'last_school_attended', 'school_type',
      'strand', 'school_to_enroll_in', 'school_address', 'psa_birth_certificate_no', 'lrn_learner_ref_no',
      'last_name', 'first_name', 'middle_name', 'suffix', 'birthday', 'sex', 'mother_tongue', 'religion',
      'province', 'city_municipality', 'barangay', 'house_no_street', 'region',
      'father_full_name', 'father_contact', 'mother_full_name', 'mother_contact', 'guardian_full_name', 'guardian_contact',
    ];
    const payload = {};
    fields.forEach((f) => { if (data[f] !== undefined && data[f] !== null && data[f] !== '') payload[f] = data[f]; });
    setPendingData(payload);
    if (data.enrollment_type === 'TRANSFEREE') {
      setShowTransfereeModal(true);
    } else {
      setShowSubmitConfirm(true);
    }
  };

  const handleFinalSubmit = () => {
    const data = getValues();
    doSubmit(data);
  };

  const handleTransfereeModalContinue = () => {
    const hasValid = transfereeSubjects.some((s) => s.subject_name && s.subject_name.trim());
    if (!hasValid) { toast.error('Please add at least one subject with a name before continuing.'); return; }
    setShowTransfereeModal(false);
    setShowSubmitConfirm(true);
  };

  const handleSubmitConfirm = async () => {
    setShowSubmitConfirm(false);
    if (!pendingData) return;
    setSaving(true);
    try {
      const finalPayload = { ...pendingData };
      if (pendingData.enrollment_type === 'TRANSFEREE' && transfereeSubjects.length > 0) {
        finalPayload.transferee_subjects = transfereeSubjects
          .filter((s) => s.subject_name && s.subject_name.trim())
          .map((s) => ({
            subject_name: s.subject_name || '',
            subject_code: s.subject_code || '',
            units: s.units || '',
            grade: s.grade || '',
            credit_status: s.credit_status || 'pending',
          }));
      }
      await updateMyProfile(finalPayload);
      toast.success('Application submitted successfully');
      setStatus('pending');
      setHasSubmitted(true);
      setPendingData(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

  const inputClass = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none uppercase ${isLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`;
  const selectClass = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none ${isLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`;
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  // ── File upload card helper ──────────────────────────────────────────
  const FileCard = ({ label, path, uploading, inputRef, onUpload, accept, badge, badgeColor = 'emerald' }) => (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${badge ? `border-${badgeColor}-200` : ''}`}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {label}
        {badge && <span className={`ml-2 text-sm font-normal text-${badgeColor}-600`}>({badge})</span>}
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          {path ? (
            (path.endsWith('.pdf') || path.includes('/raw/upload/')) ? (
              <a href={getCloudinaryViewUrl(path)} target="_blank" rel="noopener noreferrer" className={`w-24 h-24 rounded-xl bg-${badgeColor}-50 border-2 border-${badgeColor}-200 flex flex-col items-center justify-center text-${badgeColor}-600`}>
                <FileText size={32} /><span className="text-xs mt-1">View PDF</span>
              </a>
            ) : (
              <a href={path} target="_blank" rel="noopener noreferrer">
                <img src={path} alt={label} className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200" />
              </a>
            )
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <FileText size={28} /><span className="text-xs mt-1">No file</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-emerald-600" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">JPG, PNG, or PDF — max 5MB</p>
          <input ref={inputRef} type="file" accept={accept} onChange={onUpload} className="hidden" />
          {!isLocked && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={`flex items-center gap-2 bg-${badgeColor === 'amber' ? 'amber' : 'emerald'}-600 hover:bg-${badgeColor === 'amber' ? 'amber' : 'emerald'}-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50`}
            >
              <Upload size={16} />
              {path ? 'Change File' : `Upload ${label}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 size={40} className="animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium text-gray-600">Submitting your application...</p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link to="/student/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registration Application Form</h1>
          <p className="text-gray-500 text-sm">
            {isLocked
              ? 'Your application has been submitted and is currently locked.'
              : isDenied
                ? 'Your application was denied. Please update and resubmit.'
                : 'Fill out the form below and submit your application for review.'}
          </p>
        </div>
      </div>

      {/* Status Banners */}
      {isLocked && (
        <div className="mb-6 flex items-center gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
          <Lock size={18} className="shrink-0" />
          <p>Your application is <strong>pending review</strong>. You cannot make changes until the admin reviews it.</p>
        </div>
      )}
      {status === 'approved' && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
          <CheckCircle size={18} className="shrink-0" />
          <p>Your application has been <strong>approved</strong>. Go to your <Link to="/student/dashboard" className="underline font-medium">Dashboard</Link> to upload your payment receipt and proceed with enrollment.</p>
        </div>
      )}
      {isDenied && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl text-sm">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p>Your application was <strong>denied</strong>. Please review your information, make corrections, and resubmit.</p>
              {denialReason && (
                <div className="mt-2 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                  <span className="font-semibold">Reason: </span>{denialReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <StepIndicator current={step} />

      <div
        key={step}
        className={stepDirection === 'forward' ? 'animate-slide-from-right' : 'animate-slide-from-left'}
        style={{ overflow: 'hidden' }}
      >

      {/* ── Step 1: Enrollment Type ─────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Student Type <span className="text-red-500">*</span></label>
              <select {...register('enrollment_type')} disabled={isLocked} className={selectClass}>
                <option value="">Select Type</option>
                <option value="NEW_ENROLLEE">New Enrollee</option>
                <option value="TRANSFEREE">Transferee</option>
                <option value="RE_ENROLLEE">Re-Enrollee</option>
              </select>
            </div>
          </div>

          {enrollmentType === 'TRANSFEREE' && !isLocked && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-amber-800">Transferee Requirements</h3>
              <p className="text-xs text-amber-700">As a transferee, please make sure to provide the following:</p>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                <li><strong>Previous School Subjects</strong> (required) — click the button below to add them</li>
                <li><strong>Last School Attended</strong> (required) — fill this in Step 2</li>
                <li><strong>Transfer Credential / Form 137</strong> — upload in Step 6</li>
                <li><strong>Good Moral Certificate</strong> — upload in Step 6</li>
              </ul>
              <div className="pt-1 flex items-center gap-3">
                <button type="button" onClick={() => setShowTransfereeModal(true)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  <BookOpen size={15} />
                  {transfereeSubjects.filter(s => s.subject_name?.trim()).length > 0 ? 'Edit Previous School Subjects' : 'Add Previous School Subjects'}
                </button>
                {transfereeSubjects.filter(s => s.subject_name?.trim()).length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                    <CheckCircle size={12} />
                    {transfereeSubjects.filter(s => s.subject_name?.trim()).length} subject{transfereeSubjects.filter(s => s.subject_name?.trim()).length !== 1 ? 's' : ''} added
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">No subjects added yet — required before submitting</span>
                )}
              </div>
            </div>
          )}

          {enrollmentType === 'RE_ENROLLEE' && !isLocked && !lookupDone && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Returning Student? Load your previous records</h3>
              <p className="text-xs text-blue-600 mb-3">Enter your student number from your previous enrollment to auto-fill your information.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="e.g. DBTC-1-26"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
                />
                <button type="button" onClick={handleLookup} disabled={lookingUp} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                  {lookingUp ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {lookingUp ? 'Looking up...' : 'Look Up'}
                </button>
              </div>
            </div>
          )}

          {lookupDone && (
            <div className="mt-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              <CheckCircle size={18} className="shrink-0" />
              <p>Previous records loaded from <strong>{lookupId}</strong>. Please review the pre-filled data and update anything that has changed.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: School Info ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Grade Level &amp; School Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>School Year</label>
              <input {...register('school_year')} disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Set by admin" />
            </div>
            <div>
              <label className={labelClass}>Semester <span className="text-red-500">*</span></label>
              <input {...register('semester')} disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Set by admin" />
            </div>
            <div>
              <label className={labelClass}>LRN <span className="text-red-500">*</span></label>
              <input {...register('lrn')} disabled={isLocked} className={inputClass} placeholder="Learner Reference Number" />
            </div>
            <div>
              <label className={labelClass}>Grade Level to Enroll <span className="text-red-500">*</span></label>
              {enrollmentType === 'NEW_ENROLLEE' ? (
                <input value="Grade 11" disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
              ) : (
                <select {...register('grade_level_to_enroll')} disabled={isLocked} className={selectClass}>
                  <option value="">Select</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              )}
            </div>
            <div>
              <label className={labelClass}>Last Grade Completed</label>
              {enrollmentType === 'NEW_ENROLLEE' ? (
                <input value="Grade 10" disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
              ) : (
                <input {...register('last_grade_level_completed')} disabled={isLocked} className={inputClass} />
              )}
            </div>
            <div>
              <label className={labelClass}>Last School Year Completed</label>
              <input {...register('last_school_year_completed')} disabled={isLocked} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                Last School Attended {enrollmentType === 'TRANSFEREE' && <span className="text-red-500">*</span>}
              </label>
              <input {...register('last_school_attended')} disabled={isLocked} className={inputClass} placeholder={enrollmentType === 'TRANSFEREE' ? 'Required for transferees' : ''} />
            </div>
            <div>
              <label className={labelClass}>School Type</label>
              <select {...register('school_type')} disabled={isLocked} className={selectClass}>
                <option value="">Select</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Strand <span className="text-red-500">*</span></label>
              <select {...register('strand')} disabled={isLocked} className={selectClass}>
                <option value="">Select</option>
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
              <label className={labelClass}>School to Enroll In</label>
              <input {...register('school_to_enroll_in')} disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>School Address</label>
              <input {...register('school_address')} disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Personal Info ───────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* ID Photo */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ID Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {photoPath ? (
                  <img src={photoPath} alt="Student ID Photo" className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <User size={36} /><span className="text-xs mt-1">No photo</span>
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Upload a 2x2 ID photo (JPG or PNG, max 5MB)</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} className="hidden" />
                {!isLocked && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                    <Camera size={16} />
                    {photoPath ? 'Change Photo' : 'Upload Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Personal Fields */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className={labelClass}>Last Name <span className="text-red-500">*</span></label><input {...register('last_name')} disabled={isLocked} className={inputClass} /></div>
              <div><label className={labelClass}>First Name <span className="text-red-500">*</span></label><input {...register('first_name')} disabled={isLocked} className={inputClass} /></div>
              <div><label className={labelClass}>Middle Name</label><input {...register('middle_name')} disabled={isLocked} className={inputClass} /></div>
              <div><label className={labelClass}>Suffix</label><input {...register('suffix')} disabled={isLocked} className={inputClass} placeholder="Jr., III, etc." /></div>
              <div><label className={labelClass}>Birthday <span className="text-red-500">*</span></label><input type="date" {...register('birthday')} disabled={isLocked} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Sex <span className="text-red-500">*</span></label>
                <select {...register('sex')} disabled={isLocked} className={selectClass}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div><label className={labelClass}>Mother Tongue</label><input {...register('mother_tongue')} disabled={isLocked} className={inputClass} /></div>
              <div><label className={labelClass}>Religion</label><input {...register('religion')} disabled={isLocked} className={inputClass} /></div>
              <div><label className={labelClass}>PSA Birth Certificate No.</label><input {...register('psa_birth_certificate_no')} disabled={isLocked} className={inputClass} /></div>
              <div><label className={labelClass}>LRN / Learner Reference No.</label><input {...register('lrn_learner_ref_no')} disabled={isLocked} className={inputClass} /></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Address ─────────────────────────────────────────── */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Student Address</h2>
          <p className="text-sm text-gray-500 mb-4">Select your region first, then province, then city/municipality.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Region */}
            <div>
              <label className={labelClass}>Region</label>
              <select
                value={selectedRegion}
                onChange={handleRegionChange}
                disabled={isLocked}
                className={selectClass}
              >
                <option value="">Select Region</option>
                {phRegions.map(r => (
                  <option key={r.key} value={r.key}>{r.name} — {r.long}</option>
                ))}
              </select>
              {/* hidden field for form value */}
              <input type="hidden" {...register('region')} />
            </div>

            {/* Province */}
            <div>
              <label className={labelClass}>Province</label>
              <select
                value={selectedProvince}
                onChange={handleProvinceChange}
                disabled={isLocked || !selectedRegion}
                className={selectClass}
              >
                <option value="">{selectedRegion ? 'Select Province' : 'Select a region first'}</option>
                {filteredProvinces.map(p => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
              <input type="hidden" {...register('province')} />
            </div>

            {/* City / Municipality */}
            <div>
              <label className={labelClass}>City / Municipality</label>
              <select
                value={watch('city_municipality') || ''}
                onChange={handleCityChange}
                disabled={isLocked || !selectedProvince}
                className={selectClass}
              >
                <option value="">{selectedProvince ? 'Select City / Municipality' : 'Select a province first'}</option>
                {filteredCities.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <input type="hidden" {...register('city_municipality')} />
            </div>

            {/* Barangay — free text (too many to bundle) */}
            <div>
              <label className={labelClass}>Barangay</label>
              <input {...register('barangay')} disabled={isLocked} className={inputClass} placeholder="Enter barangay" />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>House No. / Street</label>
              <input {...register('house_no_street')} disabled={isLocked} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5: Parent / Guardian ───────────────────────────────── */}
      {step === 5 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Parent / Guardian Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Father's Full Name</label><input {...register('father_full_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Father's Contact No.</label><input {...register('father_contact')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Mother's Full Name</label><input {...register('mother_full_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Mother's Contact No.</label><input {...register('mother_contact')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Guardian's Full Name</label><input {...register('guardian_full_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Guardian's Contact No.</label><input {...register('guardian_contact')} disabled={isLocked} className={inputClass} /></div>
          </div>
        </div>
      )}

      {/* ── Step 6: Documents ───────────────────────────────────────── */}
      {step === 6 && (
        <div className="space-y-6">
          {/* Transferee locked subject view */}
          {isLocked && enrollmentType === 'TRANSFEREE' && transfereeSubjects.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-amber-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Previous School Subjects <span className="ml-2 text-sm font-normal text-amber-600">(Transferee)</span></h2>
                  <p className="text-xs text-gray-500 mt-0.5">Subjects you submitted. The registrar will determine which are credited.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium pr-3">Subject Name</th>
                      <th className="pb-2 font-medium pr-3">Subject Code</th>
                      <th className="pb-2 font-medium pr-3">Final Grade</th>
                      <th className="pb-2 font-medium">Credit Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfereeSubjects.map((subj, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{subj.subject_name || '—'}</td>
                        <td className="py-2 pr-3 text-gray-500">{subj.subject_code || '—'}</td>
                        <td className="py-2 pr-3">{subj.grade || '—'}</td>
                        <td className="py-2">
                          {subj.credit_status === 'credited' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"><CheckCircle size={11} /> Credited</span>
                          ) : subj.credit_status === 'not_credited' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full"><AlertCircle size={11} /> Not Credited</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">Pending Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileCard
              label="Last School Grades"
              path={gradesPath}
              uploading={uploadingGrades}
              inputRef={gradesInputRef}
              onUpload={handleGradesUpload}
              accept="image/jpeg,image/png,application/pdf"
            />
            <FileCard
              label="Voucher"
              badge="Optional"
              path={voucherPath}
              uploading={uploadingVoucher}
              inputRef={voucherInputRef}
              onUpload={handleVoucherUpload}
              accept="image/jpeg,image/png,application/pdf"
            />

            {enrollmentType === 'TRANSFEREE' && (
              <>
                <FileCard
                  label="Transfer Credential / Form 137"
                  badge="Transferee"
                  badgeColor="amber"
                  path={transferCredentialPath}
                  uploading={uploadingTransferCredential}
                  inputRef={transferCredentialInputRef}
                  onUpload={handleTransferCredentialUpload}
                  accept="image/jpeg,image/png,application/pdf"
                />
                <FileCard
                  label="Good Moral Certificate"
                  badge="Transferee"
                  badgeColor="amber"
                  path={goodMoralPath}
                  uploading={uploadingGoodMoral}
                  inputRef={goodMoralInputRef}
                  onUpload={handleGoodMoralUpload}
                  accept="image/jpeg,image/png,application/pdf"
                />
              </>
            )}

            <div className="md:col-span-2">
              <FileCard
                label="PSA Birth Certificate"
                path={psaBirthCertPath}
                uploading={uploadingPsaBirthCert}
                inputRef={psaBirthCertInputRef}
                onUpload={handlePsaBirthCertUpload}
                accept="image/jpeg,image/png,application/pdf"
              />
            </div>
          </div>
        </div>
      )}

      </div>{/* end animated step wrapper */}

      {/* ── Navigation Buttons ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : !isLocked ? (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {saving ? 'Submitting...' : isDenied ? 'Resubmit Application' : 'Submit Application'}
          </button>
        ) : null}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <ConfirmModal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmitConfirm}
        title={isDenied ? 'Resubmit Application' : 'Submit Application'}
        message={isDenied
          ? 'Are you sure you want to resubmit your application? It will be sent for admin review.'
          : 'Are you sure you want to submit your application? You will not be able to make changes until the admin reviews it.'}
        confirmText={isDenied ? 'Resubmit' : 'Submit'}
        variant="success"
        loading={saving}
      />

      {/* Transferee Subjects Modal */}
      {showTransfereeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-6 border-b shrink-0">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                  <BookOpen size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Previous School Subjects</h3>
                  <p className="text-sm text-gray-500 mt-0.5 max-w-lg">
                    List all subjects from your previous school. The registrar will determine which can be credited.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTransfereeModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 shrink-0 ml-4">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex-1">
                  <AlertCircle size={15} className="shrink-0 text-amber-500" />
                  <span>At least one subject with a name is required to proceed.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTransfereeSubjects(prev => [...prev, { subject_name: '', subject_code: '', units: '', grade: '', credit_status: 'pending' }])}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition shrink-0"
                >
                  <Plus size={15} />
                  Add Subject
                </button>
              </div>

              {transfereeSubjects.length === 0 ? (
                <div className="text-center py-14 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200">
                  <BookOpen size={40} className="mx-auto mb-3 text-amber-300" />
                  <p className="text-gray-600 font-medium">No subjects added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click <strong>"Add Subject"</strong> above to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500 bg-gray-50">
                        <th className="pb-3 pt-2 px-3 font-medium rounded-l-lg">Subject Name <span className="text-red-500">*</span></th>
                        <th className="pb-3 pt-2 px-2 font-medium">Subject Code</th>
                        <th className="pb-3 pt-2 px-2 font-medium w-32">Final Grade</th>
                        <th className="pb-3 pt-2 px-2 font-medium w-10 rounded-r-lg"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfereeSubjects.map((subj, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2.5 px-3">
                            <input type="text" value={subj.subject_name} onChange={(e) => { const u = [...transfereeSubjects]; u[idx] = { ...u[idx], subject_name: e.target.value }; setTransfereeSubjects(u); }} placeholder="e.g. General Mathematics" className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none" />
                          </td>
                          <td className="py-2.5 px-2">
                            <input type="text" value={subj.subject_code} onChange={(e) => { const u = [...transfereeSubjects]; u[idx] = { ...u[idx], subject_code: e.target.value }; setTransfereeSubjects(u); }} placeholder="e.g. GENMATH" className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none" />
                          </td>
                          <td className="py-2.5 px-2">
                            <input type="text" value={subj.grade} onChange={(e) => { const u = [...transfereeSubjects]; u[idx] = { ...u[idx], grade: e.target.value }; setTransfereeSubjects(u); }} placeholder="e.g. 88" className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none" />
                          </td>
                          <td className="py-2.5 px-2">
                            <button type="button" onClick={() => setTransfereeSubjects(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-5 border-t shrink-0 bg-gray-50 rounded-b-2xl flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {transfereeSubjects.filter(s => s.subject_name?.trim()).length} subject{transfereeSubjects.filter(s => s.subject_name?.trim()).length !== 1 ? 's' : ''} entered
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowTransfereeModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition">
                  Back to Form
                </button>
                <button type="button" onClick={handleTransfereeModalContinue} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
                  <Send size={15} />
                  Continue to Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
