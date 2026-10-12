import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errMsg } from '../../services/api';
import { Input } from '../../components/ui';
import { ROLE_HOME } from '../../utils/constants';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      nav(loc.state?.from?.startsWith(ROLE_HOME[u.role]) ? loc.state.from : ROLE_HOME[u.role], { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex max-w-md px-4 py-16">
      <form onSubmit={submit} className="card w-full space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Login'}</button>
        <div className="flex justify-between text-sm"><Link to="/forgot-password" className="text-brand-700 hover:underline">Forgot password?</Link><Link to="/register" className="text-brand-700 hover:underline">Create account</Link></div>
      </form>
    </div>
  );
}
