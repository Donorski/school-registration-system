import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/helpers';

const ROLE_REDIRECTS = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  registrar: '/registrar/dashboard',
};

export default function Login() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect when user state updates after login
  useEffect(() => {
    if (user) {
      navigate(ROLE_REDIRECTS[user.role] || '/login', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setLoginError('');
    try {
      const res = await login(data);
      const { access_token, role } = res.data;
      loginUser(access_token, { email: data.email, role });
      toast.success('Login successful');
    } catch (err) {
      const msg = getErrorMessage(err);
      setLoginError(msg);
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
          <h1 className="text-2xl font-bold text-gray-800">Database Technology College Registration System</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {loginError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <p>{loginError}</p>
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
                  {...register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              New student?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Create an Account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-white/70 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-600 mb-2">Demo Accounts:</p>
          <p>Admin: admin@school.com / Admin123!</p>
          <p>Registrar: registrar@school.com / Registrar123!</p>
          <p>Student: juan.delacruz@email.com / Student123!</p>
        </div>
      </div>
    </div>
  );
}
