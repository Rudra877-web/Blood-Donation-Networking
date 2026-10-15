import { FormEvent, useState } from 'react';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import {
  Badge,
  BloodSelect,
  BloodTag,
  Confirm,
  Empty,
  ErrorBox,
  Input,
  Loading,
  Modal,
  OptionList,
  PageHeader,
  Pager,
  Select,
  TableWrap,
  Textarea
} from '../../components/ui';
import { ACCOUNT_STATUSES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';
import {
  Users,
  UserCheck,
  Search,
  PlusCircle,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Edit,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

const blank = {
  role: 'DONOR',
  name: '',
  email: '',
  password: '',
  phone: '',
  bloodGroup: '',
  address: '',
  city: '',
  licenseNo: '',
  latitude: '',
  longitude: '',
  status: 'ACTIVE',
};

export default function AdminUsers({ mode }: { mode: 'all' | 'approvals' }) {
  const toast = useToast();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState(mode === 'approvals' ? 'PENDING' : '');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useFetch(
    () => get('/admin/users', { role, status, search: q, page, limit: 15 }),
    [role, status, q, page, mode]
  );

  const [editing, setEditing] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; run: () => Promise<any> }>(null);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const { values, setValues, bind } = useForm<any>(blank);

  const act = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openNew = () => {
    setValues(blank);
    setEditing('new');
  };

  const openEdit = (u: any) => {
    const p = u.donor || u.receiver || u.hospital || {};
    setValues({
      ...blank,
      role: u.role,
      name: u.name,
      email: u.email,
      phone: u.phone,
      bloodGroup: p.bloodGroup || '',
      address: p.address || '',
      city: p.city || '',
      licenseNo: p.licenseNo || '',
      latitude: p.latitude ?? '',
      longitude: p.longitude ?? '',
      password: '',
    });
    setEditing(u);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const v = values;
    try {
      if (editing === 'new') {
        const body: any = {
          role: v.role,
          name: v.name,
          email: v.email,
          password: v.password,
          phone: v.phone,
          status: v.status,
          address: v.address,
          city: v.city,
        };
        if (v.role !== 'HOSPITAL') body.bloodGroup = v.bloodGroup;
        if (v.role === 'HOSPITAL') body.licenseNo = v.licenseNo;
        if (v.role !== 'RECEIVER') {
          body.latitude = v.latitude;
          body.longitude = v.longitude;
        }
        await post('/admin/users', body);
        toast.success('User account created');
      } else {
        const body: any = {
          name: v.name,
          phone: v.phone,
          email: v.email,
          address: v.address,
          city: v.city,
          latitude: v.latitude,
          longitude: v.longitude,
        };
        if (v.role !== 'HOSPITAL' && v.role !== 'ADMIN') body.bloodGroup = v.bloodGroup;
        if (v.role === 'HOSPITAL') body.licenseNo = v.licenseNo;
        if (v.password) body.password = v.password;
        await put('/admin/users/' + editing.id, body);
        toast.success('User record updated');
      }
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const profileOf = (u: any) => u.donor || u.receiver || u.hospital;
  const isNew = editing === 'new';

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'approvals' ? 'Registration Approval Queue' : 'User Management Directory'}
        subtitle={
          mode === 'approvals'
            ? 'Review and verify pending registrations for voluntary donors, patient attendants, and hospitals.'
            : 'Complete directory of registered participants across all system roles.'
        }
        actions={
          mode === 'all' && (
            <button className="btn-primary flex items-center gap-1.5" onClick={openNew}>
              <PlusCircle className="h-4 w-4" />
              <span>Add User Account</span>
            </button>
          )
        }
      />

      {/* Filter / Search Bar */}
      <div className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <form
          className="sm:col-span-2 lg:col-span-1"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
            setPage(1);
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search name, email, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>

        <select
          className="input"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Account Roles</option>
          <option value="DONOR">Voluntary Donors</option>
          <option value="RECEIVER">Receivers / Attendants</option>
          <option value="HOSPITAL">Hospitals & Blood Banks</option>
          <option value="ADMIN">System Administrators</option>
        </select>

        {mode === 'all' && (
          <select
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <OptionList values={ACCOUNT_STATUSES} placeholder="All Account Statuses" />
          </select>
        )}

        <button
          className="btn-outline"
          onClick={() => {
            setQ(search);
            setPage(1);
          }}
        >
          Filter Results
        </button>
      </div>

      {loading ? (
        <Loading text="Loading user records..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty
            title={mode === 'approvals' ? 'No pending approvals' : 'No user records found'}
            hint={
              mode === 'approvals'
                ? 'Great job! The registration approval queue is completely clear.'
                : 'Try adjusting your search query or role filters.'
            }
          />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role</th>
                <th>Phone Number</th>
                <th>City</th>
                <th>Blood Group / License</th>
                <th>Account Status</th>
                <th>Registered Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u: any) => {
                const p = profileOf(u);
                return (
                  <tr key={u.id}>
                    <td>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td>
                      <span className="inline-flex rounded-md bg-slate-800 border border-slate-700/80 px-2 py-0.5 text-xs font-semibold text-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs font-medium text-slate-200">{u.phone}</td>
                    <td className="text-slate-300">{p?.city || '-'}</td>
                    <td>
                      {p?.bloodGroup ? (
                        <BloodTag value={p.bloodGroup} />
                      ) : p?.licenseNo ? (
                        <span className="text-xs font-mono font-medium text-slate-300">
                          {p.licenseNo}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td>
                      <Badge value={u.status} />
                    </td>
                    <td className="text-xs text-slate-400">{fmtDate(u.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {u.status === 'PENDING' && (
                          <>
                            <button
                              className="btn-success btn-sm flex items-center gap-1"
                              onClick={() =>
                                act(
                                  () => put(`/admin/users/${u.id}/approve`, { approve: true }),
                                  'Registration approved'
                                )
                              }
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              className="btn-danger btn-sm flex items-center gap-1"
                              onClick={() => {
                                setRejecting(u);
                                setReason('');
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {mode === 'all' && (
                          <>
                            {u.status === 'ACTIVE' && u.role !== 'ADMIN' && (
                              <button
                                className="btn-outline btn-sm"
                                onClick={() =>
                                  setConfirm({
                                    title: 'Suspend User',
                                    message: `Suspend ${u.name}? They will be unable to log in to their dashboard.`,
                                    run: () => put(`/admin/users/${u.id}/status`, { status: 'SUSPENDED' }),
                                  })
                                }
                              >
                                Suspend
                              </button>
                            )}
                            {(u.status === 'SUSPENDED' || u.status === 'REJECTED') && (
                              <button
                                className="btn-outline btn-sm"
                                onClick={() =>
                                  act(
                                    () => put(`/admin/users/${u.id}/status`, { status: 'ACTIVE' }),
                                    'User account activated'
                                  )
                                }
                              >
                                Activate
                              </button>
                            )}
                            <button className="btn-outline btn-sm" onClick={() => openEdit(u)}>
                              Edit
                            </button>
                            <button
                              className="btn-danger btn-sm"
                              onClick={() =>
                                setConfirm({
                                  title: 'Delete User Account',
                                  message: `Permanently delete ${u.name} and all related records? This action cannot be reversed.`,
                                  run: () => del('/admin/users/' + u.id),
                                })
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'Create New User Account' : `Edit Account: ${editing?.name || ''}`}
        wide
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {isNew && (
              <Select label="Role" required {...bind('role')}>
                <option value="DONOR">Voluntary Donor</option>
                <option value="RECEIVER">Patient / Receiver</option>
                <option value="HOSPITAL">Hospital / Blood Bank</option>
              </Select>
            )}
            {isNew && (
              <Select label="Initial Account Status" {...bind('status')}>
                <OptionList values={ACCOUNT_STATUSES} />
              </Select>
            )}
            <Input label="Full Legal Name" required {...bind('name')} />
            <Input label="Email Address" type="email" required {...bind('email')} />
            <Input
              label={isNew ? 'Password' : 'New Password (leave empty to keep unchanged)'}
              type="password"
              required={isNew}
              minLength={8}
              {...bind('password')}
            />
            <Input label="Phone Number" required {...bind('phone')} />
            {values.role !== 'HOSPITAL' && values.role !== 'ADMIN' && (
              <BloodSelect required {...bind('bloodGroup')} />
            )}
            {values.role === 'HOSPITAL' && (
              <Input label="Healthcare License Number" required {...bind('licenseNo')} />
            )}
            {values.role !== 'ADMIN' && <Input label="City" required {...bind('city')} />}
            {values.role !== 'RECEIVER' && values.role !== 'ADMIN' && (
              <>
                <Input label="Latitude" type="number" step="any" {...bind('latitude')} />
                <Input label="Longitude" type="number" step="any" {...bind('longitude')} />
              </>
            )}
          </div>
          {values.role !== 'ADMIN' && <Textarea label="Address" required {...bind('address')} />}
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isNew ? 'Create Account' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`Reject Registration: ${rejecting?.name || ''}`}>
        <div className="space-y-4">
          <Textarea
            label="Reason for Rejection (Shown to the user on login)"
            placeholder="e.g. Incomplete hospital documentation or unverified license number."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2.5">
            <button className="btn-outline" onClick={() => setRejecting(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                const u = rejecting;
                setRejecting(null);
                act(
                  () => put(`/admin/users/${u.id}/approve`, { approve: false, reason }),
                  'Registration rejected'
                );
              }}
            >
              Reject Registration
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!confirm}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm!;
          setConfirm(null);
          act(c.run, 'Action completed');
        }}
      />
    </div>
  );
}
