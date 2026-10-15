import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { Badge, BloodTag, ErrorBox, Grid, Loading, PageHeader, Stat } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDateTime, titleCase } from '../../utils/format';
import {
  Users,
  Heart,
  Building2,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Droplet,
  PackageCheck,
  ArrowRight,
  ShieldAlert,
  Activity,
  History
} from 'lucide-react';

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => get('/admin/dashboard'));

  if (loading) return <Loading text="Loading admin telemetry..." />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const t = data.totals;
  const totalStockUnits = data.inventory.reduce((s: number, i: any) => s + i.units, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration Dashboard"
        subtitle="Network overview, registration approval queues, live inventory, and system telemetry."
        actions={
          t.pendingRegistrations > 0 ? (
            <Link
              to="/admin/approvals"
              className="btn-primary flex items-center gap-2 shadow-sm animate-pulse"
            >
              <Clock className="h-4 w-4" />
              <span>{t.pendingRegistrations} Pending Registration(s)</span>
            </Link>
          ) : undefined
        }
      />

      <Grid cols={4}>
        <Stat
          label="Voluntary Donors"
          value={t.donors}
          icon={Heart}
          tone="red"
        />
        <Stat
          label="Receivers / Patients"
          value={t.receivers}
          icon={Users}
          tone="blue"
        />
        <Stat
          label="Partner Hospitals"
          value={t.hospitals}
          icon={Building2}
          tone="green"
        />
        <Stat
          label="Pending Approvals"
          value={t.pendingRegistrations}
          hint={t.pendingRegistrations > 0 ? 'Action required in registrations queue' : 'Queue cleared'}
          icon={Clock}
          tone="amber"
        />
        <Stat
          label="Active Requests"
          value={t.activeRequests}
          icon={AlertOctagon}
          tone="red"
        />
        <Stat
          label="Completed Requests"
          value={t.completedRequests}
          icon={CheckCircle2}
          tone="green"
        />
        <Stat
          label="Total Donations"
          value={t.totalDonations}
          icon={Droplet}
          tone="blue"
        />
        <Stat
          label="Total Stock Units"
          value={totalStockUnits}
          hint="Across all 8 blood groups"
          icon={PackageCheck}
          tone="slate"
        />
      </Grid>

      {/* Blood Inventory Summary */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Central Blood Inventory Summary</h2>
            <p className="text-xs text-slate-400">Live reserves aggregated across connected blood banks</p>
          </div>
          <Link to="/admin/inventory" className="btn-outline btn-sm flex items-center gap-1.5">
            <span>Manage Inventory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.inventory.map((i: any) => (
            <div
              key={i.bloodGroup}
              className="rounded-xl border border-slate-800 bg-[#0E111A] p-3.5 text-center transition hover:border-slate-700 hover:shadow-subtle"
            >
              <div className="flex justify-center">
                <BloodTag value={i.bloodGroup} />
              </div>
              <p className="mt-2 text-xl font-extrabold text-white">{i.units}</p>
              <p className="text-[11px] text-slate-400 mb-2">units</p>
              <Badge value={i.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Split Grid: Recent Requests & Audit Stream */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Requests */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Recent Blood Requests</h2>
            <Link to="/admin/requests" className="text-xs font-bold text-brand-400 hover:underline">
              View All →
            </Link>
          </div>

          {!data.recentRequests.length ? (
            <p className="text-xs text-slate-400 py-4 text-center">No blood requests recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {data.recentRequests.map((r: any) => (
                <Link
                  key={r.id}
                  to={`/admin/requests/${r.id}`}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-800/40 rounded-lg px-2 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <BloodTag value={r.bloodGroup} size="sm" />
                    <span className="font-bold text-white group-hover:text-brand-400 transition">
                      {r.patientName}
                    </span>
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

        {/* Audit Log Stream */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Recent System Activity</h2>
            <Link to="/admin/logs" className="text-xs font-bold text-brand-400 hover:underline">
              Full Audit Trail →
            </Link>
          </div>

          {!data.recentActivities.length ? (
            <p className="text-xs text-slate-400 py-4 text-center">No system actions recorded.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {data.recentActivities.map((l: any) => (
                <div key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white">{titleCase(l.action)}</span>
                    <span className="text-slate-400 ml-1.5">
                      by {l.user?.name || 'System Engine'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {fmtDateTime(l.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
