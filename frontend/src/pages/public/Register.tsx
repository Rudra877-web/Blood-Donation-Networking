import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { post, errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { BloodSelect, Input, Textarea, Spinner } from '../../components/ui';
import {
  Heart,
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const geo = useGeolocation();
  const [role, setRole] = useState<'DONOR' | 'RECEIVER' | 'HOSPITAL'>('DONOR');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { values, bind, set } = useForm<any>({
    name: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    licenseNo: '',
    weightKg: '',
  });

  const detect = async () => {
    const c = await geo.locate();
    if (c) {
      set('latitude', c.latitude);
      set('longitude', c.longitude);
      toast.success('GPS coordinates detected');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body: any = {
        role,
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        address: values.address,
        city: values.city,
      };
      if (role !== 'HOSPITAL') body.bloodGroup = values.bloodGroup;
      if (role === 'DONOR') {
        body.latitude = values.latitude;
        body.longitude = values.longitude;
        body.weightKg = values.weightKg;
      }
      if (role === 'HOSPITAL') {
        body.licenseNo = values.licenseNo;
        body.latitude = values.latitude;
        body.longitude = values.longitude;
      }
      const res = await post('/auth/register', body);
      toast.success(res._message || 'Registration submitted for review');
      nav('/login');
    } catch (err) {
      const msg = errMsg(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const roleConfigs = [
    {
      id: 'DONOR' as const,
      label: 'Voluntary Donor',
      icon: Heart,
      desc: 'Donate blood and receive emergency proximity requests.',
    },
    {
      id: 'RECEIVER' as const,
      label: 'Patient / Receiver',
      icon: Users,
      desc: 'Post blood requests and find compatible donors.',
    },
    {
      id: 'HOSPITAL' as const,
      label: 'Hospital / Blood Bank',
      icon: Building2,
      desc: 'Manage medical transfusions and local blood reserves.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          Join the Life-Saving Network
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Create Your Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Every registration is reviewed by a network administrator to ensure medical compliance and community trust.
        </p>
      </div>

      <div className="card p-6 sm:p-8 space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="label mb-2">Select Your Role</label>
          <div className="grid gap-3 sm:grid-cols-3" role="tablist">
            {roleConfigs.map((cfg) => {
              const Icon = cfg.icon;
              const active = role === cfg.id;
              return (
                <button
                  type="button"
                  key={cfg.id}
                  onClick={() => setRole(cfg.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition ${
                    active
                      ? 'border-brand-500 bg-brand-950/60 ring-2 ring-brand-500/20 text-white'
                      : 'border-slate-850 bg-[#0E111A] hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg mb-2.5 ${
                      active
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      active ? 'text-white' : 'text-slate-200'
                    }`}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {cfg.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={role === 'HOSPITAL' ? 'Hospital / Institution Name' : 'Full Legal Name'}
              required
              placeholder={role === 'HOSPITAL' ? 'e.g. City General Hospital' : 'e.g. Sarah Jenkins'}
              {...bind('name')}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="name@example.com"
              {...bind('email')}
            />

            <div>
              <label className="label">
                Password <span className="text-brand-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Min 8 chars, letter & number"
                  className="input pr-10"
                  {...bind('password')}
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
              <p className="mt-1 text-xs text-slate-500">
                At least 8 characters with a letter and number
              </p>
            </div>

            <Input
              label="Phone Number"
              required
              pattern="[0-9+\-\s]{7,15}"
              placeholder="e.g. +1 555 123 4567"
              hint="Format: 7-15 digits"
              {...bind('phone')}
            />

            {role !== 'HOSPITAL' && (
              <BloodSelect required {...bind('bloodGroup')} />
            )}

            {role === 'HOSPITAL' && (
              <Input
                label="Healthcare License Number"
                required
                placeholder="e.g. MED-LIC-2024-987"
                hint="Verified during admin approval"
                {...bind('licenseNo')}
              />
            )}

            <Input
              label="City"
              required
              placeholder="e.g. Chicago"
              {...bind('city')}
            />

            {role === 'DONOR' && (
              <Input
                label="Weight (kg)"
                type="number"
                min={20}
                required
                placeholder="e.g. 68"
                hint="Required to verify clinical donation safety (min 50 kg)"
                {...bind('weightKg')}
              />
            )}
          </div>

          <Textarea
            label={role === 'HOSPITAL' ? 'Hospital Address & Department' : 'Residential Address'}
            required
            placeholder="Street address, building, suite..."
            {...bind('address')}
          />

          {/* GPS Coordinates Section */}
          {role !== 'RECEIVER' && (
            <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Location Coordinates (GPS)
                  </p>
                  <p className="text-xs text-slate-400">
                    Used by the algorithm to calculate nearest-donor emergency alerts.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-outline btn-sm flex items-center gap-1.5"
                  onClick={detect}
                  disabled={geo.loading}
                >
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  <span>{geo.loading ? 'Detecting GPS...' : 'Autofill My Location'}</span>
                </button>
              </div>

              {geo.error && (
                <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded-lg p-2">
                  {geo.error}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Latitude (optional)"
                  type="number"
                  step="any"
                  placeholder="e.g. 41.8781"
                  {...bind('latitude')}
                />
                <Input
                  label="Longitude (optional)"
                  type="number"
                  step="any"
                  placeholder="e.g. -87.6298"
                  {...bind('longitude')}
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-800 bg-[#0E111A]/80 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              By registering, you agree that your details will be verified by a network administrator. Contact details are never shared publicly.
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 shadow-lg text-base"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-white" />
                <span>Creating your account...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Submit Registration for Review</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 hover:underline">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
