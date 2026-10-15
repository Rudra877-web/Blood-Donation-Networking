import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  BloodSelect,
  BloodTag,
  Confirm,
  Empty,
  ErrorBox,
  Grid,
  Input,
  Loading,
  Modal,
  OptionList,
  PageHeader,
  Pager,
  Select,
  Stat,
  TableWrap,
  Textarea
} from '../../components/ui';
import { bg, DONATION_STATUSES, PATIENT_STATUSES } from '../../utils/constants';
import { fmtDate, toInputDate } from '../../utils/format';
import {
  Building2,
  Clock,
  Bed,
  CheckCircle2,
  AlertOctagon,
  Droplet,
  PlusCircle,
  Search,
  Check,
  X,
  MapPin,
  BarChart3,
  User,
  ShieldCheck,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

export function HospitalDashboard() {
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/dashboard'));

  if (loading) return <Loading text="Loading hospital dashboard..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const s = data.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Station Dashboard"
        subtitle="Manage admitted patients, verify incoming blood transfusion requests, and monitor blood intake."
      />

      <Grid cols={4}>
        <Stat
          label="Pending Approval"
          value={s.pendingRequests}
          hint="Awaiting hospital review"
          icon={Clock}
          tone="amber"
        />
        <Stat
          label="Total Blood Requests"
          value={s.totalRequests}
          hint="All assigned requests"
          icon={AlertOctagon}
          tone="slate"
        />
        <Stat
          label="Admitted Patients"
          value={s.patients}
          hint="Current active registry"
          icon={Bed}
          tone="blue"
        />
        <Stat
          label="Completed Donations"
          value={s.completedDonations}
          hint="Verified transfusions"
          icon={Droplet}
          tone="green"
        />
      </Grid>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Recent Assigned Requests</h2>
            <p className="text-xs text-slate-400">Latest transfusion requests for this hospital</p>
          </div>
          <Link to="/hospital/incoming" className="text-xs font-bold text-brand-400 hover:underline">
            View Incoming Requests →
          </Link>
        </div>

        {!data.recentRequests.length ? (
          <Empty title="No blood requests yet" hint="Incoming requests for this hospital will show here." />
        ) : (
          <div className="divide-y divide-slate-800/80">
            {data.recentRequests.map((r: any) => (
              <Link
                key={r.id}
                to={`/hospital/requests/${r.id}`}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-slate-800/40 rounded-lg px-2 transition group"
              >
                <div className="flex items-center gap-3">
                  <BloodTag value={r.bloodGroup} />
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-brand-400 transition">
                      {r.patientName} · {r.units} Unit(s)
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested by {r.receiver?.user?.name || 'Patient Attendant'}
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
  );
}

export function HospitalIncoming() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/requests', { status: 'PENDING' }));
  const [rejecting, setRejecting] = useState<any>(null);

  const act = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Blood Requests"
        subtitle="Critical and standard requests awaiting medical facility approval."
      />

      {loading ? (
        <Loading text="Loading incoming requests..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.length ? (
        <div className="card">
          <Empty title="No pending incoming requests" hint="All emergency transfusion requests have been reviewed." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((r: any) => (
            <div key={r.id} className="card p-6 space-y-4 border-slate-800 shadow-card bg-[#151822]">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <BloodTag value={r.bloodGroup} size="lg" />
                  <div>
                    <h3 className="text-base font-bold text-white">{r.patientName}</h3>
                    <p className="text-xs text-slate-400">Request #{r.id} · Required: {fmtDate(r.requiredDate)}</p>
                  </div>
                </div>
                <Badge value={r.urgency} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p>
                  <b className="text-slate-100">Units Required:</b> {r.units} unit(s)
                </p>
                <p>
                  <b className="text-slate-100">Requested By:</b> {r.receiver.user.name} ({r.receiver.user.phone})
                </p>
                {r.notes && (
                  <div className="rounded-lg bg-[#0E111A] border border-slate-800 p-2.5 text-slate-300 italic">
                    "{r.notes}"
                  </div>
                )}
                <p className="text-slate-400 pt-1">
                  Matching Engine: {r.alerts.filter((a: any) => a.status === 'ACCEPTED').length} donor(s) accepted ·{' '}
                  {r.alerts.length} donor(s) notified
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  className="btn-success btn-sm flex items-center gap-1.5"
                  onClick={() => act(() => put(`/hospitals/requests/${r.id}/approve`), 'Request approved')}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve Request</span>
                </button>
                <button
                  className="btn-danger btn-sm flex items-center gap-1.5"
                  onClick={() => setRejecting(r)}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
                <Link className="btn-outline btn-sm" to={`/hospital/requests/${r.id}`}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Confirm
        open={!!rejecting}
        danger
        title="Reject Blood Request"
        message={`Are you sure you want to reject the blood request for patient ${rejecting?.patientName}?`}
        confirmText="Reject Request"
        onCancel={() => setRejecting(null)}
        onConfirm={() => {
          const r = rejecting;
          setRejecting(null);
          act(() => put(`/hospitals/requests/${r.id}/reject`), 'Request rejected');
        }}
      />
    </div>
  );
}

export function HospitalRequests() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/requests'));
  const [toComplete, setToComplete] = useState<any>(null);

  const complete = async () => {
    try {
      await put(`/hospitals/requests/${toComplete.id}/complete`);
      toast.success('Request marked as completed');
      setToComplete(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
      setToComplete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request Management"
        subtitle="Review, approve, monitor, and mark completed once transfusion blood is delivered."
      />

      {loading ? (
        <Loading text="Loading hospital requests..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.length ? (
        <div className="card">
          <Empty title="No requests found" />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Blood</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Hospital Approved</th>
                <th>Donors Accepted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-semibold text-xs text-slate-400">#{r.id}</td>
                  <td className="font-semibold text-white">{r.patientName}</td>
                  <td>
                    <BloodTag value={r.bloodGroup} />
                  </td>
                  <td className="font-bold text-white">{r.units}</td>
                  <td>
                    <Badge value={r.urgency} />
                  </td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td>
                    {r.hospitalApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="font-semibold text-white">
                    {r.alerts.filter((a: any) => a.status === 'ACCEPTED').length} / {r.alerts.length}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link className="btn-outline btn-sm" to={`/hospital/requests/${r.id}`}>
                        View
                      </Link>
                      {r.hospitalApproved && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status) && (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => setToComplete(r)}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <Confirm
        open={!!toComplete}
        title="Complete Blood Request"
        message={`Mark request #${toComplete?.id} (${toComplete?.patientName}) as completed? Confirm this once the patient has safely received the transfusion.`}
        confirmText="Confirm Completion"
        onCancel={() => setToComplete(null)}
        onConfirm={complete}
      />
    </div>
  );
}

export function HospitalDonations() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/donations', { page, limit: 15 }), [page]);

  const update = async (id: number, status: string) => {
    try {
      await put(`/donations/${id}/status`, { status });
      toast.success('Donation status updated successfully');
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Intake Management"
        subtitle="Verify donor check-ins and update donation status (Pending, Confirmed, Completed, Declined)."
      />

      {loading ? (
        <Loading text="Loading donations..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty title="No donations recorded" hint="Donations scheduled at this hospital will show here." />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Donor Name</th>
                <th>Blood Group</th>
                <th>Request ID</th>
                <th>Units</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium text-slate-300">{fmtDate(d.donationDate)}</td>
                  <td className="font-semibold text-white">{d.donor?.user?.name}</td>
                  <td>
                    <BloodTag value={d.donor?.bloodGroup} />
                  </td>
                  <td>
                    {d.request ? (
                      <span className="text-xs font-semibold text-slate-300">
                        #{d.request.id} · {d.request.patientName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Direct Intake</span>
                    )}
                  </td>
                  <td className="font-bold text-white">{d.units}</td>
                  <td>
                    <Badge value={d.status} />
                  </td>
                  <td>
                    <select
                      className="input w-auto py-1 text-xs"
                      value={d.status}
                      onChange={(e) => update(d.id, e.target.value)}
                    >
                      <OptionList values={DONATION_STATUSES} />
                    </select>
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

const blankPatient = () => ({
  name: '',
  age: '',
  gender: 'MALE',
  bloodGroup: '',
  diagnosis: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  status: 'ADMITTED',
});

export function HospitalPatients() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useFetch(() => get('/patients', { search }), [search]);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const { values, setValues, bind } = useForm<any>(blankPatient());

  const openNew = () => {
    setValues(blankPatient());
    setEditing('new');
  };

  const openEdit = (p: any) => {
    setValues({ ...p, admissionDate: toInputDate(p.admissionDate) });
    setEditing(p);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      name: values.name,
      age: values.age,
      gender: values.gender,
      bloodGroup: values.bloodGroup,
      diagnosis: values.diagnosis,
      admissionDate: values.admissionDate,
      status: values.status,
    };
    try {
      if (editing === 'new') await post('/patients', body);
      else await put('/patients/' + editing.id, body);
      toast.success('Patient record saved');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async () => {
    try {
      await del('/patients/' + toDelete.id);
      toast.success('Patient deleted');
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Patient Registry"
        subtitle="Directory of admitted and active transfusion patients."
        actions={
          <button className="btn-primary flex items-center gap-1.5" onClick={openNew}>
            <PlusCircle className="h-4 w-4" />
            <span>Add Patient</span>
          </button>
        }
      />

      <div className="card p-4 max-w-sm">
        <label className="label">Search Registry</label>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loading text="Loading patient registry..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.length ? (
        <div className="card">
          <Empty title="No patients found" hint="Add admitted patients to manage their transfusion records." />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Blood Group</th>
                <th>Diagnosis</th>
                <th>Admission Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p: any) => (
                <tr key={p.id}>
                  <td className="font-bold text-white">{p.name}</td>
                  <td className="text-slate-300">{p.age}</td>
                  <td className="text-xs uppercase text-slate-400">{p.gender}</td>
                  <td>
                    <BloodTag value={p.bloodGroup} />
                  </td>
                  <td className="max-w-xs truncate text-xs text-slate-300">{p.diagnosis}</td>
                  <td className="text-xs text-slate-400">{fmtDate(p.admissionDate)}</td>
                  <td>
                    <Badge value={p.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => setViewing(p)}
                      >
                        View
                      </button>
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => setToDelete(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      {/* Edit / Add Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Register New Patient' : 'Edit Patient Record'}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Patient Full Name" required {...bind('name')} />
            <Input label="Age" type="number" min={0} max={130} required {...bind('age')} />
            <Select label="Gender" {...bind('gender')}>
              <OptionList values={['MALE', 'FEMALE', 'OTHER']} />
            </Select>
            <BloodSelect required {...bind('bloodGroup')} />
            <Input label="Admission Date" type="date" required {...bind('admissionDate')} />
            <Select label="Patient Status" {...bind('status')}>
              <OptionList values={PATIENT_STATUSES} />
            </Select>
          </div>
          <Textarea label="Diagnosis / Clinical Condition" required {...bind('diagnosis')} />
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Patient Record Details">
        {viewing && (
          <dl className="grid gap-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-slate-400 font-semibold uppercase">Patient Name</dt>
              <dd className="font-bold text-sm text-white mt-0.5">{viewing.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-semibold uppercase">Age & Gender</dt>
              <dd className="font-semibold text-slate-200 mt-0.5">
                {viewing.age} years · {viewing.gender}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-semibold uppercase">Blood Group</dt>
              <dd className="mt-1">
                <BloodTag value={viewing.bloodGroup} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-semibold uppercase">Status</dt>
              <dd className="mt-1">
                <Badge value={viewing.status} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-400 font-semibold uppercase">Admission Date</dt>
              <dd className="font-medium text-slate-300 mt-0.5">{fmtDate(viewing.admissionDate)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400 font-semibold uppercase">Clinical Diagnosis</dt>
              <dd className="rounded-lg bg-[#0E111A] border border-slate-800 p-3 mt-1 text-slate-200">
                {viewing.diagnosis}
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <Confirm
        open={!!toDelete}
        danger
        title="Delete Patient Record"
        message={`Are you sure you want to permanently delete patient ${toDelete?.name}?`}
        confirmText="Delete Patient"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}

export function HospitalReports() {
  const { data, loading, error, reload } = useFetch(() => get('/hospitals/reports'));

  if (loading) return <Loading text="Loading hospital analytics..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const t = data.totals;
  const max = Math.max(1, ...data.requirements.map((r: any) => r.unitsRequired));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Reports & Analytics"
        subtitle="Blood usage and requirement metrics calculated live."
      />

      <Grid cols={4}>
        <Stat label="Total Requests" value={t.totalRequests} icon={AlertOctagon} tone="slate" />
        <Stat label="Completed" value={t.completedRequests} icon={CheckCircle2} tone="green" />
        <Stat label="Pending / Open" value={t.pendingRequests} icon={Clock} tone="amber" />
        <Stat label="Total Donations" value={t.donations} icon={Droplet} tone="blue" />
      </Grid>

      <div className="card p-6 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Blood Requirements by Group (Units)</h2>
          <p className="text-xs text-slate-400">Demanded units across all patient requests</p>
        </div>

        <div className="space-y-3 pt-2">
          {data.requirements.map((r: any) => (
            <div key={r.bloodGroup} className="flex items-center gap-4 text-xs">
              <span className="w-12 font-bold text-brand-400">{bg(r.bloodGroup)}</span>
              <div className="h-3.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${(r.unitsRequired / max) * 100}%` }}
                />
              </div>
              <span className="w-28 text-right font-semibold text-slate-300">
                {r.unitsRequired} units ({r.requests} reqs)
              </span>
            </div>
          ))}
        </div>
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

  useEffect(() => {
    if (data) {
      setValues({
        name: data.name,
        phone: data.phone,
        address: data.hospital.address,
        city: data.hospital.city,
        latitude: data.hospital.latitude ?? '',
        longitude: data.hospital.longitude ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) return <Loading text="Loading profile..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await put('/hospitals/profile', values);
      toast.success('Hospital profile updated');
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
      toast.success('Coordinates detected from GPS');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Hospital Station Profile"
        subtitle="Manage official facility information, healthcare license, and emergency coordinates."
      />

      <form onSubmit={save} className="card p-6 sm:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Hospital / Facility Name" required {...bind('name')} />
          <Input label="Healthcare License Number" value={data.hospital.licenseNo} disabled readOnly hint="Verified by Administrator" />
          <Input label="Email Address" value={data.email} disabled readOnly hint="Used for system login" />
          <Input label="Emergency Phone" required {...bind('phone')} />
          <Input label="City" required {...bind('city')} />
        </div>

        <Textarea label="Hospital Address & Campus Info" required {...bind('address')} />

        <div className="rounded-xl border border-slate-800 bg-[#0E111A] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Facility GPS Coordinates
              </p>
              <p className="text-xs text-slate-400">
                Enables precise radius calculation when nearby donors are searched.
              </p>
            </div>
            <button type="button" className="btn-outline btn-sm flex items-center gap-1.5" onClick={detect}>
              <MapPin className="h-3.5 w-3.5 text-brand-400" />
              <span>Use Current GPS</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Latitude" type="number" step="any" {...bind('latitude')} />
            <Input label="Longitude" type="number" step="any" {...bind('longitude')} />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Save Hospital Profile
        </button>
      </form>
    </div>
  );
}
