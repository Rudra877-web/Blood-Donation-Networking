import { FormEvent, useState } from 'react';
import { put, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Input, PageHeader, Badge, Spinner } from '../../components/ui';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      return toast.error('New passwords do not match');
    }
    setBusy(true);
    try {
      await put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Account password updated successfully');
      setCurrent('');
      setNew('');
      setConfirm('');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Account & Security Settings"
        subtitle="Manage your authentication credentials and account security preferences."
      />

      {/* Account Info Card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-950/60 text-brand-400 border border-brand-800/60 font-extrabold text-sm">
            {user?.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg bg-[#0E111A] p-3 border border-slate-800">
            <span className="text-slate-400 block">Assigned Role</span>
            <span className="font-bold text-white text-sm mt-0.5 block">{user?.role}</span>
          </div>
          <div className="rounded-lg bg-[#0E111A] p-3 border border-slate-800">
            <span className="text-slate-400 block">Account Status</span>
            <div className="mt-1">
              <Badge value={user?.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <form onSubmit={submit} className="card p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <KeyRound className="h-5 w-5 text-brand-400" />
          <div>
            <h3 className="text-base font-bold text-white">Change Password</h3>
            <p className="text-xs text-slate-400">Update your account login password</p>
          </div>
        </div>

        <div>
          <label className="label">
            Current Password <span className="text-brand-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              placeholder="Enter existing password"
              className="input pr-10"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">
            New Password <span className="text-brand-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="input pr-10"
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">Must contain at least 8 characters with a letter and a number</p>
        </div>

        <div>
          <label className="label">
            Confirm New Password <span className="text-brand-400">*</span>
          </label>
          <input
            type={showNew ? 'text' : 'password'}
            required
            placeholder="Re-enter new password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
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
    </div>
  );
}
