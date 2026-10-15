import { useNavigate } from 'react-router-dom';
import { get, put, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { fmtDateTime } from '../../utils/format';
import { Empty, ErrorBox, Loading, PageHeader } from '../../components/ui';
import { useEffect } from 'react';
import { getSocket } from '../../services/socket';
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Heart,
  Building2,
  Sparkles,
  CheckCheck,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
  REGISTRATION_APPROVED: { icon: CheckCircle2, bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-400' },
  REGISTRATION_REJECTED: { icon: XCircle, bg: 'bg-red-950/60 border-red-800/60', text: 'text-red-400' },
  BLOOD_REQUEST_ALERT: { icon: AlertOctagon, bg: 'bg-brand-950/60 border-brand-800/60', text: 'text-brand-400' },
  DONOR_ACCEPTED: { icon: Heart, bg: 'bg-brand-950/60 border-brand-800/60', text: 'text-brand-400' },
  HOSPITAL_APPROVED: { icon: Building2, bg: 'bg-blue-950/60 border-blue-800/60', text: 'text-blue-400' },
  REQUEST_COMPLETED: { icon: Sparkles, bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-400' },
  GENERAL: { icon: Bell, bg: 'bg-slate-800/80 border-slate-700/80', text: 'text-slate-300' },
};

export default function NotificationsPage() {
  const toast = useToast();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => get('/notifications'));

  useEffect(() => {
    const s = getSocket();
    s?.on('notification:new', reload);
    return () => {
      s?.off('notification:new', reload);
    };
  }, [reload]);

  const changed = () => window.dispatchEvent(new Event('notifications:changed'));

  const open = async (n: any) => {
    try {
      if (!n.isRead) {
        await put(`/notifications/${n.id}/read`);
        changed();
        reload();
      }
      if (n.data?.requestId && user) {
        nav(`/${user.role.toLowerCase()}/requests/${n.data.requestId}`);
      }
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const readAll = async () => {
    try {
      await put('/notifications/read-all');
      changed();
      reload();
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications Center"
        subtitle={data ? `${data.unreadCount} unread notification(s)` : ''}
        actions={
          <button
            className="btn-outline flex items-center gap-1.5"
            onClick={readAll}
            disabled={!data?.unreadCount}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark All as Read</span>
          </button>
        }
      />

      {loading ? (
        <Loading text="Loading notifications..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data!.items.length ? (
        <div className="card">
          <Empty
            icon={Bell}
            title="No notifications"
            hint="You will receive alerts here when matching requests, approvals, or messages arrive."
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {data!.items.map((n: any) => {
            const conf = ICON_MAP[n.type] || ICON_MAP.GENERAL;
            const Icon = conf.icon;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`card p-4 flex w-full items-start gap-4 text-left transition hover:border-slate-700 ${
                  n.isRead
                    ? 'opacity-60 bg-[#121520] border-slate-800/60'
                    : 'border-l-4 border-l-brand-500 bg-[#151822] border-slate-800 shadow-card'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${conf.bg} ${conf.text}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-white truncate">{n.title}</span>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="mt-1.5 block text-[11px] font-medium text-slate-400">
                    {fmtDateTime(n.createdAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
