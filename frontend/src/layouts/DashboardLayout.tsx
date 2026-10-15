import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { get } from '../services/api';
import { getSocket } from '../services/socket';
import { Role } from '../types';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  AlertOctagon,
  Droplet,
  PackageCheck,
  BarChart3,
  Star,
  Bell,
  ScrollText,
  Settings,
  User,
  Heart,
  MessageSquare,
  Search,
  PlusCircle,
  Compass,
  Bed,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Building2,
  LucideIcon
} from 'lucide-react';
import { Badge } from '../components/ui';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/approvals', label: 'Registrations', icon: UserCheck },
    { to: '/admin/requests', label: 'Blood Requests', icon: AlertOctagon },
    { to: '/admin/donations', label: 'Donation Records', icon: Droplet },
    { to: '/admin/inventory', label: 'Blood Inventory', icon: PackageCheck },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/admin/feedback', label: 'User Feedback', icon: Star },
    { to: '/admin/notifications', label: 'Announcements', icon: Bell },
    { to: '/admin/logs', label: 'System Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ],
  DONOR: [
    { to: '/donor', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/donor/requests', label: 'Blood Requests', icon: AlertOctagon },
    { to: '/donor/history', label: 'Donation History', icon: Droplet },
    { to: '/donor/profile', label: 'My Profile', icon: User },
    { to: '/donor/health', label: 'Health & Eligibility', icon: Heart },
    { to: '/donor/chat', label: 'Live Chat', icon: MessageSquare },
    { to: '/donor/notifications', label: 'Notifications', icon: Bell },
    { to: '/donor/feedback', label: 'Leave Feedback', icon: Star },
    { to: '/donor/settings', label: 'Security Settings', icon: Settings },
  ],
  RECEIVER: [
    { to: '/receiver', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/receiver/search', label: 'Search Donors', icon: Search },
    { to: '/receiver/create-request', label: 'New Request', icon: PlusCircle },
    { to: '/receiver/requests', label: 'My Requests', icon: AlertOctagon },
    { to: '/receiver/matching', label: 'Matching Donors', icon: Compass },
    { to: '/receiver/chat', label: 'Live Chat', icon: MessageSquare },
    { to: '/receiver/notifications', label: 'Notifications', icon: Bell },
    { to: '/receiver/profile', label: 'My Profile', icon: User },
    { to: '/receiver/feedback', label: 'Feedback', icon: Star },
  ],
  HOSPITAL: [
    { to: '/hospital', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/hospital/incoming', label: 'Incoming Requests', icon: AlertOctagon },
    { to: '/hospital/requests', label: 'All Requests', icon: FileSpreadsheet },
    { to: '/hospital/patients', label: 'Patient Registry', icon: Bed },
    { to: '/hospital/donations', label: 'Donation Intake', icon: Droplet },
    { to: '/hospital/chat', label: 'Live Chat', icon: MessageSquare },
    { to: '/hospital/reports', label: 'Requirements', icon: BarChart3 },
    { to: '/hospital/profile', label: 'Hospital Profile', icon: Building2 },
    { to: '/hospital/notifications', label: 'Notifications', icon: Bell },
  ],
};

const ROLE_SUBTITLES: Record<Role, string> = {
  ADMIN: 'Admin Console',
  DONOR: 'Donor Portal',
  RECEIVER: 'Patient & Receiver Hub',
  HOSPITAL: 'Hospital Station',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () =>
      get('/notifications/unread-count')
        .then((d) => setUnread(d.unreadCount))
        .catch(() => {});
    load();
    const s = getSocket();
    const onNew = (n: any) => {
      setUnread((c) => c + 1);
      toast.info(n.title);
    };
    s?.on('notification:new', onNew);
    window.addEventListener('notifications:changed', load);
    return () => {
      s?.off('notification:new', onNew);
      window.removeEventListener('notifications:changed', load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;
  const items = NAV[user.role];
  const base = `/${user.role.toLowerCase()}`;

  const currentItem = items.find((i) =>
    i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
  );

  return (
    <div className="min-h-screen bg-[#0B0D13] flex flex-col lg:flex-row text-slate-100">
      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-slate-800/90 bg-[#0E111A] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm group-hover:bg-brand-500 transition">
              <Droplet className="h-5 w-5 fill-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-brand-400 transition">
                Blood<span className="text-brand-500">Net</span>
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {ROLE_SUBTITLES[user.role]}
              </span>
            </div>
          </Link>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-4">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>
          {items.map((i) => {
            const Icon = i.icon;
            return (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-950/70 text-brand-300 border border-brand-800/60 shadow-subtle font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-brand-400' : 'text-slate-500'
                        }`}
                      />
                      <span>{i.label}</span>
                    </div>
                    {i.to.includes('notifications') && unread > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white shadow-sm">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Card */}
        <div className="border-t border-slate-800 p-4 bg-[#090C12]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-950/80 text-brand-300 font-bold text-sm border border-brand-800/80">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{user.name}</p>
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await logout();
                nav('/login');
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/80 bg-[#0E111A]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Orientation */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-slate-400">{ROLE_SUBTITLES[user.role]}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <span className="font-bold text-white text-sm">
                {currentItem?.label || 'Portal'}
              </span>
            </div>
          </div>

          {/* Top Actions & Profile Status */}
          <div className="flex items-center gap-3">
            {/* Role-specific quick actions */}
            {user.role === 'RECEIVER' && (
              <Link
                to="/receiver/create-request"
                className="btn-primary btn-sm hidden sm:inline-flex shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Request</span>
              </Link>
            )}

            {/* Notification Bell */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#151822] text-slate-300 shadow-subtle hover:bg-slate-800 hover:text-white transition"
              onClick={() => nav(`${base}/notifications`)}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            {/* User status badge */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-400">Status:</span>
              <Badge value={user.status} />
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
