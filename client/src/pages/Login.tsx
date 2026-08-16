import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Terminal,
  Github,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BackgroundWaves } from '../components/common/BackgroundWaves';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    loginWithGitHub,
    loginWithGoogle,
    loginWithPassword,
    registerWithPassword,
    demoLogin,
  } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Read URL error params
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (tab === 'signup') {
      if (!name.trim()) {
        setError('Full Name is required.');
        return;
      }

      if (password.length < 8) {
        setError('Password must contain at least 8 characters.');
        return;
      }

      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[@$!%*?&#]/.test(password);

      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        setError('Password must include uppercase, lowercase, number, and special character (@$!%*?&#).');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      try {
        setLoadingAction('signup');
        await registerWithPassword(cleanEmail, password, name.trim(), confirmPassword);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            'Registration failed. Please check your credentials.'
        );
      } finally {
        setLoadingAction(null);
      }
    } else {
      try {
        setLoadingAction('signin');
        await loginWithPassword(cleanEmail, password);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            'Invalid email or password. Click "Create Account" above if you are a new user.'
        );
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleGoogleClick = () => {
    setLoadingAction('google');
    setError(null);
    loginWithGoogle();
  };

  const handleGitHubClick = () => {
    setLoadingAction('github');
    setError(null);
    loginWithGitHub();
  };

  const handleDemoClick = async () => {
    try {
      setLoadingAction('demo');
      setError(null);
      await demoLogin();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Demo login failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Robotic Cyber Oscilloscope Canvas */}
      <BackgroundWaves opacity={0.85} />

      {/* Main Glassmorphism Auth Card */}
      <div className="w-full max-w-md bg-[#0b142d]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 text-white mb-1">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Developer Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-xs mx-auto font-mono">
            Robotic Intelligence, Telemetry & Developer Workspace.
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              tab === 'signin'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              tab === 'signup'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-semibold">{error}</span>
            </div>
            {tab === 'signin' && (
              <p className="text-[11px] text-rose-300 pl-6">
                💡 Tip: Click <strong>"Create Account"</strong> above to register with your email.
              </p>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Direct Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alok Kumar"
                  disabled={loadingAction !== null}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:bg-white/10 focus:ring-1 focus:ring-emerald-400 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={loadingAction !== null}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:bg-white/10 focus:ring-1 focus:ring-emerald-400 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
              Password {tab === 'signup' && <span className="text-slate-400 font-normal">(min 8 chars, A-Z, 0-9, special)</span>}
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loadingAction !== null}
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:bg-white/10 focus:ring-1 focus:ring-emerald-400 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loadingAction !== null}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:bg-white/10 focus:ring-1 focus:ring-emerald-400 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {loadingAction === 'signin' ? (
              <span>Authenticating...</span>
            ) : loadingAction === 'signup' ? (
              <span>Creating developer account...</span>
            ) : (
              <>
                <span>{tab === 'signup' ? 'Create Developer Account' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Clean Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0b142d] px-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider relative">
            Or quick access
          </span>
        </div>

        {/* 1-Click Instant Demo Login */}
        <div>
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={loadingAction !== null}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 shadow-xs transition-all group disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>
              {loadingAction === 'demo' ? 'Entering workspace...' : '⚡ Instant 1-Click Demo Access'}
            </span>
          </button>
        </div>

        {/* Social OAuth Buttons: Google & GitHub */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleClick}
            type="button"
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold shadow-xs transition-all group disabled:opacity-50"
          >
            {loadingAction === 'google' ? (
              <span className="text-[11px] text-slate-400">Connecting...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                  />
                </svg>
                <span>Google</span>
              </>
            )}
          </button>

          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubClick}
            type="button"
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold shadow-xs transition-all group disabled:opacity-50"
          >
            {loadingAction === 'github' ? (
              <span className="text-[11px] text-slate-400">Connecting...</span>
            ) : (
              <>
                <Github className="w-3.5 h-3.5 text-white" />
                <span>GitHub</span>
              </>
            )}
          </button>
        </div>

        {/* Security Footer Notice */}
        <div className="text-center pt-2">
          <p className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by bcrypt-12, AES-256-GCM & Minimal JWT</span>
          </p>
        </div>
      </div>
    </div>
  );
};
