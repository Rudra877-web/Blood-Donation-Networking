import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { del, get, post, put, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, BloodTag, Confirm, ErrorBox, Loading, OptionList, PageHeader } from '../../components/ui';
import { REQUEST_STATUSES } from '../../utils/constants';
import { fmtDate, fmtDateTime } from '../../utils/format';

/** Shared request view: tracking timeline + role-specific actions (backend re-checks every permission). */
export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data: r, loading, error, reload } = useFetch(() => get('/requests/' + id), [id]);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; run: () => Promise<any>; danger?: boolean }>(null);
  const role = user!.role;
  const base = `/${role.toLowerCase()}`;

  const act = async (fn: () => Promise<any>, ok = 'Done') => {
    try { const res = await fn(); toast.success(res?._message || ok); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  if (loading) return <Loading />;
  if (error || !r) return <ErrorBox message={error || 'Not found'} onRetry={reload} />;

  const closed = ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status);
  const accepted = r.alerts.filter((a: any) => a.status === 'ACCEPTED');
  const myAlert = role === 'DONOR' ? r.alerts[0] : null;
  const steps = [
    { label: 'Request created', done: true, at: r.createdAt },
    { label: 'Hospital approval', done: r.hospitalApproved, at: r.approvedAt },
    { label: 'Donor matched', done: accepted.length > 0 },
    { label: 'Donation', done: r.donations?.some((d: any) => d.status === 'COMPLETED' || d.status === 'CONFIRMED'), hint: r.donations?.[0]?.status },
    { label: 'Completed', done: r.status === 'COMPLETED', at: r.completedAt },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={`Request #${r.id} · ${r.patientName}`} subtitle={`Created ${fmtDateTime(r.createdAt)}`}
        actions={<><Link to={`${base}/requests`.replace('/donor/requests', '/donor/requests')} className="btn-outline">← Back</Link>
          {(accepted.length > 0 || role !== 'DONOR') && <Link to={`${base}/chat?request=${r.id}`} className="btn-outline">💬 Chat</Link>}</>} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3"><BloodTag value={r.bloodGroup} /><Badge value={r.status} /><Badge value={r.urgency} /></div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Units required</dt><dd className="font-medium">{r.units}</dd></div>
            <div><dt className="text-slate-500">Required date</dt><dd className="font-medium">{fmtDate(r.requiredDate)}</dd></div>
            <div><dt className="text-slate-500">Hospital</dt><dd className="font-medium">{r.hospital?.user.name || 'Not specified'}{r.hospital && `, ${r.hospital.city}`}</dd></div>
            <div><dt className="text-slate-500">Location</dt><dd className="font-medium">{r.city}{r.address ? `, ${r.address}` : ''}</dd></div>
            <div><dt className="text-slate-500">Requested by</dt><dd className="font-medium">{r.receiver.user.name}{r.receiver.user.phone && ` · ${r.receiver.user.phone}`}</dd></div>
            <div><dt className="text-slate-500">Search radius</dt><dd className="font-medium">{r.searchRadiusKm ? `${r.searchRadiusKm} km` : '-'}</dd></div>
            {r.notes && <div className="sm:col-span-2"><dt className="text-slate-500">Additional information</dt><dd>{r.notes}</dd></div>}
          </dl>
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Tracking</h3>
          <ol className="space-y-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${s.done ? 'bg-emerald-500' : 'bg-slate-300'}`}>{s.done ? '✓' : ''}</span>
                <span><span className={s.done ? 'font-medium' : 'text-slate-500'}>{s.label}</span>{s.at && <span className="block text-xs text-slate-400">{fmtDateTime(s.at)}</span>}{s.hint && <span className="ml-2"><Badge value={s.hint} /></span>}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="card flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-semibold text-slate-600">Actions</span>
        {role === 'DONOR' && myAlert?.status === 'NOTIFIED' && !closed && (<>
          <button className="btn-success" onClick={() => act(() => post(`/requests/${r.id}/respond`, { action: 'ACCEPT' }))}>Accept request</button>
          <button className="btn-outline" onClick={() => act(() => post(`/requests/${r.id}/respond`, { action: 'REJECT' }))}>Reject</button>
        </>)}
        {role === 'DONOR' && myAlert && myAlert.status !== 'NOTIFIED' && <span className="text-sm text-slate-500">You {myAlert.status.toLowerCase()} this request.</span>}
        {role === 'RECEIVER' && !closed && (<>
          <button className="btn-outline" onClick={() => act(() => post(`/requests/${r.id}/expand`))}>Expand search radius</button>
          <button className="btn-danger" onClick={() => setConfirm({ title: 'Cancel request', message: 'Cancel this blood request?', danger: true, run: () => put(`/requests/${r.id}/status`, { status: 'CANCELLED' }) })}>Cancel request</button>
        </>)}
        {role === 'HOSPITAL' && !closed && (<>
          {!r.hospitalApproved && <button className="btn-success" onClick={() => act(() => put(`/hospitals/requests/${r.id}/approve`), 'Request approved')}>Approve</button>}
          {!r.hospitalApproved && <button className="btn-danger" onClick={() => setConfirm({ title: 'Reject request', message: 'Reject this request?', danger: true, run: () => put(`/hospitals/requests/${r.id}/reject`) })}>Reject</button>}
          {r.hospitalApproved && <button className="btn-primary" onClick={() => setConfirm({ title: 'Complete request', message: 'Mark this request as completed (blood supplied)?', run: () => put(`/hospitals/requests/${r.id}/complete`) })}>Mark completed</button>}
        </>)}
        {role === 'ADMIN' && (<>
          <select className="input w-auto" value={r.status} onChange={(e) => act(() => put(`/requests/${r.id}/status`, { status: e.target.value }), 'Status updated')}><OptionList values={REQUEST_STATUSES} /></select>
          <button className="btn-outline" onClick={() => act(() => post(`/requests/${r.id}/expand`))} disabled={closed}>Expand search</button>
          <button className="btn-danger" onClick={() => setConfirm({ title: 'Delete request', message: 'Permanently delete this request and its chat/alerts?', danger: true, run: async () => { await del(`/requests/${r.id}`); nav('/admin/requests'); } })}>Delete</button>
        </>)}
        {closed && role !== 'ADMIN' && <span className="text-sm text-slate-500">This request is {r.status.toLowerCase()}.</span>}
      </div>

      {role !== 'DONOR' && (
        <div className="card">
          <h3 className="mb-3 font-semibold">Matching donors ({r.alerts.length})</h3>
          {!r.alerts.length ? <p className="text-sm text-slate-500">No eligible donors have been alerted yet. Try expanding the search radius.</p> : (
            <div className="overflow-x-auto"><table className="table"><thead><tr><th>Donor</th><th>Blood</th><th>City</th><th>Distance</th><th>Status</th><th>Contact</th></tr></thead><tbody>
              {r.alerts.map((a: any) => (
                <tr key={a.id}><td>{a.donor.user.name}</td><td><BloodTag value={a.donor.bloodGroup} /></td><td>{a.donor.city}</td><td>{a.distanceKm != null ? `${a.distanceKm} km` : '-'}</td><td><Badge value={a.status} /></td><td>{a.donor.user.phone ?? <span className="text-xs text-slate-400">Shown after acceptance</span>}</td></tr>
              ))}
            </tbody></table></div>
          )}
        </div>
      )}

      {r.inventoryAlternatives && (
        <div className="card">
          <h3 className="mb-1 font-semibold">Blood bank stock (alternative)</h3>
          <p className="mb-3 text-sm text-slate-500">{r.inventoryAlternatives.sufficient ? `${r.inventoryAlternatives.totalUnits} compatible unit(s) are in stock - enough for this request.` : `${r.inventoryAlternatives.totalUnits} compatible unit(s) in stock (fewer than the ${r.units} required).`}</p>
          {r.inventoryAlternatives.items.length > 0 && <div className="overflow-x-auto"><table className="table"><thead><tr><th>Group</th><th>Units</th><th>Source</th><th>Expires</th></tr></thead><tbody>
            {r.inventoryAlternatives.items.map((i: any) => <tr key={i.id}><td><BloodTag value={i.bloodGroup} /></td><td>{i.units}</td><td>{i.source}</td><td>{fmtDate(i.expiryDate)}</td></tr>)}
          </tbody></table></div>}
        </div>
      )}

      <Confirm open={!!confirm} title={confirm?.title || ''} message={confirm?.message || ''} danger={confirm?.danger} onCancel={() => setConfirm(null)}
        onConfirm={async () => { const c = confirm!; setConfirm(null); await act(c.run); }} />
    </div>
  );
}
