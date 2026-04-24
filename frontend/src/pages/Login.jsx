import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, AlertCircle, MonitorSmartphone } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { login, googleAuth } from '../services/api';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeSessionData, setActiveSessionData] = useState(null); // holds credentials when 409
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redirect when user state updates after login
  useEffect(() => {
    if (user) {
      navigate(ROLE_REDIRECTS[user.role] || '/login', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (response) => {
    setGoogleLoading(true);
    setLoginError('');
    try {
      const res = await googleAuth(response.credential);
      const { access_token, role } = res.data;
      loginUser(access_token, { role });
      toast.success('Signed in with Google');
    } catch (err) {
      setLoginError(getErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setLoginError('');
    setActiveSessionData(null);
    try {
      const res = await login(data);
      const { access_token, role } = res.data;
      loginUser(access_token, { email: data.email, role });
      toast.success('Login successful');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.detail === 'active_session') {
        setActiveSessionData(data);
      } else {
        setLoginError(getErrorMessage(err));
      }
      setSubmitting(false);
    }
  };

  const handleForceLogin = async () => {
    if (!activeSessionData) return;
    setSubmitting(true);
    setActiveSessionData(null);
    try {
      const res = await login({ ...activeSessionData, force: true });
      const { access_token, role } = res.data;
      loginUser(access_token, { email: activeSessionData.email, role });
      toast.success('Login successful');
    } catch (err) {
      setLoginError(getErrorMessage(err));
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

            {activeSessionData && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                  <MonitorSmartphone size={16} className="shrink-0" />
                  <span>Account is active on another device</span>
                </div>
                <p className="text-amber-700 mb-3">
                  This account is currently logged in on another device. Logging in here will end that session.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleForceLogin}
                    disabled={submitting}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                    Login Anyway
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSessionData(null)}
                    className="flex-1 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 text-sm font-medium py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
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

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 uppercase">
              <span className="bg-white px-3">or</span>
            </div>
          </div>

          <div className="flex justify-center">
            {googleLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Signing in...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setLoginError('Google sign-in failed. Please try again.')}
                width="368"
                text="signin_with"
                shape="rectangular"
                theme="outline"
              />
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              New student?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Create an Account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
