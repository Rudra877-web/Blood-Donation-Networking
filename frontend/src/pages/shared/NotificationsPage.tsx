import { useNavigate } from 'react-router-dom';
import { get, put, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { fmtDateTime } from '../../utils/format';
import { Empty, ErrorBox, Loading, PageHeader } from '../../components/ui';
import { useEffect } from 'react';
import { getSocket } from '../../services/socket';

const ICON: Record<string, string> = {
  REGISTRATION_APPROVED: '✅', REGISTRATION_REJECTED: '⛔', BLOOD_REQUEST_ALERT: '🆘', DONOR_ACCEPTED: '🤝',
  HOSPITAL_APPROVED: '🏥', REQUEST_COMPLETED: '🎉', GENERAL: '🔔',
};

export default function NotificationsPage() {
  const toast = useToast();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => get('/notifications'));

  useEffect(() => {
    const s = getSocket();
    s?.on('notification:new', reload);
    return () => { s?.off('notification:new', reload); };
  }, [reload]);

  const changed = () => window.dispatchEvent(new Event('notifications:changed'));
  const open = async (n: any) => {
    try {
      if (!n.isRead) { await put(`/notifications/${n.id}/read`); changed(); reload(); }
      if (n.data?.requestId && user) nav(`/${user.role.toLowerCase()}/requests/${n.data.requestId}`);
    } catch (e) { toast.error(errMsg(e)); }
  };
  const readAll = async () => { try { await put('/notifications/read-all'); changed(); reload(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <div>
      <PageHeader title="Notifications" subtitle={data ? `${data.unreadCount} unread` : ''} actions={<button className="btn-outline" onClick={readAll} disabled={!data?.unreadCount}>Mark all as read</button>} />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data!.items.length ? <div className="card"><Empty title="No notifications" /></div> : (
        <div className="space-y-2">
          {data!.items.map((n: any) => (
            <button key={n.id} onClick={() => open(n)} className={`card flex w-full items-start gap-3 text-left transition hover:shadow ${n.isRead ? 'opacity-70' : 'border-l-4 border-l-brand-600'}`}>
              <span className="text-2xl">{ICON[n.type] || '🔔'}</span>
              <span className="flex-1"><span className="block font-semibold text-slate-900">{n.title}</span><span className="block text-sm text-slate-600">{n.message}</span><span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span></span>
              {!n.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
