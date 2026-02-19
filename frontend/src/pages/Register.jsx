import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerStudent } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/helpers';

const ROLE_REDIRECTS = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  registrar: '/registrar/dashboard',
};

export default function Register() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (user) {
      navigate(ROLE_REDIRECTS[user.role] || '/login', { replace: true });
    }
  }, [user, navigate]);

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
              {errors.password ? (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              ) : (
                <p className="text-gray-400 text-xs mt-1">Min. 8 characters with uppercase, lowercase, number & special character</p>
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
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
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
