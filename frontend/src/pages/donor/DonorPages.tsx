import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, put, post, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, BloodSelect, BloodTag, Empty, ErrorBox, Grid, Input, Loading, PageHeader, Pager, Stat, TableWrap, Textarea } from '../../components/ui';
import { fmtDate, toInputDate } from '../../utils/format';

export function DonorDashboard() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useFetch(() => get('/donors/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const toggle = async () => {
    try { const r = await put('/donors/availability', { availability: !data.availability }); setData({ ...data, availability: r.availability }); toast.success(r.availability ? 'You are now AVAILABLE' : 'You are now UNAVAILABLE'); } catch (e) { toast.error(errMsg(e)); }
  };
  const s = data.stats;
  return (
    <div className="space-y-6">
      <PageHeader title="Donor Dashboard" />
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><BloodTag value={data.bloodGroup} />
          <div><p className="font-semibold">{data.availability ? 'You are AVAILABLE' : 'You are UNAVAILABLE'}</p><p className="text-sm text-slate-500">{data.availability ? 'You will receive matching blood requests.' : 'You will not receive matching requests.'}</p></div></div>
        <button role="switch" aria-checked={data.availability} onClick={toggle} className={`relative h-8 w-14 rounded-full transition ${data.availability ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${data.availability ? 'left-7' : 'left-1'}`} /></button>
      </div>
      {!data.eligibility.eligible && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">⚠️ You are currently not eligible to donate: {data.eligibility.reasons.join('. ')}. You will not be matched until then.</div>}
      <Grid>
        <Stat label="My requests (alerts)" value={s.myRequests} /><Stat label="Pending alerts" value={s.pendingAlerts} tone="amber" /><Stat label="Accepted requests" value={s.acceptedRequests} tone="blue" /><Stat label="Completed donations" value={s.completedDonations} tone="green" />
      </Grid>
      <div className="card">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Requests awaiting your response</h2><Link to="/donor/requests" className="text-sm text-brand-700 hover:underline">View all</Link></div>
        {!data.pendingAlerts.length ? <Empty title="No pending requests" hint="You'll be notified when a compatible request is created near you." /> : data.pendingAlerts.map((a: any) => (
          <Link key={a.id} to={`/donor/requests/${a.request.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 text-sm last:border-0 hover:bg-slate-50">
            <span className="flex items-center gap-2"><BloodTag value={a.request.bloodGroup} /><span>{a.request.units} unit(s) · {a.request.hospital?.user.name || a.request.city}</span></span>
            <span className="flex items-center gap-2"><span className="text-slate-500">{a.distanceKm != null ? `${a.distanceKm} km` : ''}</span><Badge value={a.request.urgency} /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DonorRequests() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/requests', { page, limit: 15 }), [page]);
  return (
    <div>
      <PageHeader title="Blood Requests" subtitle="Requests you have been alerted about" />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No requests yet" /></div> : (
        <TableWrap><table className="table"><thead><tr><th>#</th><th>Blood</th><th>Units</th><th>Hospital / City</th><th>Distance</th><th>Urgency</th><th>Request</th><th>My response</th><th /></tr></thead><tbody>
          {data.items.map((r: any) => <tr key={r.id}><td>{r.id}</td><td><BloodTag value={r.bloodGroup} /></td><td>{r.units}</td><td>{r.hospital?.user.name || '-'} <span className="text-slate-400">· {r.city}</span></td><td>{r.myAlert?.distanceKm != null ? `${r.myAlert.distanceKm} km` : '-'}</td><td><Badge value={r.urgency} /></td><td><Badge value={r.status} /></td><td><Badge value={r.myAlert?.status} /></td><td><Link className="btn-primary btn-sm" to={`/donor/requests/${r.id}`}>{r.myAlert?.status === 'NOTIFIED' ? 'Respond' : 'View'}</Link></td></tr>)}
        </tbody></table><Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} /></TableWrap>
      )}
    </div>
  );
}

export function DonorHistory() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/donations', { page, limit: 15 }), [page]);
  return (
    <div>
      <PageHeader title="Donation History" />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No donations yet" hint="Accept a request to start saving lives." /></div> : (
        <TableWrap><table className="table"><thead><tr><th>Date</th><th>Blood request</th><th>Hospital</th><th>Units</th><th>Status</th></tr></thead><tbody>
          {data.items.map((d: any) => <tr key={d.id}><td>{fmtDate(d.donationDate)}</td><td>{d.request ? `#${d.request.id} · ${d.request.patientName}` : 'Direct donation'}</td><td>{d.hospital?.user.name || '-'}</td><td>{d.units}</td><td><Badge value={d.status} /></td></tr>)}
        </tbody></table><Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} /></TableWrap>
      )}
    </div>
  );
}

/** One component, two routes: /donor/profile (personal + location) and /donor/health (health information). */
export function DonorProfile({ section }: { section: 'profile' | 'health' }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const geo = useGeolocation();
  const { data, loading, error, reload } = useFetch(() => get('/donors/me'));
  const { values, setValues, bind, set } = useForm<any>({});
  useEffect(() => {
    if (data) setValues({ name: data.name, phone: data.phone, bloodGroup: data.donor.bloodGroup, address: data.donor.address, city: data.donor.city, latitude: data.donor.latitude ?? '', longitude: data.donor.longitude ?? '', weightKg: data.donor.weightKg ?? '', medicalInfo: data.donor.medicalInfo ?? '', lastDonationDate: toInputDate(data.donor.lastDonationDate) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const el = data.eligibility;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const body = section === 'profile'
        ? { name: values.name, phone: values.phone, bloodGroup: values.bloodGroup, address: values.address, city: values.city, latitude: values.latitude, longitude: values.longitude }
        : { weightKg: values.weightKg, medicalInfo: values.medicalInfo, lastDonationDate: values.lastDonationDate };
      await put('/donors/profile', body); toast.success('Saved'); refresh(); reload();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const detect = async () => { const c = await geo.locate(); if (c) { set('latitude', c.latitude); set('longitude', c.longitude); toast.success('Location detected - remember to save'); } };

  return (
    <div className="max-w-3xl">
      <PageHeader title={section === 'profile' ? 'My Profile' : 'Health Information'} subtitle={section === 'profile' ? 'Contact, blood group and location' : 'Used to judge your eligibility to donate'} />
      <form onSubmit={save} className="card space-y-4">
        {section === 'profile' ? (<>
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Full name" required {...bind('name')} /><Input label="Email" value={data.email} disabled readOnly /><Input label="Phone" required {...bind('phone')} /><BloodSelect required {...bind('bloodGroup')} /><Input label="City" required {...bind('city')} /></div>
          <Textarea label="Address" required {...bind('address')} />
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">Location</p><button type="button" className="btn-outline btn-sm" onClick={detect} disabled={geo.loading}>{geo.loading ? 'Detecting...' : '📍 Update from my location'}</button></div>
            {geo.error && <p className="mt-2 text-xs text-amber-700">{geo.error}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label="Latitude" type="number" step="any" {...bind('latitude')} /><Input label="Longitude" type="number" step="any" {...bind('longitude')} /></div>
          </div>
        </>) : (<>
          <div className={`rounded-lg p-4 text-sm ${el.eligible ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {el.eligible ? '✅ You are eligible to donate.' : `⚠️ Not currently eligible: ${el.reasons.join('. ')}.`}
            {el.nextEligibleDate && <span className="block">Next eligible date: {fmtDate(el.nextEligibleDate)}</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Weight (kg)" type="number" min={20} step="0.1" {...bind('weightKg')} /><Input label="Last donation date" type="date" max={new Date().toISOString().slice(0, 10)} {...bind('lastDonationDate')} /></div>
          <Textarea label="Medical information" placeholder="Conditions, medication, allergies..." {...bind('medicalInfo')} />
        </>)}
        <button className="btn-primary">Save changes</button>
      </form>
    </div>
  );
}
