import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post, put, errMsg } from '../../services/api';
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
  OptionList,
  PageHeader,
  Pager,
  Select,
  Stat,
  TableWrap,
  Textarea,
  Spinner
} from '../../components/ui';
import { URGENCIES, REQUEST_STATUSES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';
import {
  PlusCircle,
  Search,
  Activity,
  Users,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  Clock,
  Building2,
  ArrowRight,
  Maximize2,
  Phone,
  ShieldCheck,
  Heart
} from 'lucide-react';

export function ReceiverDashboard() {
  const { data, loading, error, reload } = useFetch(() => get('/receivers/dashboard'));

  if (loading) return <Loading text="Loading receiver dashboard..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const s = data.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receiver Dashboard"
        subtitle="Track your active patient blood requests, review matching donors, and coordinate transfusions."
        actions={
          <Link to="/receiver/create-request" className="btn-primary flex items-center gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            <span>New Blood Request</span>
          </Link>
        }
      />

      <Grid cols={4}>
        <Stat
          label="Active Requests"
          value={s.activeRequests}
          hint="Currently seeking donors"
          icon={Activity}
          tone="red"
        />
        <Stat
          label="Matched Donors"
          value={s.matchedDonors}
          hint="Donors alerted or accepted"
          icon={Users}
          tone="blue"
        />
        <Stat
          label="Completed Requests"
          value={s.completedRequests}
          hint="Successfully fulfilled"
          icon={CheckCircle2}
          tone="green"
        />
        <Stat
          label="Total Lifetime"
          value={s.totalRequests}
          hint="All posted requests"
          icon={AlertOctagon}
          tone="slate"
        />
      </Grid>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Breakdown Card */}
        <div className="card p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Request Status Breakdown</h2>
            <p className="text-xs text-slate-400">Distribution of your requests</p>
          </div>
          {!data.statusBreakdown.length ? (
            <p className="text-xs text-slate-400 py-4 text-center">No requests recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.statusBreakdown.map((b: any) => (
                <div
                  key={b.status}
                  className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0"
                >
                  <Badge value={b.status} />
                  <span className="font-extrabold text-sm text-white">{b.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests Card */}
        <div className="card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Recent Blood Requests</h2>
              <p className="text-xs text-slate-400">Latest activity on your emergency requests</p>
            </div>
            <Link to="/receiver/requests" className="text-xs font-bold text-brand-400 hover:underline">
              View All Requests →
            </Link>
          </div>

          {!data.recentRequests.length ? (
            <Empty
              title="No blood requests yet"
              hint="When you post an emergency request for a patient, it will be displayed here."
              action={
                <Link to="/receiver/create-request" className="btn-primary btn-sm">
                  Create First Request
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-slate-800/80">
              {data.recentRequests.map((r: any) => (
                <Link
                  key={r.id}
                  to={`/receiver/requests/${r.id}`}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-slate-800/40 rounded-lg px-2 transition group"
                >
                  <div className="flex items-center gap-3">
                    <BloodTag value={r.bloodGroup} />
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand-400 transition">
                        {r.patientName} · {r.units} Unit(s)
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r._count.alerts} donor(s) notified in radius
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={r.urgency} />
                    <Badge value={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
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
    e.preventDefault();
    setBusy(true);
    try {
      const res = await get('/donors/search', {
        ...f,
        lat: coords?.latitude,
        lng: coords?.longitude,
      });
      setResults(res);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const locate = async () => {
    const c = await geo.locate();
    if (c) {
      setCoords(c);
      toast.success('Current GPS coordinates detected');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search Compatible Donors"
        subtitle="Locate available, eligible voluntary donors compatible with your required blood group."
      />

      {/* Filter Card */}
      <form onSubmit={search} className="card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BloodSelect
            label="Blood Group Needed"
            required
            value={f.bloodGroup}
            onChange={(e) => setF({ ...f, bloodGroup: e.target.value })}
          />

          <Input
            label="City"
            placeholder="e.g. Phoenix"
            value={f.city}
            onChange={(e) => setF({ ...f, city: e.target.value })}
            disabled={!!coords}
            hint={coords ? 'Using GPS coordinates' : 'Search by city name'}
          />

          <Select
            label="Max Distance Radius"
            value={f.radius}
            onChange={(e) => setF({ ...f, radius: e.target.value })}
            disabled={!coords}
            hint={!coords ? 'Requires GPS coordinates' : undefined}
          >
            <option value="">Any distance</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
          </Select>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex-1 py-2.5 shadow-sm"
            >
              {busy ? <Spinner className="h-4 w-4 text-white" /> : <Search className="h-4 w-4" />}
              <span>Search</span>
            </button>
            <button
              type="button"
              className={`btn-outline px-3 ${coords ? 'border-brand-500/50 bg-brand-950/60 text-brand-300' : ''}`}
              onClick={coords ? () => setCoords(null) : locate}
              title={coords ? 'Clear GPS Location' : 'Use My GPS Location'}
            >
              <MapPin className="h-4 w-4" />
              <span className="text-xs">{coords ? 'Clear' : 'GPS'}</span>
            </button>
          </div>
        </div>

        {geo.error && (
          <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2.5">
            {geo.error}
          </p>
        )}
      </form>

      {/* Search Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Matching Available Donors ({results.length})
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="card p-8">
              <Empty
                title="No donors found in this area"
                hint="Try widening your search radius or create an emergency request—our system will continuously expand notifications automatically."
                action={
                  <Link to="/receiver/create-request" className="btn-primary btn-sm">
                    Create Blood Request
                  </Link>
                }
              />
            </div>
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Group</th>
                    <th>City</th>
                    <th>Distance</th>
                    <th>Status</th>
                    <th>Contact Information</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((d: any) => (
                    <tr key={d.id}>
                      <td className="font-semibold text-white">{d.name}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <BloodTag value={d.bloodGroup} />
                          {!d.exactMatch && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              (compatible)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{d.city}</td>
                      <td>
                        {d.distanceKm != null ? (
                          <span className="font-semibold text-brand-400">{d.distanceKm} km</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td>
                        <Badge value="AVAILABLE" />
                      </td>
                      <td className="text-xs">
                        {d.phone ? (
                          <span className="font-semibold text-white">{d.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Protected · Shared once donor accepts request
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}

          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-400">
              Need immediate emergency outreach? Create a verified blood request to dispatch instant alerts.
            </p>
            <Link to="/receiver/create-request" className="btn-outline btn-sm shrink-0">
              Create Blood Request
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReceiverCreateRequest() {
  const nav = useNavigate();
  const toast = useToast();
  const geo = useGeolocation();
  const hospitals = useFetch(() => get('/hospitals'));

  const { values, bind, set } = useForm<any>({
    patientName: '',
    bloodGroup: '',
    units: 1,
    hospitalId: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    urgency: 'NORMAL',
    requiredDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickHospital = (id: string) => {
    set('hospitalId', id);
    const h = (hospitals.data || []).find((x: any) => String(x.id) === id);
    if (h) {
      set('city', h.city);
      set('address', h.address);
    }
  };

  const detect = async () => {
    const c = await geo.locate();
    if (c) {
      set('latitude', c.latitude);
      set('longitude', c.longitude);
      toast.success('Coordinates detected from GPS');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post('/requests', values);
      setResult(r);
      toast.success(`Request created · ${r.donorsNotified} nearby donor(s) notified`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const alt = result.inventoryAlternatives;
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Blood Request Dispatched" />

        <div className="card p-6 sm:p-8 space-y-5 border-emerald-800/60 bg-[#151822]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Request #{result.request.id} Created</h2>
              <p className="text-xs text-slate-400">Live matching engine has started notifying donors</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400">Donors Alerted:</span>
              <span className="font-bold text-white text-sm">{result.donorsNotified} donor(s)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400">Initial Search Radius:</span>
              <span className="font-bold text-white">{result.request.searchRadiusKm} km</span>
            </div>
            {result.donorsNotified === 0 && (
              <p className="text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60">
                No voluntary donors answered immediately in range. The system will automatically expand search radius thresholds.
              </p>
            )}
          </div>

          {/* Blood Bank Reserves Check */}
          <div className="rounded-xl border border-blue-800/60 bg-blue-950/40 p-4 space-y-1.5 text-xs text-blue-200">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span>Hospital Blood Bank Cross-Check</span>
            </div>
            <p className="text-slate-300">
              <b className="text-white">{alt.totalUnits}</b> compatible unit(s) currently in stock across partner blood banks.
              {alt.sufficient ? ' There is sufficient bank stock to fulfill this request if needed.' : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="btn-primary"
              onClick={() => nav(`/receiver/requests/${result.request.id}`)}
            >
              Track Matching Donors
            </button>
            <button
              className="btn-outline"
              onClick={() => nav('/receiver')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Create Emergency Blood Request"
        subtitle="Submit patient requirements to dispatch automated alerts to nearby compatible, eligible donors."
      />

      <form onSubmit={submit} className="card p-6 sm:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Patient Full Name" required placeholder="e.g. David Miller" {...bind('patientName')} />

          <BloodSelect label="Required Blood Group" required {...bind('bloodGroup')} />

          <Input
            label="Units Required"
            type="number"
            min={1}
            max={20}
            required
            hint="Standard unit = approx. 450 ml"
            {...bind('units')}
          />

          <Select label="Urgency Level" required {...bind('urgency')}>
            <OptionList values={URGENCIES} />
          </Select>

          <Select
            label="Designated Hospital"
            value={values.hospitalId}
            onChange={(e) => pickHospital(e.target.value)}
          >
            <option value="">Other / Private Medical Center</option>
            {(hospitals.data || []).map((h: any) => (
              <option key={h.id} value={h.id}>
                {h.user.name} ({h.city})
              </option>
            ))}
          </Select>

          <Input
            label="Required By Date"
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            {...bind('requiredDate')}
          />

          <Input label="City" required placeholder="e.g. Phoenix" {...bind('city')} />

          <Input label="Hospital Address / Department" placeholder="e.g. ICU Wing 3" {...bind('address')} />
        </div>

        {/* Manual GPS fallback if no hospital chosen */}
        {!values.hospitalId && (
          <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Custom Location Coordinates
                </p>
                <p className="text-xs text-slate-400">
                  Provide coordinates so nearby donors can calculate travel distance.
                </p>
              </div>
              <button
                type="button"
                className="btn-outline btn-sm flex items-center gap-1.5"
                onClick={detect}
                disabled={geo.loading}
              >
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                <span>{geo.loading ? 'Detecting...' : 'Autofill GPS'}</span>
              </button>
            </div>

            {geo.error && (
              <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg p-2">
                {geo.error}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Latitude" type="number" step="any" placeholder="e.g. 33.4484" {...bind('latitude')} />
              <Input label="Longitude" type="number" step="any" placeholder="e.g. -112.0740" {...bind('longitude')} />
            </div>
          </div>
        )}

        <Textarea
          label="Clinical Notes / Attendant Instructions (Optional)"
          placeholder="e.g. Patient is undergoing emergency surgery at 4 PM, please contact ward attendant directly."
          {...bind('notes')}
        />

        <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base shadow-sm">
          {busy ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              <span>Alerting donors...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Create Request & Alert Nearest Donors</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

export function ReceiverMyRequests() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => get('/requests', { status, page, limit: 15 }),
    [status, page]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Blood Requests"
        subtitle="Manage and track progress on all your submitted blood requests."
        actions={
          <Link to="/receiver/create-request" className="btn-primary flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Request</span>
          </Link>
        }
      />

      <div className="card p-4 max-w-xs">
        <label className="label">Filter By Status</label>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <OptionList values={REQUEST_STATUSES} placeholder="All statuses" />
        </select>
      </div>

      {loading ? (
        <Loading text="Loading your requests..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty title="No blood requests found" hint="Create an emergency request to begin finding donors." />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Hospital</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Donors Alerted</th>
                <th>Required Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-semibold text-xs text-slate-400">#{r.id}</td>
                  <td className="font-semibold text-white">{r.patientName}</td>
                  <td>
                    <BloodTag value={r.bloodGroup} />
                  </td>
                  <td className="font-bold text-white">{r.units}</td>
                  <td>{r.hospital?.user.name || '-'}</td>
                  <td>
                    <Badge value={r.urgency} />
                  </td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td className="font-semibold text-white">{r._count.alerts}</td>
                  <td className="text-xs text-slate-400">{fmtDate(r.requiredDate)}</td>
                  <td className="text-right">
                    <Link
                      className="btn-outline btn-sm"
                      to={`/receiver/requests/${r.id}`}
                    >
                      Track
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

export function ReceiverMatching() {
  const toast = useToast();
  const reqs = useFetch(() => get('/requests', { limit: 50 }));
  const [id, setId] = useState('');
  const detail = useFetch(() => (id ? get('/requests/' + id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (!id && reqs.data?.items?.length) {
      setId(String(reqs.data.items[0].id));
    }
  }, [reqs.data, id]);

  const expand = async () => {
    try {
      const r = await post(`/requests/${id}/expand`);
      toast.success(r._message || 'Search radius expanded successfully');
      detail.reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const r = detail.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching Donors Overview"
        subtitle="Review which voluntary donors have been alerted, ordered by proximity."
      />

      {reqs.loading ? (
        <Loading text="Loading requests list..." />
      ) : !reqs.data?.items?.length ? (
        <div className="card">
          <Empty title="No blood requests yet" hint="Create a request to see matching donors." />
        </div>
      ) : (
        <>
          <div className="card p-4 max-w-md">
            <Select
              label="Select Active Blood Request"
              value={id}
              onChange={(e) => setId(e.target.value)}
            >
              {reqs.data.items.map((x: any) => (
                <option key={x.id} value={x.id} className="bg-[#151822] text-white">
                  #{x.id} · {x.patientName} ({x.bloodGroup.replace('_POS', '+').replace('_NEG', '-')}) - {x.status}
                </option>
              ))}
            </Select>
          </div>

          {detail.loading ? (
            <Loading text="Loading matched donors..." />
          ) : (
            r && (
              <div className="card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <BloodTag value={r.bloodGroup} size="lg" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {r.patientName} · {r.units} Unit(s) Needed
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Current search radius: <b className="text-white">{r.searchRadiusKm} km</b>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="btn-outline btn-sm flex items-center gap-1.5"
                      onClick={expand}
                      disabled={['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)}
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-brand-400" />
                      <span>Expand Radius</span>
                    </button>
                    <Link to={`/receiver/requests/${r.id}`} className="btn-primary btn-sm">
                      Full Details
                    </Link>
                  </div>
                </div>

                {!r.alerts.length ? (
                  <Empty
                    title="No donors alerted yet"
                    hint="Click 'Expand Radius' to notify eligible voluntary donors residing further away."
                  />
                ) : (
                  <TableWrap>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Donor Name</th>
                          <th>Blood Group</th>
                          <th>City</th>
                          <th>Distance</th>
                          <th>Alert Response</th>
                          <th>Direct Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.alerts.map((a: any) => (
                          <tr key={a.id}>
                            <td className="font-semibold text-white">{a.donor.user.name}</td>
                            <td>
                              <BloodTag value={a.donor.bloodGroup} />
                            </td>
                            <td>{a.donor.city}</td>
                            <td>
                              {a.distanceKm != null ? (
                                <span className="font-semibold text-brand-400">{a.distanceKm} km</span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td>
                              <Badge value={a.status} />
                            </td>
                            <td>
                              {a.donor.user.phone ? (
                                <span className="font-semibold text-white flex items-center gap-1.5">
                                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>{a.donor.user.phone}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  Shared once donor accepts
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                )}

                {r.inventoryAlternatives && (
                  <div className="rounded-xl border border-blue-800/60 bg-blue-950/40 p-4 text-xs text-blue-200 flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>
                      <b className="text-white">Blood Bank Alternative:</b> {r.inventoryAlternatives.totalUnits} compatible unit(s)
                      are currently in reserve across participating network blood banks.
                    </span>
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

export function ReceiverProfile() {
  const toast = useToast();
  const { refresh } = useAuth();
  const { data, loading, error, reload } = useFetch(() => get('/receivers/me'));
  const { values, setValues, bind } = useForm<any>({});

  useEffect(() => {
    if (data) {
      setValues({
        name: data.name,
        phone: data.phone,
        bloodGroup: data.receiver.bloodGroup,
        address: data.receiver.address,
        city: data.receiver.city,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <Loading text="Loading profile..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await put('/receivers/profile', values);
      toast.success('Profile updated successfully');
      refresh();
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Receiver Profile"
        subtitle="Your contact details and primary residential location."
      />

      <form onSubmit={save} className="card p-6 sm:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" required {...bind('name')} />
          <Input label="Email Address" value={data.email} disabled readOnly hint="Used for system login" />
          <Input label="Phone Number" required {...bind('phone')} />
          <BloodSelect required {...bind('bloodGroup')} />
          <Input label="City" required {...bind('city')} />
        </div>

        <Textarea label="Address" required {...bind('address')} />

        <button type="submit" className="btn-primary">
          Save Profile Changes
        </button>
      </form>
    </div>
  );
}
