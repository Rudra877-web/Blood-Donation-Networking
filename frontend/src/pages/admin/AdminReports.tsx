import { useState } from 'react';
import { get } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { ErrorBox, Grid, Loading, PageHeader, Stat, TableWrap } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDateTime, titleCase } from '../../utils/format';

const TYPES = [['donations', 'Donations'], ['requests', 'Blood requests'], ['users', 'Users'], ['inventory', 'Blood inventory'], ['demand', 'Blood group demand'], ['hospitals', 'Hospital activity']];

function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="card">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {!entries.length ? <p className="text-sm text-slate-500">No data in this period.</p> : entries.map(([k, v]) => (
        <div key={k} className="mb-2 flex items-center gap-3 text-sm"><span className="w-28 shrink-0 truncate text-slate-600">{titleCase(k)}</span>
          <div className="h-3 flex-1 rounded bg-slate-100"><div className="h-3 rounded bg-brand-600" style={{ width: `${(v / max) * 100}%` }} /></div><span className="w-8 text-right font-medium">{v}</span></div>
      ))}
    </div>
  );
}

export default function AdminReports() {
  const [type, setType] = useState('donations');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading, error, reload } = useFetch(() => get('/reports', { type, from, to }), [type, from, to]);

  const cell = (k: string, v: any) => (k === 'bloodGroup' ? bg(v) : String(v ?? '-'));
  const exportCsv = () => {
    if (!data?.table) return;
    const keys = Object.keys(data.table[0] || {});
    const csv = [keys.join(','), ...data.table.map((r: any) => keys.map((k) => JSON.stringify(cell(k, r[k]))).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${type}-report.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Generated live from the database" actions={data?.table && <button className="btn-outline" onClick={exportCsv}>Export CSV</button>} />
      <div className="card grid gap-3 sm:grid-cols-4">
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <div><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" /></div>
        <div><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" /></div>
        <button className="btn-outline" onClick={reload}>Refresh</button>
      </div>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : (<>
        <p className="text-xs text-slate-400">Generated {fmtDateTime(data.generatedAt)} (default range: last 180 days)</p>
        <Grid cols={4}>{Object.entries(data.summary).map(([k, v]: any) => <Stat key={k} label={titleCase(k.replace(/([A-Z])/g, ' $1'))} value={Array.isArray(v) ? (v.length ? v.map(bg).join(', ') : 'None') : k === 'fulfilmentRate' ? `${v}%` : k === 'mostDemanded' ? bg(v) : v ?? '-'} tone="slate" />)}</Grid>
        {data.breakdowns && <div className="grid gap-4 lg:grid-cols-2">{Object.entries(data.breakdowns).map(([k, v]: any) => <Bars key={k} title={titleCase(k.replace(/([A-Z])/g, ' $1'))} data={v} />)}</div>}
        {data.table && (data.table.length ? <TableWrap><table className="table"><thead><tr>{Object.keys(data.table[0]).map((k) => <th key={k}>{titleCase(k.replace(/([A-Z])/g, ' $1'))}</th>)}</tr></thead><tbody>
          {data.table.map((r: any, i: number) => <tr key={i}>{Object.entries(r).map(([k, v]) => <td key={k}>{cell(k, v)}</td>)}</tr>)}</tbody></table></TableWrap> : <div className="card text-sm text-slate-500">No rows.</div>)}
      </>)}
    </div>
  );
}
