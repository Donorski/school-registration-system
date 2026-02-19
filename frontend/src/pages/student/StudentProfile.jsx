import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Send, Loader2, Lock, AlertCircle, CheckCircle, Camera, User, Upload, FileText, Ticket, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { getMyProfile, updateMyProfile, uploadPhoto, uploadGrades, uploadVoucher, uploadPsaBirthCert, uploadTransferCredential, uploadGoodMoral, lookupStudent } from '../../services/api';
import { getErrorMessage } from '../../utils/helpers';

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
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
  const fileInputRef = useRef(null);
  const gradesInputRef = useRef(null);
  const voucherInputRef = useRef(null);
  const psaBirthCertInputRef = useRef(null);
  const transferCredentialInputRef = useRef(null);
  const goodMoralInputRef = useRef(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const watchedEnrollmentType = watch('enrollment_type');

  useEffect(() => {
    if (watchedEnrollmentType !== undefined) {
      setEnrollmentType(watchedEnrollmentType || '');
    }
  }, [watchedEnrollmentType]);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        reset(res.data);
        setStatus(res.data.status);
        setPhotoPath(res.data.student_photo_path);
        setGradesPath(res.data.grades_path);
        setVoucherPath(res.data.voucher_path);
        setPsaBirthCertPath(res.data.psa_birth_cert_path);
        setTransferCredentialPath(res.data.transfer_credential_path);
        setGoodMoralPath(res.data.good_moral_path);
        setEnrollmentType(res.data.enrollment_type || '');
        setHasSubmitted(!!res.data.first_name && !!res.data.last_name);
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const handleLookup = async () => {
    if (!lookupId.trim()) {
      toast.error('Please enter your student number');
      return;
    }
    setLookingUp(true);
    try {
      const res = await lookupStudent(lookupId.trim());
      const data = res.data;

      // Pre-fill form fields from previous record
      const fillFields = [
        'school_year','semester','lrn','is_returning_student','last_grade_level_completed',
        'last_school_year_completed','last_school_attended','school_type','strand','school_to_enroll_in',
        'school_address','psa_birth_certificate_no','lrn_learner_ref_no','last_name','first_name',
        'middle_name','suffix','birthday','sex','mother_tongue','religion','province','city_municipality',
        'barangay','house_no_street','region','father_full_name','father_contact','mother_full_name',
        'mother_contact','guardian_full_name','guardian_contact',
      ];
      fillFields.forEach((f) => {
        if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
          setValue(f, data[f]);
        }
      });

      // Keep enrollment type as RE_ENROLLEE
      setValue('enrollment_type', 'RE_ENROLLEE');
      setEnrollmentType('RE_ENROLLEE');

      // Auto-advance grade level: Grade 11 → Grade 12
      if (data.grade_level_to_enroll === 'Grade 11') {
        setValue('grade_level_to_enroll', 'Grade 12');
        setValue('last_grade_level_completed', 'Grade 11');
      }

      // Carry over uploaded files
      if (data.student_photo_path) setPhotoPath(data.student_photo_path);
      if (data.grades_path) setGradesPath(data.grades_path);
      if (data.voucher_path) setVoucherPath(data.voucher_path);
      if (data.psa_birth_cert_path) setPsaBirthCertPath(data.psa_birth_cert_path);

      setLookupDone(true);
      toast.success('Previous records loaded! Please review and update any changes before submitting.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLookingUp(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadPhoto(formData);
      setPhotoPath(res.data.student_photo_path);
      toast.success('Photo uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGradesUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    setUploadingGrades(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadGrades(formData);
      setGradesPath(res.data.grades_path);
      toast.success('Grades uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingGrades(false);
    }
  };

  const handleVoucherUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    setUploadingVoucher(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadVoucher(formData);
      setVoucherPath(res.data.voucher_path);
      toast.success('Voucher uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingVoucher(false);
    }
  };

  const handlePsaBirthCertUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    setUploadingPsaBirthCert(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadPsaBirthCert(formData);
      setPsaBirthCertPath(res.data.psa_birth_cert_path);
      toast.success('PSA Birth Certificate uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingPsaBirthCert(false);
    }
  };

  const handleTransferCredentialUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    setUploadingTransferCredential(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadTransferCredential(formData);
      setTransferCredentialPath(res.data.transfer_credential_path);
      toast.success('Transfer Credential uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingTransferCredential(false);
    }
  };

  const handleGoodMoralUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    setUploadingGoodMoral(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadGoodMoral(formData);
      setGoodMoralPath(res.data.good_moral_path);
      toast.success('Good Moral Certificate uploaded successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingGoodMoral(false);
    }
  };

  const isLocked = (status === 'pending' || status === 'approved') && hasSubmitted;
  const isDenied = status === 'denied';

  const onSubmit = (data) => {
    if (isLocked) return;

    const requiredFields = {
      first_name: 'First Name',
      last_name: 'Last Name',
      enrollment_type: 'Enrollment Type',
      grade_level_to_enroll: 'Grade Level to Enroll',
      semester: 'Semester',
      strand: 'Strand',
      birthday: 'Birthday',
      sex: 'Sex',
    };

    // Additional required fields for transferees
    if (data.enrollment_type === 'TRANSFEREE') {
      requiredFields.last_school_attended = 'Last School Attended';
    }

    const missing = Object.entries(requiredFields)
      .filter(([key]) => !data[key] || data[key] === '')
      .map(([, label]) => label);
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    const fields = [
      'enrollment_type','school_year','semester','lrn','is_returning_student','grade_level_to_enroll','last_grade_level_completed',
      'last_school_year_completed','last_school_attended','school_type','strand','school_to_enroll_in',
      'school_address','psa_birth_certificate_no','lrn_learner_ref_no','last_name','first_name',
      'middle_name','suffix','birthday','sex','mother_tongue','religion','province','city_municipality',
      'barangay','house_no_street','region','father_full_name','father_contact','mother_full_name',
      'mother_contact','guardian_full_name','guardian_contact',
    ];
    const payload = {};
    fields.forEach((f) => {
      if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
        payload[f] = data[f];
      }
    });
    setPendingData(payload);
    setShowSubmitConfirm(true);
  };

  const handleSubmitConfirm = async () => {
    setShowSubmitConfirm(false);
    if (!pendingData) return;
    setSaving(true);
    try {
      await updateMyProfile(pendingData);
      toast.success('Application submitted successfully');
      setStatus('pending');
      setHasSubmitted(true);
      setPendingData(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner size="lg" /></DashboardLayout>;

  const inputClass = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none ${isLocked ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`;
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <DashboardLayout>
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

      {/* Status Banner */}
      {status === 'pending' && (
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
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <p>Your application was <strong>denied</strong>. Please review your information, make corrections, and resubmit.</p>
        </div>
      )}

      {/* ID Photo Upload */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ID Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {photoPath ? (
              <img
                src={`/uploads/${photoPath}`}
                alt="Student ID Photo"
                className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <User size={36} />
                <span className="text-xs mt-1">No photo</span>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {!isLocked && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <Camera size={16} />
                {photoPath ? 'Change Photo' : 'Upload Photo'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Grades Upload */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Last School Grades</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {gradesPath ? (
                gradesPath.endsWith('.pdf') ? (
                  <div className="w-24 h-24 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center text-emerald-600">
                    <FileText size={32} />
                    <span className="text-xs mt-1">PDF</span>
                  </div>
                ) : (
                  <img
                    src={`/uploads/${gradesPath}`}
                    alt="Grades"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                )
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <FileText size={28} />
                  <span className="text-xs mt-1">No file</span>
                </div>
              )}
              {uploadingGrades && (
                <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-emerald-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Upload your report card or grades from your last school (JPG, PNG, or PDF, max 5MB)</p>
              <input
                ref={gradesInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleGradesUpload}
                className="hidden"
              />
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => gradesInputRef.current?.click()}
                  disabled={uploadingGrades}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Upload size={16} />
                  {gradesPath ? 'Change File' : 'Upload Grades'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Voucher Upload */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Voucher <span className="text-sm font-normal text-gray-400">(Optional)</span></h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {voucherPath ? (
                voucherPath.endsWith('.pdf') ? (
                  <div className="w-24 h-24 rounded-xl bg-blue-50 border-2 border-blue-200 flex flex-col items-center justify-center text-blue-600">
                    <FileText size={32} />
                    <span className="text-xs mt-1">PDF</span>
                  </div>
                ) : (
                  <img
                    src={`/uploads/${voucherPath}`}
                    alt="Voucher"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                )
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <Ticket size={28} />
                  <span className="text-xs mt-1">No file</span>
                </div>
              )}
              {uploadingVoucher && (
                <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-emerald-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Upload a photo of your voucher if you have one (JPG, PNG, or PDF, max 5MB)</p>
              <input
                ref={voucherInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleVoucherUpload}
                className="hidden"
              />
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => voucherInputRef.current?.click()}
                  disabled={uploadingVoucher}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Upload size={16} />
                  {voucherPath ? 'Change File' : 'Upload Voucher'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Credential Upload — Transferee only */}
        {enrollmentType === 'TRANSFEREE' && (
          <div className="bg-white rounded-xl shadow-sm border p-6 border-amber-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Transfer Credential / Form 137 <span className="text-sm font-normal text-amber-600">(Transferee)</span></h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                {transferCredentialPath ? (
                  transferCredentialPath.endsWith('.pdf') ? (
                    <div className="w-24 h-24 rounded-xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center text-amber-600">
                      <FileText size={32} />
                      <span className="text-xs mt-1">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={`/uploads/${transferCredentialPath}`}
                      alt="Transfer Credential"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                    />
                  )
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <FileText size={28} />
                    <span className="text-xs mt-1">No file</span>
                  </div>
                )}
                {uploadingTransferCredential && (
                  <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Upload your Transfer Credential or Form 137 from your previous school (JPG, PNG, or PDF, max 5MB)</p>
                <input
                  ref={transferCredentialInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleTransferCredentialUpload}
                  className="hidden"
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => transferCredentialInputRef.current?.click()}
                    disabled={uploadingTransferCredential}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {transferCredentialPath ? 'Change File' : 'Upload Transfer Credential'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Good Moral Certificate Upload — Transferee only */}
        {enrollmentType === 'TRANSFEREE' && (
          <div className="bg-white rounded-xl shadow-sm border p-6 border-amber-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Good Moral Certificate <span className="text-sm font-normal text-amber-600">(Transferee)</span></h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                {goodMoralPath ? (
                  goodMoralPath.endsWith('.pdf') ? (
                    <div className="w-24 h-24 rounded-xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center text-amber-600">
                      <FileText size={32} />
                      <span className="text-xs mt-1">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={`/uploads/${goodMoralPath}`}
                      alt="Good Moral Certificate"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                    />
                  )
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <FileText size={28} />
                    <span className="text-xs mt-1">No file</span>
                  </div>
                )}
                {uploadingGoodMoral && (
                  <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Upload your Good Moral Certificate from your previous school (JPG, PNG, or PDF, max 5MB)</p>
                <input
                  ref={goodMoralInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleGoodMoralUpload}
                  className="hidden"
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => goodMoralInputRef.current?.click()}
                    disabled={uploadingGoodMoral}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {goodMoralPath ? 'Change File' : 'Upload Good Moral'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PSA Birth Certificate Upload */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">PSA Birth Certificate</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              {psaBirthCertPath ? (
                psaBirthCertPath.endsWith('.pdf') ? (
                  <div className="w-24 h-24 rounded-xl bg-orange-50 border-2 border-orange-200 flex flex-col items-center justify-center text-orange-600">
                    <FileText size={32} />
                    <span className="text-xs mt-1">PDF</span>
                  </div>
                ) : (
                  <img
                    src={`/uploads/${psaBirthCertPath}`}
                    alt="PSA Birth Certificate"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                )
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <FileText size={28} />
                  <span className="text-xs mt-1">No file</span>
                </div>
              )}
              {uploadingPsaBirthCert && (
                <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-emerald-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Upload a soft copy of your PSA Birth Certificate (JPG, PNG, or PDF, max 5MB)</p>
              <input
                ref={psaBirthCertInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handlePsaBirthCertUpload}
                className="hidden"
              />
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => psaBirthCertInputRef.current?.click()}
                  disabled={uploadingPsaBirthCert}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Upload size={16} />
                  {psaBirthCertPath ? 'Change File' : 'Upload PSA Birth Certificate'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enrollment Type */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Student Type <span className="text-red-500">*</span></label>
              <select {...register('enrollment_type')} disabled={isLocked} className={inputClass}>
                <option value="">Select Type</option>
                <option value="NEW_ENROLLEE">New Enrollee</option>
                <option value="TRANSFEREE">Transferee</option>
                <option value="RE_ENROLLEE">Re-Enrollee</option>
              </select>
            </div>
          </div>

          {/* Transferee Info Banner */}
          {enrollmentType === 'TRANSFEREE' && !isLocked && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Transferee Requirements</h3>
              <p className="text-xs text-amber-700 mb-2">
                As a transferee from another school, please make sure to provide the following:
              </p>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                <li><strong>Last School Attended</strong> (required) — fill this in Section A below</li>
                <li><strong>Transfer Credential / Form 137</strong> — upload below</li>
                <li><strong>Good Moral Certificate</strong> — upload below</li>
                <li><strong>Last School Grades / Report Card</strong> — upload in the documents section above</li>
              </ul>
            </div>
          )}

          {/* Re-Enrollee Lookup */}
          {enrollmentType === 'RE_ENROLLEE' && !isLocked && !lookupDone && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Returning Student? Load your previous records</h3>
              <p className="text-xs text-blue-600 mb-3">
                Enter your student number from your previous enrollment to auto-fill your information.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="e.g. DBTC-1-26"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookingUp}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {lookingUp ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {lookingUp ? 'Looking up...' : 'Look Up'}
                </button>
              </div>
            </div>
          )}

          {/* Lookup Success Banner */}
          {lookupDone && (
            <div className="mt-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              <CheckCircle size={18} className="shrink-0" />
              <p>Previous records loaded from <strong>{lookupId}</strong>. Please review the pre-filled data and update anything that has changed.</p>
            </div>
          )}
        </div>

        {/* A. School Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">A. Grade Level & School Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelClass}>School Year</label><input {...register('school_year')} disabled={isLocked} className={inputClass} placeholder="e.g. 2024-2025" /></div>
            <div><label className={labelClass}>Semester <span className="text-red-500">*</span></label>
              <select {...register('semester')} disabled={isLocked} className={inputClass}>
                <option value="">Select</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
              </select>
            </div>
            <div><label className={labelClass}>LRN</label><input {...register('lrn')} disabled={isLocked} className={inputClass} placeholder="Learner Reference Number" /></div>
            <div><label className={labelClass}>Grade Level to Enroll <span className="text-red-500">*</span></label>
              <select {...register('grade_level_to_enroll')} disabled={isLocked} className={inputClass}>
                <option value="">Select</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
            <div><label className={labelClass}>Last Grade Completed</label><input {...register('last_grade_level_completed')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Last School Year Completed</label><input {...register('last_school_year_completed')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Last School Attended {enrollmentType === 'TRANSFEREE' && <span className="text-red-500">*</span>}</label><input {...register('last_school_attended')} disabled={isLocked} className={inputClass} placeholder={enrollmentType === 'TRANSFEREE' ? 'Required for transferees' : ''} /></div>
            <div><label className={labelClass}>School Type</label>
              <select {...register('school_type')} disabled={isLocked} className={inputClass}>
                <option value="">Select</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div><label className={labelClass}>Strand <span className="text-red-500">*</span></label>
              <select {...register('strand')} disabled={isLocked} className={inputClass}>
                <option value="">Select</option>
                <option value="STEM">STEM</option>
                <option value="ABM">ABM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="GAS">GAS</option>
                <option value="TVL-ICT">TVL-ICT</option>
                <option value="TVL-HE">TVL-HE</option>
                <option value="TVL-IA">TVL-IA</option>
                <option value="TVL-AFA">TVL-AFA</option>
                <option value="SPORTS">Sports Track</option>
                <option value="ARTS">Arts and Design</option>
              </select>
            </div>
            <div><label className={labelClass}>School to Enroll In</label><input {...register('school_to_enroll_in')} disabled={isLocked} className={inputClass} /></div>
            <div className="md:col-span-2"><label className={labelClass}>School Address</label><input {...register('school_address')} disabled={isLocked} className={inputClass} /></div>
          </div>
        </div>

        {/* B. Student Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">B. Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelClass}>Last Name <span className="text-red-500">*</span></label><input {...register('last_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>First Name <span className="text-red-500">*</span></label><input {...register('first_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Middle Name</label><input {...register('middle_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Suffix</label><input {...register('suffix')} disabled={isLocked} className={inputClass} placeholder="Jr., III, etc." /></div>
            <div><label className={labelClass}>Birthday <span className="text-red-500">*</span></label><input type="date" {...register('birthday')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Sex <span className="text-red-500">*</span></label>
              <select {...register('sex')} disabled={isLocked} className={inputClass}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div><label className={labelClass}>Mother Tongue</label><input {...register('mother_tongue')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Religion</label><input {...register('religion')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>PSA Birth Certificate No.</label><input {...register('psa_birth_certificate_no')} disabled={isLocked} className={inputClass} /></div>
          </div>
        </div>

        {/* C. Address */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">C. Student Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className={labelClass}>Region</label><input {...register('region')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Province</label><input {...register('province')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>City / Municipality</label><input {...register('city_municipality')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Barangay</label><input {...register('barangay')} disabled={isLocked} className={inputClass} /></div>
            <div className="md:col-span-2"><label className={labelClass}>House No. / Street</label><input {...register('house_no_street')} disabled={isLocked} className={inputClass} /></div>
          </div>
        </div>

        {/* D. Parent/Guardian */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">D. Parent / Guardian Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Father's Full Name</label><input {...register('father_full_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Father's Contact No.</label><input {...register('father_contact')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Mother's Full Name</label><input {...register('mother_full_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Mother's Contact No.</label><input {...register('mother_contact')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Guardian's Full Name</label><input {...register('guardian_full_name')} disabled={isLocked} className={inputClass} /></div>
            <div><label className={labelClass}>Guardian's Contact No.</label><input {...register('guardian_contact')} disabled={isLocked} className={inputClass} /></div>
          </div>
        </div>

        {/* Submit */}
        {!isLocked && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {saving ? 'Submitting...' : isDenied ? 'Resubmit Application' : 'Submit Application'}
            </button>
          </div>
        )}
      </form>

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
    </DashboardLayout>
  );
}
