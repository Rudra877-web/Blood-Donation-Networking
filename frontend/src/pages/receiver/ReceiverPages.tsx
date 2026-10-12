import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post, put, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, BloodSelect, BloodTag, Empty, ErrorBox, Grid, Input, Loading, OptionList, PageHeader, Pager, Select, Stat, TableWrap, Textarea } from '../../components/ui';
import { URGENCIES, REQUEST_STATUSES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';

export function ReceiverDashboard() {
  const { data, loading, error, reload } = useFetch(() => get('/receivers/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.stats;
  return (
    <div className="space-y-6">
      <PageHeader title="Receiver Dashboard" actions={<Link to="/receiver/create-request" className="btn-primary">+ New blood request</Link>} />
      <Grid><Stat label="Active requests" value={s.activeRequests} /><Stat label="Matched donors" value={s.matchedDonors} tone="blue" /><Stat label="Completed" value={s.completedRequests} tone="green" /><Stat label="Total requests" value={s.totalRequests} tone="slate" /></Grid>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card"><h2 className="mb-3 font-semibold">Request status</h2>{!data.statusBreakdown.length ? <p className="text-sm text-slate-500">No requests yet.</p> : data.statusBreakdown.map((b: any) => <div key={b.status} className="flex items-center justify-between py-1.5"><Badge value={b.status} /><span className="font-semibold">{b.count}</span></div>)}</div>
        <div className="card lg:col-span-2"><h2 className="mb-3 font-semibold">Recent requests</h2>
          {!data.recentRequests.length ? <Empty title="No requests yet" hint="Create a request to find donors." /> : data.recentRequests.map((r: any) => (
            <Link key={r.id} to={`/receiver/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 text-sm last:border-0 hover:bg-slate-50"><span className="flex items-center gap-2"><BloodTag value={r.bloodGroup} />{r.patientName}<span className="text-slate-400">· {r._count.alerts} donor(s) alerted</span></span><span className="flex gap-2"><Badge value={r.urgency} /><Badge value={r.status} /></span></Link>))}
        </div>
      </div>
    </div>
  );
}

export function ReceiverSearch() {
  const toast = useToast();
  const geo = useGeolocation();
  const [f, setF] = useState({ bloodGroup: '', city: '', radius: '' });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const search = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { setResults(await get('/donors/search', { ...f, lat: coords?.latitude, lng: coords?.longitude })); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  const locate = async () => { const c = await geo.locate(); if (c) { setCoords(c); toast.success('Using your current location'); } };
  return (
    <div>
      <PageHeader title="Search Blood" subtitle="Find available, eligible donors compatible with the blood group you need" />
      <form onSubmit={search} className="card mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BloodSelect label="Blood group needed" required value={f.bloodGroup} onChange={(e) => setF({ ...f, bloodGroup: e.target.value })} />
        <Input label="City" placeholder="e.g. Ahmedabad" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} disabled={!!coords} hint={coords ? 'Using GPS location' : undefined} />
        <Select label="Max distance" value={f.radius} onChange={(e) => setF({ ...f, radius: e.target.value })} disabled={!coords}><option value="">Any</option><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option></Select>
        <div className="flex items-end gap-2"><button className="btn-primary flex-1" disabled={busy}>{busy ? 'Searching...' : 'Search'}</button><button type="button" className="btn-outline" onClick={coords ? () => setCoords(null) : locate} title="Use my location">{coords ? '✕ GPS' : '📍'}</button></div>
        {geo.error && <p className="text-xs text-amber-700 sm:col-span-2 lg:col-span-4">{geo.error}</p>}
      </form>
      {results && (results.length === 0 ? <div className="card"><Empty title="No donors found" hint="Try a wider area, or create a request - the system will keep expanding its search automatically." /></div> : (
        <TableWrap><table className="table"><thead><tr><th>Donor</th><th>Blood group</th><th>City</th><th>Distance</th><th>Availability</th><th>Contact</th></tr></thead><tbody>
          {results.map((d) => <tr key={d.id}><td className="font-medium">{d.name}</td><td><BloodTag value={d.bloodGroup} /> {!d.exactMatch && <span className="ml-1 text-xs text-slate-400">compatible</span>}</td><td>{d.city}</td><td>{d.distanceKm != null ? `${d.distanceKm} km` : '-'}</td><td><Badge value="AVAILABLE" /></td><td>{d.phone || <span className="text-xs text-slate-400">Shared after the donor accepts your request</span>}</td></tr>)}
        </tbody></table></TableWrap>))}
      <div className="mt-4"><Link to="/receiver/create-request" className="btn-outline">Can't find a donor? Create a blood request</Link></div>
    </div>
  );
}

export function ReceiverCreateRequest() {
  const nav = useNavigate();
  const toast = useToast();
  const geo = useGeolocation();
  const hospitals = useFetch(() => get('/hospitals'));
  const { values, bind, set } = useForm<any>({ patientName: '', bloodGroup: '', units: 1, hospitalId: '', city: '', address: '', latitude: '', longitude: '', urgency: 'NORMAL', requiredDate: new Date().toISOString().slice(0, 10), notes: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickHospital = (id: string) => {
    set('hospitalId', id);
    const h = (hospitals.data || []).find((x: any) => String(x.id) === id);
    if (h) { set('city', h.city); set('address', h.address); }
  };
  const detect = async () => { const c = await geo.locate(); if (c) { set('latitude', c.latitude); set('longitude', c.longitude); toast.success('Location detected'); } };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const r = await post('/requests', values); setResult(r); toast.success(`Request created - ${r.donorsNotified} donor(s) notified`); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (result) {
    const alt = result.inventoryAlternatives;
    return (
      <div className="max-w-2xl space-y-4">
        <PageHeader title="Request created" />
        <div className="card space-y-2"><p>✅ Request <b>#{result.request.id}</b> was created.</p><p>🔔 <b>{result.donorsNotified}</b> nearby eligible donor(s) were alerted within {result.request.searchRadiusKm} km.{result.donorsNotified === 0 && ' No donors were found yet - the search radius will widen automatically.'}</p>
          <p>🩸 Blood bank stock: <b>{alt.totalUnits}</b> compatible unit(s) available{alt.sufficient ? ' - enough to cover this request.' : '.'}</p></div>
        <div className="flex gap-2"><button className="btn-primary" onClick={() => nav(`/receiver/requests/${result.request.id}`)}>Track request</button><button className="btn-outline" onClick={() => nav('/receiver')}>Dashboard</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Create Blood Request" subtitle="Compatible, available donors near the hospital are alerted automatically" />
      <form onSubmit={submit} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Patient name" required {...bind('patientName')} />
          <BloodSelect label="Blood group required" required {...bind('bloodGroup')} />
          <Input label="Units required" type="number" min={1} max={20} required {...bind('units')} />
          <Select label="Urgency" required {...bind('urgency')}><OptionList values={URGENCIES} /></Select>
          <Select label="Hospital" value={values.hospitalId} onChange={(e) => pickHospital(e.target.value)}><option value="">Other / not listed</option>{(hospitals.data || []).map((h: any) => <option key={h.id} value={h.id}>{h.user.name} - {h.city}</option>)}</Select>
          <Input label="Required date" type="date" required min={new Date().toISOString().slice(0, 10)} {...bind('requiredDate')} />
          <Input label="City" required {...bind('city')} />
          <Input label="Location / address" {...bind('address')} />
        </div>
        {!values.hospitalId && (
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">Exact location (no hospital selected)</p><button type="button" className="btn-outline btn-sm" onClick={detect} disabled={geo.loading}>{geo.loading ? 'Detecting...' : '📍 Use my location'}</button></div>
            {geo.error && <p className="mt-2 text-xs text-amber-700">{geo.error}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label="Latitude" type="number" step="any" {...bind('latitude')} /><Input label="Longitude" type="number" step="any" {...bind('longitude')} /></div>
          </div>
        )}
        <Textarea label="Additional information" {...bind('notes')} />
        <button className="btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create request & find donors'}</button>
      </form>
    </div>
  );
}

export function ReceiverMyRequests() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/requests', { status, page, limit: 15 }), [status, page]);
  return (
    <div>
      <PageHeader title="My Requests" actions={<Link to="/receiver/create-request" className="btn-primary">+ New request</Link>} />
      <div className="card mb-4 max-w-xs"><select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><OptionList values={REQUEST_STATUSES} placeholder="All statuses" /></select></div>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No requests" /></div> : (
        <TableWrap><table className="table"><thead><tr><th>#</th><th>Patient</th><th>Blood</th><th>Units</th><th>Hospital</th><th>Urgency</th><th>Status</th><th>Donors</th><th>Required</th><th /></tr></thead><tbody>
          {data.items.map((r: any) => <tr key={r.id}><td>{r.id}</td><td className="font-medium">{r.patientName}</td><td><BloodTag value={r.bloodGroup} /></td><td>{r.units}</td><td>{r.hospital?.user.name || '-'}</td><td><Badge value={r.urgency} /></td><td><Badge value={r.status} /></td><td>{r._count.alerts}</td><td>{fmtDate(r.requiredDate)}</td><td><Link className="btn-outline btn-sm" to={`/receiver/requests/${r.id}`}>Track</Link></td></tr>)}
        </tbody></table><Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} /></TableWrap>
      )}
    </div>
  );
}

/** Pick one request and see which donors were alerted / accepted, ordered by distance. */
export function ReceiverMatching() {
  const toast = useToast();
  const reqs = useFetch(() => get('/requests', { limit: 50 }));
  const [id, setId] = useState('');
  const detail = useFetch(() => (id ? get('/requests/' + id) : Promise.resolve(null)), [id]);
  useEffect(() => { if (!id && reqs.data?.items?.length) setId(String(reqs.data.items[0].id)); }, [reqs.data, id]);
  const expand = async () => { try { const r = await post(`/requests/${id}/expand`); toast.success(r._message || 'Expanded'); detail.reload(); } catch (e) { toast.error(errMsg(e)); } };
  const r = detail.data;
  return (
    <div className="space-y-4">
      <PageHeader title="Matching Donors" subtitle="Donors alerted for your request, nearest first" />
      {reqs.loading ? <Loading /> : !reqs.data?.items.length ? <div className="card"><Empty title="No requests yet" hint="Create a request to see matching donors." /></div> : (<>
        <div className="card max-w-md"><Select label="Request" value={id} onChange={(e) => setId(e.target.value)}>{reqs.data.items.map((x: any) => <option key={x.id} value={x.id}>#{x.id} · {x.patientName} ({x.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}) - {x.status}</option>)}</Select></div>
        {detail.loading ? <Loading /> : r && (
          <div className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><BloodTag value={r.bloodGroup} /><Badge value={r.status} /><span className="text-sm text-slate-500">Search radius: {r.searchRadiusKm} km</span></div>
              <div className="flex gap-2"><button className="btn-outline btn-sm" onClick={expand} disabled={['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)}>Expand search</button><Link to={`/receiver/requests/${r.id}`} className="btn-outline btn-sm">Details</Link></div></div>
            {!r.alerts.length ? <Empty title="No donors alerted yet" hint="Try expanding the search radius." /> : <div className="overflow-x-auto"><table className="table"><thead><tr><th>Donor</th><th>Blood</th><th>City</th><th>Distance</th><th>Status</th><th>Contact</th></tr></thead><tbody>
              {r.alerts.map((a: any) => <tr key={a.id}><td className="font-medium">{a.donor.user.name}</td><td><BloodTag value={a.donor.bloodGroup} /></td><td>{a.donor.city}</td><td>{a.distanceKm != null ? `${a.distanceKm} km` : '-'}</td><td><Badge value={a.status} /></td><td>{a.donor.user.phone ?? <span className="text-xs text-slate-400">After acceptance</span>}</td></tr>)}
            </tbody></table></div>}
            {r.inventoryAlternatives && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">🩸 Blood bank alternative: <b>{r.inventoryAlternatives.totalUnits}</b> compatible unit(s) in stock.</p>}
          </div>
        )}
      </>)}
    </div>
  );
}

export function ReceiverProfile() {
  const toast = useToast();
  const { refresh } = useAuth();
  const { data, loading, error, reload } = useFetch(() => get('/receivers/me'));
  const { values, setValues, bind } = useForm<any>({});
  useEffect(() => { if (data) setValues({ name: data.name, phone: data.phone, bloodGroup: data.receiver.bloodGroup, address: data.receiver.address, city: data.receiver.city }); /* eslint-disable-next-line */ }, [data]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const save = async (e: FormEvent) => { e.preventDefault(); try { await put('/receivers/profile', values); toast.success('Profile updated'); refresh(); } catch (err) { toast.error(errMsg(err)); } };
  return (
    <div className="max-w-3xl"><PageHeader title="My Profile" />
      <form onSubmit={save} className="card space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Input label="Name" required {...bind('name')} /><Input label="Email" value={data.email} disabled readOnly /><Input label="Phone" required {...bind('phone')} /><BloodSelect required {...bind('bloodGroup')} /><Input label="City" required {...bind('city')} /></div><Textarea label="Address" required {...bind('address')} /><button className="btn-primary">Save changes</button></form>
    </div>
  );
}
