import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { del, get, post, put, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  BloodTag,
  Confirm,
  ErrorBox,
  Loading,
  OptionList,
  PageHeader,
  TableWrap
} from '../../components/ui';
import { REQUEST_STATUSES } from '../../utils/constants';
import { fmtDate, fmtDateTime } from '../../utils/format';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  Clock,
  Droplet,
  Building2,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Maximize2,
  Trash2,
  Check,
  X,
  Phone
} from 'lucide-react';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data: r, loading, error, reload } = useFetch(() => get('/requests/' + id), [id]);
  const [confirm, setConfirm] = useState<null | {
    title: string;
    message: string;
    run: () => Promise<any>;
    danger?: boolean;
  }>(null);

  const role = user!.role;
  const base = `/${role.toLowerCase()}`;

  const act = async (fn: () => Promise<any>, ok = 'Done') => {
    try {
      const res = await fn();
      toast.success(res?._message || ok);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (loading) return <Loading text="Loading blood request details..." />;
  if (error || !r) return <ErrorBox message={error || 'Blood request not found'} onRetry={reload} />;

  const closed = ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status);
  const accepted = r.alerts.filter((a: any) => a.status === 'ACCEPTED');
  const myAlert = role === 'DONOR' ? r.alerts[0] : null;

  const steps = [
    { label: 'Request Created', done: true, at: r.createdAt },
    { label: 'Hospital Approval', done: r.hospitalApproved, at: r.approvedAt },
    { label: 'Donor Matched & Accepted', done: accepted.length > 0 },
    {
      label: 'Transfusion Donation',
      done: r.donations?.some((d: any) => d.status === 'COMPLETED' || d.status === 'CONFIRMED'),
      hint: r.donations?.[0]?.status,
    },
    { label: 'Fulfilled & Completed', done: r.status === 'COMPLETED', at: r.completedAt },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Request #${r.id} · ${r.patientName}`}
        subtitle={`Submitted on ${fmtDateTime(r.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`${base}/requests`} className="btn-outline flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Requests</span>
            </Link>
            {(accepted.length > 0 || role !== 'DONOR') && (
              <Link
                to={`${base}/chat?request=${r.id}`}
                className="btn-primary flex items-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Open Request Chat</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Main Grid: Details & Stepper */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Overview Card */}
        <div className="card p-6 space-y-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <BloodTag value={r.bloodGroup} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-white">{r.patientName}</h2>
                <p className="text-xs text-slate-400">
                  Required Units: <b className="text-white">{r.units} unit(s)</b>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={r.urgency} />
              <Badge value={r.status} />
            </div>
          </div>

          <dl className="grid gap-4 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5 space-y-1">
              <dt className="text-slate-400 font-semibold uppercase">Required By Date</dt>
              <dd className="font-bold text-sm text-white flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-brand-400" />
                <span>{fmtDate(r.requiredDate)}</span>
              </dd>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5 space-y-1">
              <dt className="text-slate-400 font-semibold uppercase">Search Radius</dt>
              <dd className="font-bold text-sm text-white flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-400" />
                <span>{r.searchRadiusKm ? `${r.searchRadiusKm} km radius` : 'Default'}</span>
              </dd>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5 space-y-1">
              <dt className="text-slate-400 font-semibold uppercase">Hospital Destination</dt>
              <dd className="font-semibold text-slate-200 text-sm">
                {r.hospital?.user?.name || 'Private Healthcare Facility'}
                {r.hospital?.city && <span className="text-slate-400 font-normal"> · {r.hospital.city}</span>}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5 space-y-1">
              <dt className="text-slate-400 font-semibold uppercase">Attendant / Contact</dt>
              <dd className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                <span>
                  {r.receiver.user.name}
                  {r.receiver.user.phone && ` (${r.receiver.user.phone})`}
                </span>
              </dd>
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-[#0E111A] p-3.5 space-y-1">
              <dt className="text-slate-400 font-semibold uppercase">Location / Address</dt>
              <dd className="text-slate-300 text-sm font-medium">
                {r.city}
                {r.address ? `, ${r.address}` : ''}
              </dd>
            </div>

            {r.notes && (
              <div className="sm:col-span-2 rounded-xl border border-amber-800/60 bg-amber-950/40 p-3.5 space-y-1">
                <dt className="text-amber-300 font-semibold uppercase">Clinical Notes</dt>
                <dd className="text-slate-300 italic text-sm">{r.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Tracking Timeline Stepper */}
        <div className="card p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Transfusion Lifecycle</h3>
            <p className="text-xs text-slate-400">Live progress milestones</p>
          </div>

          <ol className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {steps.map((s, idx) => (
              <li key={s.label} className="flex items-start gap-3.5 text-xs relative z-10">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    s.done
                      ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-950/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/80'
                  }`}
                >
                  {s.done ? '✓' : idx + 1}
                </div>
                <div className="pt-0.5 space-y-0.5">
                  <span
                    className={`block font-bold text-xs ${
                      s.done ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.at && (
                    <span className="block text-[11px] text-slate-400">
                      {fmtDateTime(s.at)}
                    </span>
                  )}
                  {s.hint && (
                    <span className="inline-block mt-1">
                      <Badge value={s.hint} />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Role-Specific Action Controls Bar */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4 border-brand-900/60 bg-[#151822]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Actions:
          </span>
          {closed && <span className="text-xs text-slate-400 italic">This request is marked {r.status.toLowerCase()}.</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* DONOR Actions */}
          {role === 'DONOR' && myAlert?.status === 'NOTIFIED' && !closed && (
            <>
              <button
                className="btn-success flex items-center gap-1.5"
                onClick={() => act(() => post(`/requests/${r.id}/respond`, { action: 'ACCEPT' }))}
              >
                <Check className="h-4 w-4" />
                <span>Accept Blood Request</span>
              </button>
              <button
                className="btn-outline flex items-center gap-1.5"
                onClick={() => act(() => post(`/requests/${r.id}/respond`, { action: 'REJECT' }))}
              >
                <X className="h-4 w-4" />
                <span>Decline Request</span>
              </button>
            </>
          )}

          {/* RECEIVER Actions */}
          {role === 'RECEIVER' && !closed && (
            <>
              <button
                className="btn-outline flex items-center gap-1.5"
                onClick={() => act(() => post(`/requests/${r.id}/expand`))}
              >
                <Maximize2 className="h-4 w-4 text-brand-600" />
                <span>Expand Search Radius</span>
              </button>
              <button
                className="btn-danger flex items-center gap-1.5"
                onClick={() =>
                  setConfirm({
                    title: 'Cancel Blood Request',
                    message: 'Are you sure you want to cancel this emergency request? Alerted donors will be notified.',
                    danger: true,
                    run: () => put(`/requests/${r.id}/status`, { status: 'CANCELLED' }),
                  })
                }
              >
                Cancel Request
              </button>
            </>
          )}

          {/* HOSPITAL Actions */}
          {role === 'HOSPITAL' && !closed && (
            <>
              {!r.hospitalApproved && (
                <button
                  className="btn-success flex items-center gap-1.5"
                  onClick={() => act(() => put(`/hospitals/requests/${r.id}/approve`), 'Request approved')}
                >
                  <Check className="h-4 w-4" />
                  <span>Approve Request</span>
                </button>
              )}
              {!r.hospitalApproved && (
                <button
                  className="btn-danger flex items-center gap-1.5"
                  onClick={() =>
                    setConfirm({
                      title: 'Reject Blood Request',
                      message: 'Reject this request from hospital intake?',
                      danger: true,
                      run: () => put(`/hospitals/requests/${r.id}/reject`),
                    })
                  }
                >
                  Reject
                </button>
              )}
              {r.hospitalApproved && (
                <button
                  className="btn-primary flex items-center gap-1.5 shadow-sm"
                  onClick={() =>
                    setConfirm({
                      title: 'Complete Request',
                      message: 'Confirm that blood transfusion units have been supplied and patient treatment completed?',
                      run: () => put(`/hospitals/requests/${r.id}/complete`),
                    })
                  }
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark as Completed</span>
                </button>
              )}
            </>
          )}

          {/* ADMIN Actions */}
          {role === 'ADMIN' && (
            <>
              <select
                className="input w-auto py-1 text-xs"
                value={r.status}
                onChange={(e) => act(() => put(`/requests/${r.id}/status`, { status: e.target.value }), 'Status updated')}
              >
                <OptionList values={REQUEST_STATUSES} />
              </select>
              <button
                className="btn-outline btn-sm"
                onClick={() => act(() => post(`/requests/${r.id}/expand`))}
                disabled={closed}
              >
                Expand Radius
              </button>
              <button
                className="btn-danger btn-sm"
                onClick={() =>
                  setConfirm({
                    title: 'Delete Request',
                    message: 'Permanently remove this request and all related chat messages?',
                    danger: true,
                    run: async () => {
                      await del(`/requests/${r.id}`);
                      nav('/admin/requests');
                    },
                  })
                }
              >
                Delete Request
              </button>
            </>
          )}
        </div>
      </div>

      {/* Matching Donors List (For Receivers, Hospital & Admin) */}
      {role !== 'DONOR' && (
        <div className="card p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Matching Donors Alerted ({r.alerts.length})
              </h3>
              <p className="text-xs text-slate-400">Sorted by calculated travel distance</p>
            </div>
            {accepted.length > 0 && (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
                {accepted.length} donor(s) accepted
              </span>
            )}
          </div>

          {!r.alerts.length ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No voluntary donors alerted yet. Try expanding the search radius.
            </p>
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Group</th>
                    <th>City</th>
                    <th>Calculated Distance</th>
                    <th>Alert Status</th>
                    <th>Direct Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {r.alerts.map((a: any) => (
                    <tr key={a.id}>
                      <td className="font-bold text-white">{a.donor.user.name}</td>
                      <td>
                        <BloodTag value={a.donor.bloodGroup} />
                      </td>
                      <td className="text-slate-300">{a.donor.city}</td>
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
                          <span className="font-semibold text-white flex items-center gap-1 text-xs">
                            <Phone className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{a.donor.user.phone}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Protected · Revealed upon acceptance
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      {/* Blood Bank Reserves Alternative */}
      {r.inventoryAlternatives && (
        <div className="card p-6 space-y-3 border-blue-800/60 bg-[#151822]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/60">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hospital Blood Bank Reserves (Alternative)</h3>
              <p className="text-xs text-slate-400">
                {r.inventoryAlternatives.sufficient
                  ? `${r.inventoryAlternatives.totalUnits} compatible unit(s) are in reserve—enough to fulfill this request.`
                  : `${r.inventoryAlternatives.totalUnits} compatible unit(s) in reserve (fewer than the ${r.units} required).`}
              </p>
            </div>
          </div>

          {r.inventoryAlternatives.items.length > 0 && (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Blood Group</th>
                    <th>Available Units</th>
                    <th>Source Bank</th>
                    <th>Earliest Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {r.inventoryAlternatives.items.map((i: any) => (
                    <tr key={i.id}>
                      <td>
                        <BloodTag value={i.bloodGroup} />
                      </td>
                      <td className="font-bold text-white">{i.units} units</td>
                      <td className="text-slate-300">{i.source}</td>
                      <td className="text-xs text-slate-400">{fmtDate(i.expiryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </div>
      )}

      <Confirm
        open={!!confirm}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm!;
          setConfirm(null);
          await act(c.run);
        }}
      />
    </div>
  );
}
