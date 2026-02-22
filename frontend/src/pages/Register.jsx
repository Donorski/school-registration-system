import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle, Check, X, CalendarX } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerStudent, getEnrollmentStatus } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/helpers';

const ROLE_REDIRECTS = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  registrar: '/registrar/dashboard',
};

function computeStrength(pw = '') {
  const rules = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  ];
  return rules;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500', 'bg-emerald-500'];
const STRENGTH_TEXT   = ['', 'text-red-600', 'text-orange-500', 'text-yellow-600', 'text-emerald-600', 'text-emerald-600'];

const RULE_LABELS = [
  'At least 8 characters',
  'Uppercase letter (A–Z)',
  'Lowercase letter (a–z)',
  'Number (0–9)',
  'Special character (!@#$…)',
];

export default function Register() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password', '');
  const rules = computeStrength(password);
  const score = rules.filter(Boolean).length; // 0–5, treat 5 same as 4 for display

  useEffect(() => {
    if (user) {
      navigate(ROLE_REDIRECTS[user.role] || '/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    getEnrollmentStatus()
      .then((res) => setEnrollmentStatus(res.data))
      .catch(() => setEnrollmentStatus({ is_open: true })) // fail open so network errors don't block registration
      .finally(() => setStatusLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setRegisterError('');
    try {
      const res = await registerStudent({ email: data.email, password: data.password });
      const { access_token, role } = res.data;
      loginUser(access_token, { email: data.email, role });
      toast.success('Account created! Please fill out your application form.');
    } catch (err) {
      const msg = getErrorMessage(err);
      setRegisterError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 px-4 relative overflow-hidden">
      {/* Background logo watermark */}
      <img
        src="/images/logo.png"
        alt=""
        className="absolute opacity-5 w-[600px] h-[600px] object-contain pointer-events-none select-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="DBTC Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Create Your Account</h1>
          <p className="text-gray-500 mt-1">Register to apply for enrollment</p>
        </div>

        {/* Enrollment closed banner */}
        {!statusLoading && enrollmentStatus && !enrollmentStatus.is_open && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-4 mb-6">
            <CalendarX size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Enrollment is Closed</p>
              <p className="text-xs mt-0.5">{enrollmentStatus.message}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {registerError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <p>{registerError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: {
                      hasUppercase: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
                      hasLowercase: (v) => /[a-z]/.test(v) || 'Must contain at least one lowercase letter',
                      hasNumber: (v) => /[0-9]/.test(v) || 'Must contain at least one number',
                      hasSpecial: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Must contain at least one special character',
                    },
                  })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition pr-10 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            score >= i ? STRENGTH_COLORS[Math.min(score, 4)] : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ml-2 ${STRENGTH_TEXT[Math.min(score, 4)]}`}>
                      {STRENGTH_LABELS[Math.min(score, 4)]}
                    </span>
                  </div>

                  {/* Per-rule checklist */}
                  <div className="mt-2 space-y-1">
                    {RULE_LABELS.map((label, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {rules[i] ? (
                          <Check size={13} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={13} className="text-gray-300 shrink-0" />
                        )}
                        <span className={`text-xs ${rules[i] ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
              {!password && !errors.password && (
                <p className="text-gray-400 text-xs mt-1">Min. 8 characters with uppercase, lowercase, number &amp; special character</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition pr-10 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || (enrollmentStatus && !enrollmentStatus.is_open)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
            {enrollmentStatus && !enrollmentStatus.is_open && (
              <p className="text-center text-xs text-amber-600 mt-2">Registration is disabled while enrollment is closed.</p>
            )}
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
