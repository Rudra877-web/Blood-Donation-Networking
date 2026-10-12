import { FormEvent, useState } from 'react';
import { put, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Input, PageHeader } from '../../components/ui';

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error('New passwords do not match');
    try { await put('/auth/change-password', { currentPassword, newPassword }); toast.success('Password changed'); setCurrent(''); setNew(''); setConfirm(''); } catch (err) { toast.error(errMsg(err)); }
  };
  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" subtitle="Account security" />
      <div className="card mb-4 text-sm"><p><b>Name:</b> {user?.name}</p><p><b>Email:</b> {user?.email}</p><p><b>Role:</b> {user?.role}</p></div>
      <form onSubmit={submit} className="card space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <Input label="Current password" type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        <Input label="New password" type="password" required minLength={8} hint="Min 8 chars, with a letter and a number" value={newPassword} onChange={(e) => setNew(e.target.value)} />
        <Input label="Confirm new password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
