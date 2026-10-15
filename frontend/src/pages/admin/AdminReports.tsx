import { useState } from 'react';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { ErrorBox, Grid, Loading, PageHeader, Stat, TableWrap } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDateTime, titleCase } from '../../utils/format';
import { Download, BarChart3, Calendar, RefreshCw } from 'lucide-react';

const TYPES = [
  ['donations', 'Donation Records'],
  ['requests', 'Blood Requests'],
  ['users', 'User Accounts'],
  ['inventory', 'Blood Inventory'],
  ['demand', 'Blood Group Demand'],
  ['hospitals', 'Hospital Activity'],
];

function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="card p-6 space-y-4">
      <div className="pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {!entries.length ? (
        <p className="text-xs text-slate-400 py-3">No activity recorded in this period.</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 truncate font-medium text-slate-300">
                {titleCase(k)}
              </span>
              <div className="h-3 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${(v / max) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right font-bold text-white">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReports() {
  const [type, setType] = useState('donations');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading, error, reload } = useFetch(
    () => get('/reports', { type, from, to }),
    [type, from, to]
  );

  const cell = (k: string, v: any) => (k === 'bloodGroup' ? bg(v) : String(v ?? '-'));

  const exportCsv = () => {
    if (!data?.table) return;
    const keys = Object.keys(data.table[0] || {});
    const csv = [
      keys.join(','),
      ...data.table.map((r: any) => keys.map((k) => JSON.stringify(cell(k, r[k]))).join(',')),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${type}-report.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & System Analytics"
        subtitle="Dynamic business intelligence generated live from the platform database."
        actions={
          data?.table && (
            <button className="btn-outline flex items-center gap-1.5" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          )
        }
      />

      {/* Control Filter Bar */}
      <div className="card p-4 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Report Category</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">From Date</label>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From date"
          />
        </div>
        <div>
          <label className="label">To Date</label>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To date"
          />
        </div>
        <div className="flex items-end">
          <button className="btn-outline w-full flex items-center justify-center gap-1.5" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {loading ? (
        <Loading text="Compiling report analytics..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <>
          <p className="text-xs text-slate-400">
            Generated {fmtDateTime(data.generatedAt)} · Default timeframe is the last 180 days.
          </p>

          {/* Key Metric Cards */}
          <Grid cols={4}>
            {Object.entries(data.summary).map(([k, v]: any) => (
              <Stat
                key={k}
                label={titleCase(k.replace(/([A-Z])/g, ' $1'))}
                value={
                  Array.isArray(v)
                    ? v.length
                      ? v.map(bg).join(', ')
                      : 'None'
                    : k === 'fulfilmentRate'
                    ? `${v}%`
                    : k === 'mostDemanded'
                    ? bg(v)
                    : v ?? '-'
                }
                tone="slate"
              />
            ))}
          </Grid>

          {/* Visual Bar Charts */}
          {data.breakdowns && (
            <div className="grid gap-6 lg:grid-cols-2">
              {Object.entries(data.breakdowns).map(([k, v]: any) => (
                <Bars key={k} title={titleCase(k.replace(/([A-Z])/g, ' $1'))} data={v} />
              ))}
            </div>
          )}

          {/* Data Table */}
          {data.table &&
            (data.table.length ? (
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      {Object.keys(data.table[0]).map((k) => (
                        <th key={k}>{titleCase(k.replace(/([A-Z])/g, ' $1'))}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.table.map((r: any, i: number) => (
                      <tr key={i}>
                        {Object.entries(r).map(([k, v]) => (
                          <td key={k} className="text-xs text-slate-300">
                            {cell(k, v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <div className="card text-xs text-slate-400 py-6 text-center">
                No records found matching this timeframe.
              </div>
            ))}
        </>
      )}
    </div>
  );
}
