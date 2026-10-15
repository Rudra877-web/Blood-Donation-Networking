import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, put, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  BloodSelect,
  BloodTag,
  Empty,
  ErrorBox,
  Grid,
  Input,
  Loading,
  PageHeader,
  Pager,
  Stat,
  TableWrap,
  Textarea
} from '../../components/ui';
import { fmtDate, toInputDate } from '../../utils/format';
import {
  Heart,
  Droplet,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Scale,
  FileText
} from 'lucide-react';

export function DonorDashboard() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useFetch(() => get('/donors/dashboard'));

  if (loading) return <Loading text="Loading donor dashboard..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const toggle = async () => {
    try {
      const r = await put('/donors/availability', { availability: !data.availability });
      setData({ ...data, availability: r.availability });
      toast.success(
        r.availability ? 'You are now marked AVAILABLE for matching requests' : 'You are now marked UNAVAILABLE'
      );
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const s = data.stats;
  const el = data.eligibility;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Overview"
        subtitle="Manage your donation availability, review nearby requests, and track your life-saving impact."
      />

      {/* Hero Availability Card */}
      <div className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-slate-800 shadow-card">
        <div className="flex items-center gap-4">
          <BloodTag value={data.bloodGroup} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                {data.availability ? 'You are currently AVAILABLE' : 'You are currently UNAVAILABLE'}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  data.availability ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {data.availability
                ? 'Nearby hospitals and patients can dispatch emergency matching alerts to you.'
                : 'Emergency requests will not alert you while you are paused.'}
            </p>
          </div>
        </div>

        {/* Custom Toggle Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase text-slate-400">
            {data.availability ? 'Active' : 'Paused'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={data.availability}
            onClick={toggle}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[#0B0D13] ${
              data.availability ? 'bg-emerald-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                data.availability ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Clinical Eligibility Notice */}
      {!el.eligible ? (
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Currently not eligible to donate</p>
            <p className="text-amber-200/90">{el.reasons?.join('. ')}. To protect your health, you will not receive matching alerts until resolved.</p>
            {el.nextEligibleDate && (
              <p className="font-semibold text-amber-300">
                Next eligible donation date: {fmtDate(el.nextEligibleDate)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>
              <b className="text-emerald-300">Medically Eligible to Donate:</b> Your donation interval and weight criteria meet safety guidelines.
            </span>
          </div>
          <Link to="/donor/health" className="font-bold underline text-emerald-400 hover:text-emerald-300">
            View Health Details
          </Link>
        </div>
      )}

      {/* KPI Stats */}
      <Grid cols={4}>
        <Stat
          label="Alerts Received"
          value={s.myRequests}
          hint="Total requests matched"
          icon={Activity}
          tone="slate"
        />
        <Stat
          label="Pending Alerts"
          value={s.pendingAlerts}
          hint="Awaiting your response"
          icon={Clock}
          tone="amber"
        />
        <Stat
          label="Accepted Matches"
          value={s.acceptedRequests}
          hint="Requests you accepted"
          icon={CheckCircle2}
          tone="blue"
        />
        <Stat
          label="Completed Donations"
          value={s.completedDonations}
          hint="Verified by hospital"
          icon={Droplet}
          tone="green"
        />
      </Grid>

      {/* Pending Requests List */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">
              Requests Awaiting Your Response ({data.pendingAlerts.length})
            </h2>
            <p className="text-xs text-slate-400">
              Emergency requests near you that match your blood group
            </p>
          </div>
          <Link to="/donor/requests" className="text-xs font-bold text-brand-400 hover:underline">
            View All Requests →
          </Link>
        </div>

        {!data.pendingAlerts.length ? (
          <Empty
            title="No pending requests right now"
            hint="You're all caught up! You will receive a high-priority alert when a compatible emergency arises in your area."
          />
        ) : (
          <div className="divide-y divide-slate-800">
            {data.pendingAlerts.map((a: any) => (
              <div
                key={a.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-800/40 rounded-lg px-2 transition"
              >
                <div className="flex items-center gap-3">
                  <BloodTag value={a.request.bloodGroup} />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {a.request.units} Unit(s) Needed · {a.request.hospital?.user.name || a.request.city}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>City: {a.request.city}</span>
                      {a.distanceKm != null && (
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-400">
                          <MapPin className="h-3 w-3" />
                          {a.distanceKm} km away
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge value={a.request.urgency} />
                  <Link
                    to={`/donor/requests/${a.request.id}`}
                    className="btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <span>Respond</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DonorRequests() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/requests', { page, limit: 15 }), [page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Requests"
        subtitle="All emergency and standard requests you have been alerted about."
      />

      {loading ? (
        <Loading text="Loading your blood request history..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty title="No blood requests yet" hint="When a request matches your profile, it will appear here." />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Hospital & Location</th>
                <th>Distance</th>
                <th>Urgency</th>
                <th>Request Status</th>
                <th>Your Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-semibold text-xs text-slate-400">#{r.id}</td>
                  <td>
                    <BloodTag value={r.bloodGroup} />
                  </td>
                  <td className="font-semibold text-white">{r.units}</td>
                  <td>
                    <p className="font-medium text-white">{r.hospital?.user.name || 'Private Facility'}</p>
                    <p className="text-xs text-slate-400">{r.city}</p>
                  </td>
                  <td>
                    {r.myAlert?.distanceKm != null ? (
                      <span className="font-semibold text-brand-400">{r.myAlert.distanceKm} km</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td>
                    <Badge value={r.urgency} />
                  </td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td>
                    <Badge value={r.myAlert?.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      className="btn-primary btn-sm"
                      to={`/donor/requests/${r.id}`}
                    >
                      {r.myAlert?.status === 'NOTIFIED' ? 'Respond' : 'View Details'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}
    </div>
  );
}

export function DonorHistory() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/donations', { page, limit: 15 }), [page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation History"
        subtitle="Your lifetime contributions and hospital transfusion confirmations."
      />

      {loading ? (
        <Loading text="Loading donation history..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty
            title="No donations recorded yet"
            hint="Once you accept a blood request and complete donation at the hospital, your verified record will appear here."
          />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Request / Patient</th>
                <th>Hospital</th>
                <th>Units Donated</th>
                <th>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium text-white">{fmtDate(d.donationDate)}</td>
                  <td>
                    {d.request ? (
                      <div>
                        <p className="font-medium text-white">Request #{d.request.id}</p>
                        <p className="text-xs text-slate-400">Patient: {d.request.patientName}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Direct Blood Bank Donation</span>
                    )}
                  </td>
                  <td>{d.hospital?.user.name || 'Central Facility'}</td>
                  <td className="font-bold text-white">{d.units} unit(s)</td>
                  <td>
                    <Badge value={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}
    </div>
  );
}

/** One component, two routes: /donor/profile and /donor/health */
export function DonorProfile({ section }: { section: 'profile' | 'health' }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const geo = useGeolocation();
  const { data, loading, error, reload } = useFetch(() => get('/donors/me'));
  const { values, setValues, bind, set } = useForm<any>({});

  useEffect(() => {
    if (data) {
      setValues({
        name: data.name,
        phone: data.phone,
        bloodGroup: data.donor.bloodGroup,
        address: data.donor.address,
        city: data.donor.city,
        latitude: data.donor.latitude ?? '',
        longitude: data.donor.longitude ?? '',
        weightKg: data.donor.weightKg ?? '',
        medicalInfo: data.donor.medicalInfo ?? '',
        lastDonationDate: toInputDate(data.donor.lastDonationDate),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <Loading text="Loading donor profile..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const el = data.eligibility;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body =
        section === 'profile'
          ? {
              name: values.name,
              phone: values.phone,
              bloodGroup: values.bloodGroup,
              address: values.address,
              city: values.city,
              latitude: values.latitude,
              longitude: values.longitude,
            }
          : {
              weightKg: values.weightKg,
              medicalInfo: values.medicalInfo,
              lastDonationDate: values.lastDonationDate,
            };
      await put('/donors/profile', body);
      toast.success('Profile changes saved successfully');
      refresh();
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const detect = async () => {
    const c = await geo.locate();
    if (c) {
      set('latitude', c.latitude);
      set('longitude', c.longitude);
      toast.success('Coordinates updated from current GPS location');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={section === 'profile' ? 'My Donor Profile' : 'Health & Eligibility'}
        subtitle={
          section === 'profile'
            ? 'Manage your legal contact details, blood group, and residential coordinates.'
            : 'Clinical parameters used to verify your donation safety and match eligibility.'
        }
      />

      <form onSubmit={save} className="card p-6 sm:p-8 space-y-6">
        {section === 'profile' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Legal Name" required {...bind('name')} />
              <Input label="Email Address" value={data.email} disabled readOnly hint="Used for system login" />
              <Input label="Phone Number" required {...bind('phone')} />
              <BloodSelect required {...bind('bloodGroup')} />
              <Input label="City" required {...bind('city')} />
            </div>

            <Textarea label="Residential Address" required {...bind('address')} />

            {/* GPS coordinates container */}
            <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Location Coordinates
                  </p>
                  <p className="text-xs text-slate-400">
                    Accurate coordinates allow the network to alert you for nearby patients.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-outline btn-sm flex items-center gap-1.5"
                  onClick={detect}
                  disabled={geo.loading}
                >
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  <span>{geo.loading ? 'Detecting...' : 'Update from GPS'}</span>
                </button>
              </div>

              {geo.error && (
                <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded-lg p-2">
                  {geo.error}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Latitude" type="number" step="any" {...bind('latitude')} />
                <Input label="Longitude" type="number" step="any" {...bind('longitude')} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className={`rounded-xl p-4 text-xs space-y-1 ${
                el.eligible
                  ? 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-200'
                  : 'bg-amber-950/40 border border-amber-900/60 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {el.eligible ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300">Eligible for donation matching</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-300">Temporary eligibility hold</span>
                  </>
                )}
              </div>
              <p className="text-slate-300">
                {el.eligible
                  ? 'You are clear to donate based on your weight and last donation date.'
                  : `Reasons: ${el.reasons.join('. ')}`}
              </p>
              {el.nextEligibleDate && (
                <p className="font-semibold pt-1 text-slate-200">
                  Next eligible date: {fmtDate(el.nextEligibleDate)} (minimum 90-day interval)
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Body Weight (kg)"
                type="number"
                min={20}
                step="0.1"
                required
                hint="Minimum 50 kg required for donor safety"
                {...bind('weightKg')}
              />
              <Input
                label="Last Blood Donation Date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                hint="Leave empty if you have never donated before"
                {...bind('lastDonationDate')}
              />
            </div>

            <Textarea
              label="Medical Information & Allergies (Optional)"
              placeholder="e.g. Any recent medications, surgeries, travel history..."
              {...bind('medicalInfo')}
            />
          </>
        )}

        <button type="submit" className="btn-primary">
          Save Changes
        </button>
      </form>
    </div>
  );
}
