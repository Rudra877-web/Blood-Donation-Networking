import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { Badge, BloodTag, ErrorBox, Grid, Loading, PageHeader, Stat } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDateTime, titleCase } from '../../utils/format';

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => get('/admin/dashboard'));
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const t = data.totals;
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Live overview of the network" />
      <Grid>
        <Stat label="Total donors" value={t.donors} />
        <Stat label="Total receivers" value={t.receivers} tone="blue" />
        <Stat label="Total hospitals" value={t.hospitals} tone="green" />
        <Stat label="Pending registrations" value={t.pendingRegistrations} tone="amber" hint="Awaiting approval" />
        <Stat label="Active requests" value={t.activeRequests} />
        <Stat label="Completed requests" value={t.completedRequests} tone="green" />
        <Stat label="Total donations" value={t.totalDonations} tone="blue" />
        <Stat label="Units in stock" value={data.inventory.reduce((s: number, i: any) => s + i.units, 0)} tone="slate" />
      </Grid>

      <div className="card">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Blood inventory summary</h2><Link to="/admin/inventory" className="text-sm text-brand-700 hover:underline">Manage</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.inventory.map((i: any) => (
            <div key={i.bloodGroup} className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-xl font-extrabold text-brand-600">{bg(i.bloodGroup)}</p><p className="text-sm font-medium">{i.units} units</p><Badge value={i.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Recent requests</h2>
          {!data.recentRequests.length ? <p className="text-sm text-slate-500">No requests yet.</p> : data.recentRequests.map((r: any) => (
            <Link key={r.id} to={`/admin/requests/${r.id}`} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 hover:bg-slate-50">
              <span className="flex items-center gap-2"><BloodTag value={r.bloodGroup} />{r.patientName}</span><span className="flex gap-2"><Badge value={r.urgency} /><Badge value={r.status} /></span>
            </Link>
          ))}
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Recent activities</h2>
          {!data.recentActivities.length ? <p className="text-sm text-slate-500">No activity yet.</p> : data.recentActivities.map((l: any) => (
            <div key={l.id} className="border-b border-slate-100 py-2 text-sm last:border-0"><span className="font-medium">{titleCase(l.action)}</span> <span className="text-slate-500">by {l.user?.name || 'system'}</span><span className="block text-xs text-slate-400">{fmtDateTime(l.createdAt)}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
