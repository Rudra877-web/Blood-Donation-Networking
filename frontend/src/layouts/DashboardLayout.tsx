import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { get } from '../services/api';
import { getSocket } from '../services/socket';
import { Role } from '../types';

const NAV: Record<Role, { to: string; label: string; icon: string; end?: boolean }[]> = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true }, { to: '/admin/users', label: 'User Management', icon: '👥' },
    { to: '/admin/approvals', label: 'Approvals', icon: '✅' }, { to: '/admin/requests', label: 'Blood Requests', icon: '🆘' },
    { to: '/admin/donations', label: 'Donations', icon: '💉' }, { to: '/admin/inventory', label: 'Blood Inventory', icon: '🩸' },
    { to: '/admin/reports', label: 'Reports', icon: '📈' }, { to: '/admin/feedback', label: 'Feedback', icon: '⭐' },
    { to: '/admin/notifications', label: 'Notifications', icon: '🔔' }, { to: '/admin/logs', label: 'System Logs', icon: '📜' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ],
  DONOR: [
    { to: '/donor', label: 'Dashboard', icon: '📊', end: true }, { to: '/donor/profile', label: 'Profile', icon: '👤' },
    { to: '/donor/health', label: 'Health Information', icon: '❤️' }, { to: '/donor/requests', label: 'Blood Requests', icon: '🆘' },
    { to: '/donor/chat', label: 'Chat', icon: '💬' }, { to: '/donor/notifications', label: 'Notifications', icon: '🔔' }, { to: '/donor/history', label: 'Donation History', icon: '💉' },
    { to: '/donor/feedback', label: 'Feedback', icon: '⭐' }, { to: '/donor/settings', label: 'Settings', icon: '⚙️' },
  ],
  RECEIVER: [
    { to: '/receiver', label: 'Dashboard', icon: '📊', end: true }, { to: '/receiver/search', label: 'Search Blood', icon: '🔍' },
    { to: '/receiver/create-request', label: 'Create Request', icon: '➕' }, { to: '/receiver/requests', label: 'My Requests', icon: '🆘' },
    { to: '/receiver/matching', label: 'Matching Donors', icon: '🤝' }, { to: '/receiver/chat', label: 'Chat', icon: '💬' },
    { to: '/receiver/notifications', label: 'Notifications', icon: '🔔' }, { to: '/receiver/feedback', label: 'Feedback', icon: '⭐' },
    { to: '/receiver/profile', label: 'Profile', icon: '👤' },
  ],
  HOSPITAL: [
    { to: '/hospital', label: 'Dashboard', icon: '📊', end: true }, { to: '/hospital/incoming', label: 'Incoming Requests', icon: '📥' },
    { to: '/hospital/patients', label: 'Patients', icon: '🛏️' }, { to: '/hospital/donations', label: 'Donations', icon: '💉' },
    { to: '/hospital/requests', label: 'Request Management', icon: '🗂️' }, { to: '/hospital/chat', label: 'Chat', icon: '💬' },
    { to: '/hospital/reports', label: 'Reports', icon: '📈' }, { to: '/hospital/profile', label: 'Profile', icon: '🏥' },
    { to: '/hospital/notifications', label: 'Notifications', icon: '🔔' },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => get('/notifications/unread-count').then((d) => setUnread(d.unreadCount)).catch(() => {});
    load();
    const s = getSocket();
    const onNew = (n: any) => { setUnread((c) => c + 1); toast.info(n.title); };
    s?.on('notification:new', onNew);
    window.addEventListener('notifications:changed', load);
    return () => { s?.off('notification:new', onNew); window.removeEventListener('notifications:changed', load); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;
  const items = NAV[user.role];
  const base = `/${user.role.toLowerCase()}`;

  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 text-lg font-bold text-brand-700">🩸 BloodNet</Link>
        <nav className="space-y-1 overflow-y-auto p-3" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <span>{i.icon}</span>{i.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <button className="rounded-lg p-2 text-xl hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <div className="hidden text-sm text-slate-500 lg:block">Signed in as <span className="font-medium text-slate-800">{user.name}</span> · {user.role.toLowerCase()}</div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-xl hover:bg-slate-100" onClick={() => nav(`${base}/notifications`)} aria-label="Notifications">
              🔔{unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
            </button>
            <button className="btn-outline btn-sm" onClick={async () => { await logout(); nav('/login'); }}>Logout</button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
