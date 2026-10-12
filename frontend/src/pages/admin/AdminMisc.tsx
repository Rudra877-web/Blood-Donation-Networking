import { FormEvent, useState } from 'react';
import { del, errMsg, get, post } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { Badge, Confirm, Empty, ErrorBox, Grid, Input, Loading, PageHeader, Pager, Select, Stat, TableWrap, Textarea } from '../../components/ui';
import { Stars } from '../shared/FeedbackPage';
import NotificationsPage from '../shared/NotificationsPage';
import SettingsPage from '../shared/SettingsPage';
import { fmtDate, fmtDateTime, titleCase } from '../../utils/format';

export function AdminFeedback() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => get('/feedback'));
  const [toDelete, setToDelete] = useState<any>(null);
  const remove = async () => { try { await del('/feedback/' + toDelete.id); toast.success('Feedback deleted'); setToDelete(null); reload(); } catch (e) { toast.error(errMsg(e)); } };
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.stats;
  const max = Math.max(1, ...s.distribution.map((d: any) => d.count));
  return (
    <div className="space-y-6">
      <PageHeader title="Feedback" subtitle="Reviews from users" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Stat label="Average rating" value={`${s.average} / 5`} tone="amber" /><Stat label="Total reviews" value={s.total} tone="blue" />
        <div className="card">{s.distribution.map((d: any) => <div key={d.rating} className="flex items-center gap-2 text-xs"><span className="w-6">{d.rating}★</span><div className="h-2 flex-1 rounded bg-slate-100"><div className="h-2 rounded bg-amber-400" style={{ width: `${(d.count / max) * 100}%` }} /></div><span className="w-5 text-right">{d.count}</span></div>)}</div>
      </div>
      {!data.items.length ? <div className="card"><Empty title="No feedback yet" /></div> : (
        <div className="space-y-2">{data.items.map((f: any) => (
          <div key={f.id} className="card flex items-start justify-between gap-3">
            <div><div className="flex items-center gap-3"><Stars value={f.rating} /><span className="text-sm font-medium">{f.user.name}</span><span className="text-xs text-slate-400">{f.user.role.toLowerCase()} · {fmtDate(f.createdAt)}</span></div><p className="mt-1 text-sm text-slate-700">{f.comment}</p></div>
            <button className="btn-danger btn-sm" onClick={() => setToDelete(f)}>Delete</button>
          </div>))}</div>
      )}
      <Confirm open={!!toDelete} danger title="Delete feedback" message="Delete this feedback permanently?" confirmText="Delete" onCancel={() => setToDelete(null)} onConfirm={remove} />
    </div>
  );
}

export function AdminLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useFetch(() => get('/admin/logs', { page, limit: 25, action, search }), [page, action, search]);
  const ACTIONS = ['LOGIN', 'LOGOUT', 'REGISTER', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'USER_DELETE', 'USER_SUSPENDED', 'REQUEST_CREATE', 'REQUEST_UPDATE', 'DONATION_UPDATE', 'INVENTORY_CREATE', 'INVENTORY_UPDATE', 'INVENTORY_DELETE'];
  return (
    <div>
      <PageHeader title="System Logs" subtitle="Audit trail of important actions" />
      <div className="card mb-4 grid gap-3 sm:grid-cols-2">
        <select className="input" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}><option value="">All actions</option>{ACTIONS.map((a) => <option key={a} value={a}>{titleCase(a)}</option>)}</select>
        <input className="input" placeholder="Search details or user..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No log entries" /></div> : (
        <TableWrap><table className="table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr></thead><tbody>
          {data.items.map((l: any) => <tr key={l.id}><td className="whitespace-nowrap">{fmtDateTime(l.createdAt)}</td><td>{l.user ? `${l.user.name} (${l.user.role.toLowerCase()})` : 'system'}</td><td><Badge value={l.action.includes('DELETE') || l.action.includes('REJECT') ? 'REJECTED' : 'ACTIVE'} /> <span className="ml-1 text-xs">{titleCase(l.action)}</span></td><td>{l.entity ? `${l.entity}${l.entityId ? ` #${l.entityId}` : ''}` : '-'}</td><td className="max-w-xs truncate">{l.details || '-'}</td><td className="text-xs">{l.ip || '-'}</td></tr>)}
        </tbody></table><Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} /></TableWrap>
      )}
    </div>
  );
}

export function AdminNotifications() {
  const toast = useToast();
  const { values, setValues, bind } = useForm<any>({ title: '', message: '', audience: 'ALL', userId: '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await post('/notifications', { ...values, type: 'GENERAL' }); toast.success(r._message || 'Sent'); setValues({ ...values, title: '', message: '' }); } catch (err) { toast.error(errMsg(err)); }
  };
  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Send notification" subtitle="Broadcast an announcement or message a single user" />
        <form onSubmit={submit} className="card max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Audience" {...bind('audience')}><option value="ALL">All users</option><option value="DONOR">All donors</option><option value="RECEIVER">All receivers</option><option value="HOSPITAL">All hospitals</option><option value="USER">Single user (by ID)</option></Select>
            {values.audience === 'USER' && <Input label="User ID" type="number" min={1} required {...bind('userId')} />}
          </div>
          <Input label="Title" required maxLength={150} {...bind('title')} />
          <Textarea label="Message" required maxLength={1000} {...bind('message')} />
          <button className="btn-primary">Send notification</button>
        </form>
      </div>
      <NotificationsPage />
    </div>
  );
}

export function AdminSettings() {
  const { data } = useFetch(() => get('/admin/settings'));
  return (
    <div className="space-y-8">
      <SettingsPage />
      {data && (
        <div className="max-w-3xl">
          <h2 className="mb-1 text-lg font-semibold">System rules</h2>
          <p className="mb-3 text-sm text-slate-500">Configured through environment variables on the server.</p>
          <Grid cols={3}>
            <Stat label="Min. gap between donations" value={`${data.minDonationGapDays} days`} tone="slate" />
            <Stat label="Min. donor weight" value={`${data.minDonorWeightKg} kg`} tone="slate" />
            <Stat label="Donors alerted per wave" value={data.matchBatchSize} tone="slate" />
            <Stat label="Search radius steps" value={`${data.radiusStepsKm.join(' → ')} km`} tone="slate" />
            <Stat label="Auto-expand after" value={`${data.autoExpandAfterMinutes} min`} tone="slate" />
            <Stat label="Email (SMTP)" value={data.emailConfigured ? 'Configured' : 'Not set'} tone={data.emailConfigured ? 'green' : 'amber'} hint={data.emailConfigured ? '' : 'Emails are logged to the server console'} />
          </Grid>
        </div>
      )}
    </div>
  );
}
