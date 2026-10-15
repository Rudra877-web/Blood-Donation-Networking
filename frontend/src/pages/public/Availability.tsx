import { useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { bg } from '../../utils/constants';
import { Badge, BloodTag, ErrorBox, Loading } from '../../components/ui';
import { Activity, Droplet, Search, ShieldCheck, ArrowRight, HeartHandshake } from 'lucide-react';

export default function Availability() {
  const { data, loading, error, reload } = useFetch(() => get('/public/availability'));
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const filtered = (data || []).filter((item: any) =>
    selectedGroup ? item.bloodGroup === selectedGroup : true
  );

  const totalUnits = (data || []).reduce((acc: number, curr: any) => acc + (curr.units || 0), 0);
  const lowCount = (data || []).filter((x: any) => x.status === 'LOW').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-950/50 border border-brand-900/60 px-3 py-1 text-xs font-semibold text-brand-300 mb-2">
            <Activity className="h-3.5 w-3.5 text-brand-400" />
            <span>Real-time Blood Bank Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Live Blood Inventory Status
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Live stock counts across verified network blood banks and participating hospitals. Units marked expired or reserved for admitted patients are automatically excluded.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/register" className="btn-primary shadow-sm">
            Request Blood
          </Link>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Available Units
          </span>
          <p className="mt-2 text-3xl font-extrabold text-white">{totalUnits}</p>
          <p className="mt-1 text-xs text-slate-400">Across all 8 blood groups</p>
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Low Stock Alerts
          </span>
          <p className="mt-2 text-3xl font-extrabold text-orange-400">{lowCount}</p>
          <p className="mt-1 text-xs text-slate-400">Groups requiring urgent voluntary donors</p>
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Network Hospitals
          </span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">Active</p>
          <p className="mt-1 text-xs text-slate-400">Centralized verified inventory sync</p>
        </div>
      </div>

      {/* Main Stock Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg font-bold text-white">Current Blood Group Stock</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="bg-filter" className="text-xs font-semibold text-slate-400 uppercase">
              Filter Group:
            </label>
            <select
              id="bg-filter"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="input w-auto py-1.5 text-xs font-medium"
            >
              <option value="" className="bg-[#151822] text-white">All 8 Blood Groups</option>
              {(data || []).map((x: any) => (
                <option key={x.bloodGroup} value={x.bloodGroup} className="bg-[#151822] text-white">
                  {bg(x.bloodGroup)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loading text="Loading blood availability data..." />
        ) : error ? (
          <ErrorBox message={error} onRetry={reload} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {filtered.map((x: any) => {
              const isLow = x.status === 'LOW';
              return (
                <div
                  key={x.bloodGroup}
                  className={`card text-center p-6 flex flex-col justify-between transition hover:border-slate-700 ${
                    isLow ? 'border-orange-800/60 bg-orange-950/20' : 'hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-center">
                      <BloodTag value={x.bloodGroup} size="lg" />
                    </div>
                    <p className="mt-4 text-4xl font-black text-white tracking-tight">
                      {x.units}
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-1">units currently in stock</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Stock Status</span>
                    <Badge value={x.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compatibility Matrix Guide */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-950/60 text-blue-400 border border-blue-900/60">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Blood Group Compatibility Quick Guide</h3>
            <p className="text-xs text-slate-400">Universal rules applied in our automated matching algorithm</p>
          </div>
        </div>

        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="rounded-xl border border-slate-800 p-3 bg-[#0E111A]">
            <span className="font-bold text-slate-100 block text-sm">O Negative (O-)</span>
            <p className="text-slate-400 mt-1">Universal Red Blood Cell donor. Can give to any blood group in severe emergencies.</p>
          </div>
          <div className="rounded-xl border border-slate-800 p-3 bg-[#0E111A]">
            <span className="font-bold text-slate-100 block text-sm">AB Positive (AB+)</span>
            <p className="text-slate-400 mt-1">Universal recipient. Can safely receive red blood cells from any blood group.</p>
          </div>
          <div className="rounded-xl border border-slate-800 p-3 bg-[#0E111A]">
            <span className="font-bold text-slate-100 block text-sm">O Positive (O+)</span>
            <p className="text-slate-400 mt-1">Most common blood type. Can donate to O+, A+, B+, and AB+ recipients.</p>
          </div>
          <div className="rounded-xl border border-slate-800 p-3 bg-[#0E111A]">
            <span className="font-bold text-slate-100 block text-sm">A / B Types</span>
            <p className="text-slate-400 mt-1">Compatible with identical types and AB patients. Matched strictly by compatibility rules.</p>
          </div>
        </div>
      </div>

      {/* Assistance Card */}
      <div className="rounded-2xl border border-brand-900/60 bg-brand-950/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-bold text-brand-300">Cannot find enough units in the blood bank?</h4>
          <p className="text-xs text-slate-300">
            Post an emergency blood request. Our automated matching system will instantly notify voluntary donors living within range.
          </p>
        </div>
        <Link to="/register" className="btn-primary shrink-0 shadow-sm">
          Post Urgent Request
        </Link>
      </div>
    </div>
  );
}
