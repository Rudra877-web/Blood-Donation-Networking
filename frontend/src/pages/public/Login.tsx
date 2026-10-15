import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../services/api';
import { ROLE_HOME } from '../../utils/constants';
import {
  Droplet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Heart,
  AlertCircle
} from 'lucide-react';
import { Spinner } from '../../components/ui';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation() as any;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      nav(
        loc.state?.from?.startsWith(ROLE_HOME[u.role])
          ? loc.state.from
          : ROLE_HOME[u.role],
        { replace: true }
      );
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800/90 bg-[#151822] shadow-2xl overflow-hidden grid lg:grid-cols-12">
        {/* Left Side: Brand Narrative */}
        <div className="hidden lg:flex lg:col-span-5 bg-[#0E111A] p-8 text-white flex-col justify-between relative overflow-hidden border-r border-slate-800">
          <div className="space-y-6 relative z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <Droplet className="h-5 w-5 fill-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Blood<span className="text-brand-500">Net</span>
              </span>
            </Link>

            <div className="space-y-3 pt-6">
              <span className="inline-block rounded-full bg-brand-950/70 px-3 py-1 text-xs font-semibold text-brand-400 border border-brand-900/60">
                Verified Portal Access
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
                Every drop counts. Every minute matters.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in to check live blood requests, coordinate emergency donor matches, or manage hospital inventory.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-slate-800 relative z-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Admin-verified user authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-brand-400 shrink-0" />
              <span>Connecting voluntary donors in real time</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-[#151822]">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Sign in to your account
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Enter your registered email and password to continue
              </p>
            </div>

            {error && (
              <div
                className="rounded-xl border border-red-900/60 bg-red-950/40 p-3.5 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

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
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">
                    Password <span className="text-brand-400">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-9 pr-10"
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
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn-primary w-full py-2.5 shadow-sm mt-2"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-white" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Sign in to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-400 hover:text-brand-300 hover:underline"
              >
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
