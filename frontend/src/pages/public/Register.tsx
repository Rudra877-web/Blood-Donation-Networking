import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { post, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { BloodSelect, Input, Textarea } from '../../components/ui';

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const geo = useGeolocation();
  const [role, setRole] = useState<'DONOR' | 'RECEIVER' | 'HOSPITAL'>('DONOR');
  const [busy, setBusy] = useState(false);
  const { values, bind, set } = useForm<any>({ name: '', email: '', password: '', phone: '', bloodGroup: '', address: '', city: '', latitude: '', longitude: '', licenseNo: '', weightKg: '' });

  const detect = async () => {
    const c = await geo.locate();
    if (c) { set('latitude', c.latitude); set('longitude', c.longitude); toast.success('Location detected'); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const body: any = { role, name: values.name, email: values.email, password: values.password, phone: values.phone, address: values.address, city: values.city };
      if (role !== 'HOSPITAL') body.bloodGroup = values.bloodGroup;
      if (role === 'DONOR') { body.latitude = values.latitude; body.longitude = values.longitude; body.weightKg = values.weightKg; }
      if (role === 'HOSPITAL') { body.licenseNo = values.licenseNo; body.latitude = values.latitude; body.longitude = values.longitude; }
      const res = await post('/auth/register', body);
      toast.success(res._message || 'Registered');
      nav('/login');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-slate-500">Accounts are reviewed by an administrator before activation.</p>
        <div className="grid grid-cols-3 gap-2" role="tablist">
          {(['DONOR', 'RECEIVER', 'HOSPITAL'] as const).map((r) => (
            <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-lg border px-3 py-2 text-sm font-medium ${role === r ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}>{r[0] + r.slice(1).toLowerCase()}</button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={role === 'HOSPITAL' ? 'Hospital name' : 'Full name'} required {...bind('name')} />
          <Input label="Email" type="email" required {...bind('email')} />
          <Input label="Password" type="password" required minLength={8} hint="Min 8 chars, with a letter and a number" {...bind('password')} />
          <Input label="Phone" required pattern="[0-9+\-\s]{7,15}" title="7-15 digits" {...bind('phone')} />
          {role !== 'HOSPITAL' && <BloodSelect required {...bind('bloodGroup')} />}
          {role === 'HOSPITAL' && <Input label="Licence number" required {...bind('licenseNo')} />}
          <Input label="City" required {...bind('city')} />
          {role === 'DONOR' && <Input label="Weight (kg)" type="number" min={20} {...bind('weightKg')} />}
        </div>
        <Textarea label={role === 'HOSPITAL' ? 'Address / location' : 'Address'} required {...bind('address')} />
        {role !== 'RECEIVER' && (
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Location (used to find the nearest donors)</p>
              <button type="button" className="btn-outline btn-sm" onClick={detect} disabled={geo.loading}>{geo.loading ? 'Detecting...' : '📍 Use my location'}</button>
            </div>
            {geo.error && <p className="mt-2 text-xs text-amber-700">{geo.error}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Latitude" type="number" step="any" {...bind('latitude')} />
              <Input label="Longitude" type="number" step="any" {...bind('longitude')} />
            </div>
          </div>
        )}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Submitting...' : 'Register'}</button>
        <p className="text-center text-sm">Already registered? <Link to="/login" className="text-brand-700 hover:underline">Login</Link></p>
      </form>
    </div>
  );
}
