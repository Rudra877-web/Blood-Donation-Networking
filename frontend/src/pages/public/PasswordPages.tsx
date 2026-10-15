import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { post, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Input, Spinner } from '../../components/ui';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

export function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Password reset link sent');
    } catch (err) {
      const msg = errMsg(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="card w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-950/60 text-brand-400 border border-brand-900/60 mx-auto">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Forgot Your Password?
          </h1>
          <p className="text-xs text-slate-400">
            Enter your registered email and we'll send you instructions to reset it.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {sent ? (
          <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-300">Check Your Email</h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              If that email is registered in BloodNet, a password reset link has been dispatched.
              (In development mode without SMTP, the reset link is printed to the backend console).
            </p>
            <div className="pt-2">
              <Link to="/login" className="btn-outline btn-sm w-full">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">
                Email Address <span className="text-brand-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-2.5 shadow-sm"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4 text-white" />
                  <span>Sending link...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Send Reset Link</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return toast.error('Passwords do not match');
    }
    setBusy(true);
    setError('');
    try {
      await post('/auth/reset-password', {
        token: params.get('token'),
        password,
      });
      toast.success('Password updated successfully. Please log in.');
      nav('/login');
    } catch (err) {
      const msg = errMsg(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="card w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-950/60 text-brand-400 border border-brand-900/60 mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-400">
            Choose a strong, secure password for your BloodNet account.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">
              New Password <span className="text-brand-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Must include a letter and a number</p>
          </div>

          <div>
            <label className="label">
              Confirm New Password <span className="text-brand-400">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Re-enter password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-2.5 shadow-sm"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-white" />
                <span>Updating password...</span>
              </span>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
