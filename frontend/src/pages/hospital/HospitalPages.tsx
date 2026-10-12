import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, BloodSelect, BloodTag, Confirm, Empty, ErrorBox, Grid, Input, Loading, Modal, OptionList, PageHeader, Pager, Select, Stat, TableWrap, Textarea } from '../../components/ui';
import { bg, DONATION_STATUSES, PATIENT_STATUSES } from '../../utils/constants';
import { fmtDate, toInputDate } from '../../utils/format';

export function HospitalDashboard() {
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.stats;
  return (
    <div className="space-y-6">
      <PageHeader title="Hospital Dashboard" />
      <Grid><Stat label="Pending requests" value={s.pendingRequests} tone="amber" /><Stat label="Total requests" value={s.totalRequests} tone="slate" /><Stat label="Patients" value={s.patients} tone="blue" /><Stat label="Completed donations" value={s.completedDonations} tone="green" /></Grid>
      <div className="card"><div className="mb-3 flex justify-between"><h2 className="font-semibold">Recent requests</h2><Link to="/hospital/incoming" className="text-sm text-brand-700 hover:underline">View incoming</Link></div>
        {!data.recentRequests.length ? <Empty title="No requests yet" /> : data.recentRequests.map((r: any) => (
          <Link key={r.id} to={`/hospital/requests/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 text-sm last:border-0 hover:bg-slate-50"><span className="flex items-center gap-2"><BloodTag value={r.bloodGroup} />{r.patientName}<span className="text-slate-400">by {r.receiver.user.name}</span></span><span className="flex gap-2"><Badge value={r.urgency} /><Badge value={r.status} /></span></Link>))}
      </div>
    </div>
  );
}

export function HospitalIncoming() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/requests', { status: 'PENDING' }));
  const [rejecting, setRejecting] = useState<any>(null);
  const act = async (fn: () => Promise<any>, ok: string) => { try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div>
      <PageHeader title="Incoming Requests" subtitle="Pending requests awaiting your approval (critical first)" />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.length ? <div className="card"><Empty title="No pending requests" /></div> : (
        <div className="grid gap-4 lg:grid-cols-2">{data.map((r: any) => (
          <div key={r.id} className="card space-y-3">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><BloodTag value={r.bloodGroup} /><span className="font-semibold">{r.patientName}</span></div><Badge value={r.urgency} /></div>
            <p className="text-sm text-slate-600">{r.units} unit(s) · required {fmtDate(r.requiredDate)} · requested by {r.receiver.user.name} ({r.receiver.user.phone})</p>
            {r.notes && <p className="rounded bg-slate-50 p-2 text-sm">{r.notes}</p>}
            <p className="text-xs text-slate-500">{r.alerts.filter((a: any) => a.status === 'ACCEPTED').length} donor(s) accepted · {r.alerts.length} alerted</p>
            <div className="flex flex-wrap gap-2"><button className="btn-success btn-sm" onClick={() => act(() => put(`/hospitals/requests/${r.id}/approve`), 'Request approved')}>Approve</button><button className="btn-danger btn-sm" onClick={() => setRejecting(r)}>Reject</button><Link className="btn-outline btn-sm" to={`/hospital/requests/${r.id}`}>Details</Link></div>
          </div>))}</div>
      )}
      <Confirm open={!!rejecting} danger title="Reject request" message={`Reject the request for ${rejecting?.patientName}?`} confirmText="Reject" onCancel={() => setRejecting(null)} onConfirm={() => { const r = rejecting; setRejecting(null); act(() => put(`/hospitals/requests/${r.id}/reject`), 'Request rejected'); }} />
    </div>
  );
}

/** Request management: all requests of this hospital; approved ones can be completed once blood is supplied. */
export function HospitalRequests() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/requests'));
  const [toComplete, setToComplete] = useState<any>(null);
  const complete = async () => { try { await put(`/hospitals/requests/${toComplete.id}/complete`); toast.success('Request marked as completed'); setToComplete(null); reload(); } catch (e) { toast.error(errMsg(e)); setToComplete(null); } };
  return (
    <div>
      <PageHeader title="Request Management" subtitle="Approve, track and complete blood requests" />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.length ? <div className="card"><Empty title="No requests" /></div> : (
        <TableWrap><table className="table"><thead><tr><th>#</th><th>Patient</th><th>Blood</th><th>Units</th><th>Urgency</th><th>Status</th><th>Approved</th><th>Donors</th><th /></tr></thead><tbody>
          {data.map((r: any) => <tr key={r.id}><td>{r.id}</td><td className="font-medium">{r.patientName}</td><td><BloodTag value={r.bloodGroup} /></td><td>{r.units}</td><td><Badge value={r.urgency} /></td><td><Badge value={r.status} /></td><td>{r.hospitalApproved ? '✅' : '-'}</td><td>{r.alerts.filter((a: any) => a.status === 'ACCEPTED').length}/{r.alerts.length}</td>
            <td><div className="flex justify-end gap-1"><Link className="btn-outline btn-sm" to={`/hospital/requests/${r.id}`}>View</Link>{r.hospitalApproved && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status) && <button className="btn-primary btn-sm" onClick={() => setToComplete(r)}>Mark completed</button>}</div></td></tr>)}
        </tbody></table></TableWrap>)}
      <Confirm open={!!toComplete} title="Complete request" message={`Mark request #${toComplete?.id} (${toComplete?.patientName}) as completed? Use this after blood has been supplied.`} confirmText="Mark completed" onCancel={() => setToComplete(null)} onConfirm={complete} />
    </div>
  );
}

export function HospitalDonations() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/donations', { page, limit: 15 }), [page]);
  const update = async (id: number, status: string) => { try { await put(`/donations/${id}/status`, { status }); toast.success('Donation status updated'); reload(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div>
      <PageHeader title="Donations" subtitle="Update donation status: Pending, Confirmed, Completed, Declined" />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No donations yet" /></div> : (
        <TableWrap><table className="table"><thead><tr><th>Date</th><th>Donor</th><th>Blood</th><th>Request</th><th>Units</th><th>Status</th><th>Update</th></tr></thead><tbody>
          {data.items.map((d: any) => <tr key={d.id}><td>{fmtDate(d.donationDate)}</td><td>{d.donor.user.name}</td><td><BloodTag value={d.donor.bloodGroup} /></td><td>{d.request ? `#${d.request.id} ${d.request.patientName}` : '-'}</td><td>{d.units}</td><td><Badge value={d.status} /></td>
            <td><select className="input w-auto py-1 text-xs" value={d.status} onChange={(e) => update(d.id, e.target.value)}><OptionList values={DONATION_STATUSES} /></select></td></tr>)}
        </tbody></table><Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} /></TableWrap>)}
    </div>
  );
}

const blankPatient = () => ({ name: '', age: '', gender: 'MALE', bloodGroup: '', diagnosis: '', admissionDate: new Date().toISOString().slice(0, 10), status: 'ADMITTED' });

export function HospitalPatients() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useFetch(() => get('/patients', { search }), [search]);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const { values, setValues, bind } = useForm<any>(blankPatient());
  const openNew = () => { setValues(blankPatient()); setEditing('new'); };
  const openEdit = (p: any) => { setValues({ ...p, admissionDate: toInputDate(p.admissionDate) }); setEditing(p); };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = { name: values.name, age: values.age, gender: values.gender, bloodGroup: values.bloodGroup, diagnosis: values.diagnosis, admissionDate: values.admissionDate, status: values.status };
    try { if (editing === 'new') await post('/patients', body); else await put('/patients/' + editing.id, body); toast.success('Patient saved'); setEditing(null); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async () => { try { await del('/patients/' + toDelete.id); toast.success('Patient deleted'); setToDelete(null); reload(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div>
      <PageHeader title="Patients" actions={<button className="btn-primary" onClick={openNew}>+ Add patient</button>} />
      <div className="card mb-4 max-w-sm"><input className="input" placeholder="Search patient name..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.length ? <div className="card"><Empty title="No patients" /></div> : (
        <TableWrap><table className="table"><thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Blood</th><th>Diagnosis</th><th>Admitted</th><th>Status</th><th /></tr></thead><tbody>
          {data.map((p: any) => <tr key={p.id}><td className="font-medium">{p.name}</td><td>{p.age}</td><td>{p.gender}</td><td><BloodTag value={p.bloodGroup} /></td><td className="max-w-xs truncate">{p.diagnosis}</td><td>{fmtDate(p.admissionDate)}</td><td><Badge value={p.status} /></td>
            <td><div className="flex justify-end gap-1"><button className="btn-outline btn-sm" onClick={() => setViewing(p)}>View</button><button className="btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button><button className="btn-danger btn-sm" onClick={() => setToDelete(p)}>Delete</button></div></td></tr>)}
        </tbody></table></TableWrap>)}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add patient' : 'Edit patient'}>
        <form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required {...bind('name')} /><Input label="Age" type="number" min={0} max={130} required {...bind('age')} />
          <Select label="Gender" {...bind('gender')}><OptionList values={['MALE', 'FEMALE', 'OTHER']} /></Select><BloodSelect required {...bind('bloodGroup')} />
          <Input label="Admission date" type="date" required {...bind('admissionDate')} /><Select label="Status" {...bind('status')}><OptionList values={PATIENT_STATUSES} /></Select></div>
          <Textarea label="Diagnosis" required {...bind('diagnosis')} /><div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary">Save</button></div></form>
      </Modal>
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Patient details">
        {viewing && <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Name</dt><dd className="font-medium">{viewing.name}</dd></div><div><dt className="text-slate-500">Age / Gender</dt><dd className="font-medium">{viewing.age} / {viewing.gender}</dd></div><div><dt className="text-slate-500">Blood group</dt><dd className="font-medium">{bg(viewing.bloodGroup)}</dd></div><div><dt className="text-slate-500">Status</dt><dd><Badge value={viewing.status} /></dd></div><div><dt className="text-slate-500">Admission</dt><dd className="font-medium">{fmtDate(viewing.admissionDate)}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Diagnosis</dt><dd>{viewing.diagnosis}</dd></div></dl>}
      </Modal>
      <Confirm open={!!toDelete} danger title="Delete patient" message={`Delete ${toDelete?.name}?`} confirmText="Delete" onCancel={() => setToDelete(null)} onConfirm={remove} />
    </div>
  );
}

export function HospitalReports() {
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/reports'));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const t = data.totals;
  const max = Math.max(1, ...data.requirements.map((r: any) => r.unitsRequired));
  return (
    <div className="space-y-6">
      <PageHeader title="Hospital Reports" />
      <Grid><Stat label="Total requests" value={t.totalRequests} tone="slate" /><Stat label="Completed" value={t.completedRequests} tone="green" /><Stat label="Pending / open" value={t.pendingRequests} tone="amber" /><Stat label="Donations" value={t.donations} tone="blue" /><Stat label="Patients" value={t.patients} /></Grid>
      <div className="card"><h2 className="mb-3 font-semibold">Blood requirements by group (units)</h2>
        {data.requirements.map((r: any) => <div key={r.bloodGroup} className="mb-2 flex items-center gap-3 text-sm"><span className="w-10 font-bold text-brand-700">{bg(r.bloodGroup)}</span><div className="h-3 flex-1 rounded bg-slate-100"><div className="h-3 rounded bg-brand-600" style={{ width: `${(r.unitsRequired / max) * 100}%` }} /></div><span className="w-24 text-right">{r.unitsRequired} units ({r.requests})</span></div>)}
      </div>
    </div>
  );
}

export function HospitalProfile() {
  const toast = useToast();
  const { refresh } = useAuth();
  const geo = useGeolocation();
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/me'));
  const { values, setValues, bind, set } = useForm<any>({});
  useEffect(() => { if (data) setValues({ name: data.name, phone: data.phone, address: data.hospital.address, city: data.hospital.city, latitude: data.hospital.latitude ?? '', longitude: data.hospital.longitude ?? '' }); /* eslint-disable-next-line */ }, [data]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const save = async (e: FormEvent) => { e.preventDefault(); try { await put('/hospitals/profile', values); toast.success('Profile updated'); refresh(); reload(); } catch (err) { toast.error(errMsg(err)); } };
  const detect = async () => { const c = await geo.locate(); if (c) { set('latitude', c.latitude); set('longitude', c.longitude); } };
  return (
    <div className="max-w-3xl"><PageHeader title="Hospital Profile" />
      <form onSubmit={save} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><Input label="Hospital name" required {...bind('name')} /><Input label="Licence number" value={data.hospital.licenseNo} disabled readOnly /><Input label="Email" value={data.email} disabled readOnly /><Input label="Phone" required {...bind('phone')} /><Input label="City" required {...bind('city')} /></div>
        <Textarea label="Address / location" required {...bind('address')} />
        <div className="rounded-lg bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Coordinates</p><button type="button" className="btn-outline btn-sm" onClick={detect}>📍 Use my location</button></div>{geo.error && <p className="mt-2 text-xs text-amber-700">{geo.error}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label="Latitude" type="number" step="any" {...bind('latitude')} /><Input label="Longitude" type="number" step="any" {...bind('longitude')} /></div></div>
        <button className="btn-primary">Save changes</button>
      </form>
    </div>
  );
}
