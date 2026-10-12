import { FormEvent, useState } from 'react';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { Badge, BloodSelect, BloodTag, Confirm, Empty, ErrorBox, Input, Loading, Modal, OptionList, PageHeader, Pager, Select, TableWrap, Textarea } from '../../components/ui';
import { ACCOUNT_STATUSES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';

const blank = { role: 'DONOR', name: '', email: '', password: '', phone: '', bloodGroup: '', address: '', city: '', licenseNo: '', latitude: '', longitude: '', status: 'ACTIVE' };

export default function AdminUsers({ mode }: { mode: 'all' | 'approvals' }) {
  const toast = useToast();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState(mode === 'approvals' ? 'PENDING' : '');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/admin/users', { role, status, search: q, page, limit: 15 }), [role, status, q, page, mode]);
  const [editing, setEditing] = useState<any | null>(null); // user | 'new'
  const [confirm, setConfirm] = useState<null | { title: string; message: string; run: () => Promise<any> }>(null);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const { values, setValues, bind } = useForm<any>(blank);

  const act = async (fn: () => Promise<any>, ok: string) => { try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(errMsg(e)); } };

  const openNew = () => { setValues(blank); setEditing('new'); };
  const openEdit = (u: any) => {
    const p = u.donor || u.receiver || u.hospital || {};
    setValues({ ...blank, role: u.role, name: u.name, email: u.email, phone: u.phone, bloodGroup: p.bloodGroup || '', address: p.address || '', city: p.city || '', licenseNo: p.licenseNo || '', latitude: p.latitude ?? '', longitude: p.longitude ?? '', password: '' });
    setEditing(u);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const v = values;
    try {
      if (editing === 'new') {
        const body: any = { role: v.role, name: v.name, email: v.email, password: v.password, phone: v.phone, status: v.status, address: v.address, city: v.city };
        if (v.role !== 'HOSPITAL') body.bloodGroup = v.bloodGroup;
        if (v.role === 'HOSPITAL') body.licenseNo = v.licenseNo;
        if (v.role !== 'RECEIVER') { body.latitude = v.latitude; body.longitude = v.longitude; }
        await post('/admin/users', body);
        toast.success('User created');
      } else {
        const body: any = { name: v.name, phone: v.phone, email: v.email, address: v.address, city: v.city, latitude: v.latitude, longitude: v.longitude };
        if (v.role !== 'HOSPITAL' && v.role !== 'ADMIN') body.bloodGroup = v.bloodGroup;
        if (v.role === 'HOSPITAL') body.licenseNo = v.licenseNo;
        if (v.password) body.password = v.password;
        await put('/admin/users/' + editing.id, body);
        toast.success('User updated');
      }
      setEditing(null); reload();
    } catch (err) { toast.error(errMsg(err)); }
  };

  const profileOf = (u: any) => u.donor || u.receiver || u.hospital;
  const isNew = editing === 'new';

  return (
    <div>
      <PageHeader title={mode === 'approvals' ? 'Registration Approvals' : 'User Management'} subtitle={mode === 'approvals' ? 'Approve or reject new registrations' : 'Donors, receivers and hospitals'}
        actions={mode === 'all' && <button className="btn-primary" onClick={openNew}>+ Add user</button>} />
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <form className="sm:col-span-2 lg:col-span-1" onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1); }}>
          <input className="input" placeholder="Search name, email, phone, city..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select className="input" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}><option value="">All roles</option><option value="DONOR">Donors</option><option value="RECEIVER">Receivers</option><option value="HOSPITAL">Hospitals</option><option value="ADMIN">Admins</option></select>
        {mode === 'all' && <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><OptionList values={ACCOUNT_STATUSES} placeholder="All statuses" /></select>}
        <button className="btn-outline" onClick={() => { setQ(search); setPage(1); }}>Search</button>
      </div>

      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No users found" hint={mode === 'approvals' ? 'No pending registrations.' : 'Try changing the filters.'} /></div> : (
        <TableWrap>
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Contact</th><th>City</th><th>Blood</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {data.items.map((u: any) => {
                const p = profileOf(u);
                return (
                  <tr key={u.id}>
                    <td><p className="font-medium">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                    <td>{u.role}</td><td>{u.phone}</td><td>{p?.city || '-'}</td><td>{p?.bloodGroup ? <BloodTag value={p.bloodGroup} /> : '-'}</td>
                    <td><Badge value={u.status} /></td><td>{fmtDate(u.createdAt)}</td>
                    <td><div className="flex flex-wrap justify-end gap-1">
                      {u.status === 'PENDING' && <><button className="btn-success btn-sm" onClick={() => act(() => put(`/admin/users/${u.id}/approve`, { approve: true }), 'Registration approved')}>Approve</button><button className="btn-danger btn-sm" onClick={() => { setRejecting(u); setReason(''); }}>Reject</button></>}
                      {mode === 'all' && <>
                        {u.status === 'ACTIVE' && u.role !== 'ADMIN' && <button className="btn-outline btn-sm" onClick={() => setConfirm({ title: 'Suspend user', message: `Suspend ${u.name}? They will be unable to log in.`, run: () => put(`/admin/users/${u.id}/status`, { status: 'SUSPENDED' }) })}>Suspend</button>}
                        {(u.status === 'SUSPENDED' || u.status === 'REJECTED') && <button className="btn-outline btn-sm" onClick={() => act(() => put(`/admin/users/${u.id}/status`, { status: 'ACTIVE' }), 'User activated')}>Activate</button>}
                        <button className="btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirm({ title: 'Delete user', message: `Permanently delete ${u.name} and all related records?`, run: () => del('/admin/users/' + u.id) })}>Delete</button>
                      </>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Add user' : `Edit ${editing?.name || ''}`} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {isNew && <Select label="Role" required {...bind('role')}><option value="DONOR">Donor</option><option value="RECEIVER">Receiver</option><option value="HOSPITAL">Hospital</option></Select>}
            {isNew && <Select label="Initial status" {...bind('status')}><OptionList values={ACCOUNT_STATUSES} /></Select>}
            <Input label="Name" required {...bind('name')} />
            <Input label="Email" type="email" required {...bind('email')} />
            <Input label={isNew ? 'Password' : 'New password (optional)'} type="password" required={isNew} minLength={8} {...bind('password')} />
            <Input label="Phone" required {...bind('phone')} />
            {values.role !== 'HOSPITAL' && values.role !== 'ADMIN' && <BloodSelect required {...bind('bloodGroup')} />}
            {values.role === 'HOSPITAL' && <Input label="Licence number" required {...bind('licenseNo')} />}
            {values.role !== 'ADMIN' && <Input label="City" required {...bind('city')} />}
            {values.role !== 'RECEIVER' && values.role !== 'ADMIN' && <><Input label="Latitude" type="number" step="any" {...bind('latitude')} /><Input label="Longitude" type="number" step="any" {...bind('longitude')} /></>}
          </div>
          {values.role !== 'ADMIN' && <Textarea label="Address" required {...bind('address')} />}
          <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary">{isNew ? 'Create user' : 'Save changes'}</button></div>
        </form>
      </Modal>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`Reject ${rejecting?.name || ''}`}>
        <Textarea label="Reason (shown to the user)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2"><button className="btn-outline" onClick={() => setRejecting(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => { const u = rejecting; setRejecting(null); act(() => put(`/admin/users/${u.id}/approve`, { approve: false, reason }), 'Registration rejected'); }}>Reject registration</button></div>
      </Modal>

      <Confirm open={!!confirm} title={confirm?.title || ''} message={confirm?.message || ''} danger onCancel={() => setConfirm(null)}
        onConfirm={() => { const c = confirm!; setConfirm(null); act(c.run, 'Done'); }} />
    </div>
  );
}
