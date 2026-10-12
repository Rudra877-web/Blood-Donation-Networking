import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { post, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui';

export function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await post('/auth/forgot-password', { email }); setSent(true); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        {sent ? <p className="text-sm text-slate-600">If that email is registered, a reset link has been sent. Check your inbox (in development without SMTP, the link is printed in the backend console).</p> : (<>
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
        </>)}
        <Link to="/login" className="block text-center text-sm text-brand-700 hover:underline">Back to login</Link>
      </form>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    try { await post('/auth/reset-password', { token: params.get('token'), password }); toast.success('Password updated. Please log in.'); nav('/login'); } catch (err) { toast.error(errMsg(err)); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <Input label="New password" type="password" required minLength={8} hint="At least 8 characters with a letter and a number" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label="Confirm password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="btn-primary w-full">Update password</button>
      </form>
    </div>
  );
}
