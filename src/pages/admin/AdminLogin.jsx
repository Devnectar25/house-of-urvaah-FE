import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { setAuthToken, setStoredUser, apiClient } from '../../lib/apiClient';
import { useCart } from '../../context/CartContext';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { loginUser } = useCart();

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({ username: '', password: '' });
  const [touched, setTouched] = useState({ username: false, password: false });
  const [serverError, setServerError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check query params or route state for redirect reasons (e.g. session expired, unauthorized role)
  useEffect(() => {
    const reason = searchParams.get('reason') || location.state?.reason;
    if (reason === 'expired') {
      setSessionNotice('Your session has expired, please sign in again');
    } else if (reason === 'unauthorized') {
      setSessionNotice("You don't have permission to access the admin panel");
    }
  }, [searchParams, location.state]);

  // Field-level validation rules
  const validateField = (name, value) => {
    if (name === 'username') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 'Username is required';
      }
      if (trimmed.length < 3) {
        return 'Username must be at least 3 characters';
      }
      return '';
    }

    if (name === 'password') {
      if (!value) {
        return 'Password is required';
      }
      if (value.length < 6) {
        return 'Password must be at least 6 characters';
      }
      return '';
    }

    return '';
  };

  // Blur validation: validates individual field as user tabs/clicks away
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, field === 'username' ? username : password);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Change validation: re-validates on keystroke once field has shown error
  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    if (serverError) setServerError('');

    if (touched.username || errors.username) {
      const err = validateField('username', val);
      setErrors((prev) => ({ ...prev, username: err }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (serverError) setServerError('');

    if (touched.password || errors.password) {
      const err = validateField('password', val);
      setErrors((prev) => ({ ...prev, password: err }));
    }
  };

  // Submit handling: validates all fields and blocks if invalid
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const usernameError = validateField('username', username);
    const passwordError = validateField('password', password);

    setTouched({ username: true, password: true });
    setErrors({ username: usernameError, password: passwordError });

    if (usernameError || passwordError) {
      // Focus first invalid field
      if (usernameError) {
        usernameRef.current?.focus();
      } else if (passwordError) {
        passwordRef.current?.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      let res;
      try {
        res = await apiClient('/api/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });
      } catch (adminErr) {
        // Distinguish wrong credentials (401/403) from network/server error (500, timeout, network failure)
        if (adminErr.status === 401 || adminErr.status === 403) {
          setServerError('Invalid username or password');
          return;
        } else if (adminErr.status === 404) {
          // Fallback to /api/auth/login if admin route is not mounted
          try {
            res = await apiClient('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify({
                email: username.trim(),
                password,
              }),
            });
          } catch (fallbackErr) {
            if (fallbackErr.status === 401 || fallbackErr.status === 403) {
              setServerError('Invalid username or password');
            } else {
              setServerError('Something went wrong. Please try again.');
            }
            return;
          }
        } else {
          setServerError('Something went wrong. Please try again.');
          return;
        }
      }

      const adminData = res?.admin || res?.user;
      const token = res?.token;
      const role = (adminData?.role || '').toLowerCase();
      const validRoles = ['admin', 'super_admin', 'subadmin', 'sub_admin'];

      if (!token || !adminData || !validRoles.includes(role)) {
        setServerError('Invalid username or password');
        return;
      }

      // Store JWT and admin profile using project's auth pattern
      setAuthToken(token);
      setStoredUser(adminData);

      if (typeof loginUser === 'function') {
        loginUser(adminData, token);
      }

      navigate('/admin/dashboard');
    } catch (err) {
      console.error('[AdminLogin Error]:', err);
      if (err.status === 401 || err.status === 403) {
        setServerError('Invalid username or password');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-allow-guest="true"
      className="min-h-screen w-full bg-brand-sand flex items-center justify-center p-4 sm:p-6 md:p-8 font-serif"
    >
      {/* Centered Admin Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-neutral-200/90 shadow-editorial p-8 sm:p-10 text-center">
        {/* 1. House of Urvaah Logo */}
        <div className="flex justify-center mb-6">
          <Logo className="h-12 sm:h-14" />
        </div>

        {/* 2. Bold Title */}
        <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-[0.1em] text-brand-dark uppercase mb-2">
          House of Urvaah Admin
        </h1>

        {/* 3. Muted Subtitle */}
        <p className="text-xs sm:text-sm text-brand-gray font-serif tracking-wider mb-8">
          Sign in to access the admin dashboard
        </p>

        {/* Session Expiry or Unauthorized Notice */}
        {sessionNotice && !serverError && (
          <div
            role="status"
            className="mb-6 p-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 text-xs rounded-lg text-left flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed font-sans">{sessionNotice}</span>
          </div>
        )}

        {/* Server/Auth Error Banner (with role="alert") */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 p-3.5 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-lg text-left flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed font-sans">{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left font-serif" noValidate>
          {/* Username Field */}
          <div>
            <label
              htmlFor="admin-username"
              className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block mb-2"
            >
              Username
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]"
                aria-hidden="true"
              />
              <input
                id="admin-username"
                ref={usernameRef}
                type="text"
                autoComplete="username"
                value={username}
                onChange={handleUsernameChange}
                onBlur={() => handleBlur('username')}
                placeholder="Enter admin username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                className={`w-full bg-brand-sand/40 border ${
                  errors.username
                    ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                    : 'border-neutral-300 focus:border-brand-dark'
                } rounded-lg pl-10 pr-4 py-3 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:bg-white transition-colors`}
              />
            </div>
            {errors.username && (
              <div
                id="username-error"
                className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-sans leading-tight"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.username}</span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="admin-password"
              className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]"
                aria-hidden="true"
              />
              <input
                id="admin-password"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                placeholder="Enter password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`w-full bg-brand-sand/40 border ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                    : 'border-neutral-300 focus:border-brand-dark'
                } rounded-lg pl-10 pr-10 py-3 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:bg-white transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <div
                id="password-error"
                className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-sans leading-tight"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Primary Full-Width Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-dark text-white hover:bg-black rounded-lg py-3.5 px-6 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
