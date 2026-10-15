import { FormEvent, useState } from 'react';
import { del, errMsg, get, post } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import {
  Badge,
  Confirm,
  Empty,
  ErrorBox,
  Grid,
  Input,
  Loading,
  PageHeader,
  Pager,
  Select,
  Stat,
  TableWrap,
  Textarea
} from '../../components/ui';
import { Stars } from '../shared/FeedbackPage';
import NotificationsPage from '../shared/NotificationsPage';
import SettingsPage from '../shared/SettingsPage';
import { fmtDate, fmtDateTime, titleCase } from '../../utils/format';
import {
  Star,
  ScrollText,
  Bell,
  Settings,
  Send,
  Trash2,
  Search,
  ShieldAlert,
  Server,
  Mail,
  Sliders
} from 'lucide-react';

export function AdminFeedback() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => get('/feedback'));
  const [toDelete, setToDelete] = useState<any>(null);

  const remove = async () => {
    try {
      await del('/feedback/' + toDelete.id);
      toast.success('Feedback review deleted');
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (loading) return <Loading text="Loading feedback reviews..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const s = data.stats;
  const max = Math.max(1, ...s.distribution.map((d: any) => d.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Experience Reviews"
        subtitle="Feedback and rating reviews submitted by voluntary donors, attendants, and hospital staff."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Stat
          label="Average Platform Rating"
          value={`${s.average} / 5`}
          icon={Star}
          tone="amber"
        />
        <Stat
          label="Total Reviews Submitted"
          value={s.total}
          icon={ScrollText}
          tone="blue"
        />
        <div className="card p-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Rating Distribution
          </p>
          {s.distribution.map((d: any) => (
            <div key={d.rating} className="flex items-center gap-2.5 text-xs">
              <span className="w-7 font-bold text-slate-300">{d.rating}★</span>
              <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-semibold text-slate-400">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {!data.items.length ? (
        <div className="card">
          <Empty title="No user feedback submitted yet" />
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((f: any) => (
            <div key={f.id} className="card p-5 flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars value={f.rating} />
                  <span className="text-sm font-bold text-white">{f.user.name}</span>
                  <span className="text-xs text-slate-400 font-medium">
                    ({f.user.role.toLowerCase()}) · {fmtDate(f.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {f.comment}
                </p>
              </div>
              <button
                className="btn-danger btn-sm shrink-0"
                onClick={() => setToDelete(f)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Confirm
        open={!!toDelete}
        danger
        title="Delete User Feedback"
        message="Permanently remove this review from the public system summary?"
        confirmText="Delete Review"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}

export function AdminLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useFetch(
    () => get('/admin/logs', { page, limit: 25, action, search }),
    [page, action, search]
  );

  const ACTIONS = [
    'LOGIN',
    'LOGOUT',
    'REGISTER',
    'REGISTRATION_APPROVED',
    'REGISTRATION_REJECTED',
    'USER_DELETE',
    'USER_SUSPENDED',
    'REQUEST_CREATE',
    'REQUEST_UPDATE',
    'DONATION_UPDATE',
    'INVENTORY_CREATE',
    'INVENTORY_UPDATE',
    'INVENTORY_DELETE',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Security & Audit Trail"
        subtitle="Immutable log of authentication, moderation, and data mutation actions."
      />

      <div className="card p-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Filter By Action</label>
          <select
            className="input"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Audited Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {titleCase(a)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Search Details or User</label>
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Filter by keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading system audit logs..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty title="No log entries found" />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User Actor</th>
                <th>Action Type</th>
                <th>Entity Affected</th>
                <th>Mutation Details</th>
                <th>Client IP</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((l: any) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-xs text-slate-400 font-medium">
                    {fmtDateTime(l.createdAt)}
                  </td>
                  <td className="font-semibold text-xs text-white">
                    {l.user ? `${l.user.name} (${l.user.role.toLowerCase()})` : 'System Engine'}
                  </td>
                  <td>
                    <Badge
                      value={
                        l.action.includes('DELETE') || l.action.includes('REJECT')
                          ? 'REJECTED'
                          : 'ACTIVE'
                      }
                    />{' '}
                    <span className="ml-1 text-xs font-semibold text-slate-300">
                      {titleCase(l.action)}
                    </span>
                  </td>
                  <td className="text-xs font-mono text-slate-400">
                    {l.entity ? `${l.entity}${l.entityId ? ` #${l.entityId}` : ''}` : '-'}
                  </td>
                  <td className="max-w-xs truncate text-xs text-slate-300">{l.details || '-'}</td>
                  <td className="text-[11px] font-mono text-slate-400">{l.ip || '-'}</td>
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

export function AdminNotifications() {
  const toast = useToast();
  const { values, setValues, bind } = useForm<any>({
    title: '',
    message: '',
    audience: 'ALL',
    userId: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await post('/notifications', { ...values, type: 'GENERAL' });
      toast.success(r._message || 'Broadcast notification dispatched');
      setValues({ ...values, title: '', message: '' });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <PageHeader
          title="Send Broadcast Notification"
          subtitle="Dispatch announcements or direct administrative notices to users."
        />

        <form onSubmit={submit} className="card max-w-2xl p-6 sm:p-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Target Audience" {...bind('audience')}>
              <option value="ALL">All Network Members (Global)</option>
              <option value="DONOR">All Voluntary Donors</option>
              <option value="RECEIVER">All Receivers & Attendants</option>
              <option value="HOSPITAL">All Partner Hospitals</option>
              <option value="USER">Specific User (By User ID)</option>
            </Select>

            {values.audience === 'USER' && (
              <Input label="Target User ID" type="number" min={1} required {...bind('userId')} />
            )}
          </div>

          <Input
            label="Announcement Title"
            required
            maxLength={150}
            placeholder="e.g. Critical Blood Drive in Central District"
            {...bind('title')}
          />

          <Textarea
            label="Notification Message Body"
            required
            maxLength={1000}
            placeholder="Enter full announcement details..."
            {...bind('message')}
          />

          <button type="submit" disabled={busy} className="btn-primary flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span>{busy ? 'Sending...' : 'Dispatch Notification'}</span>
          </button>
        </form>
      </div>

      <div className="border-t border-slate-800 pt-8">
        <NotificationsPage />
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { data } = useFetch(() => get('/admin/settings'));

  return (
    <div className="space-y-10">
      <SettingsPage />

      {data && (
        <div className="max-w-3xl space-y-4">
          <div className="pb-2 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brand-400" />
              <span>Platform Clinical Rules & Matching Parameters</span>
            </h2>
            <p className="text-xs text-slate-400">
              Configured via environment variables on the backend server.
            </p>
          </div>

          <Grid cols={3}>
            <Stat
              label="Minimum Donation Interval"
              value={`${data.minDonationGapDays} days`}
              hint="Required donor recovery period"
              tone="slate"
            />
            <Stat
              label="Minimum Donor Weight"
              value={`${data.minDonorWeightKg} kg`}
              hint="Clinical safety threshold"
              tone="slate"
            />
            <Stat
              label="Alert Batch Size"
              value={data.matchBatchSize}
              hint="Donors notified per wave"
              tone="slate"
            />
            <Stat
              label="Radius Steps (km)"
              value={`${data.radiusStepsKm.join(' → ')}`}
              hint="Proximity search thresholds"
              tone="slate"
            />
            <Stat
              label="Auto-Expand Window"
              value={`${data.autoExpandAfterMinutes} min`}
              hint="Expands radius if unfulfilled"
              tone="slate"
            />
            <Stat
              label="SMTP Email Service"
              value={data.emailConfigured ? 'Active' : 'Console Log'}
              tone={data.emailConfigured ? 'green' : 'amber'}
              hint={
                data.emailConfigured
                  ? 'Production mailer connected'
                  : 'Development mode (emails printed in console)'
              }
            />
          </Grid>
        </div>
      )}
    </div>
  );
}
