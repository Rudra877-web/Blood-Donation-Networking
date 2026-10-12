import { useState } from 'react';
import { Link } from 'react-router-dom';
import { del, errMsg, get, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { Badge, BloodSelect, BloodTag, Confirm, Empty, ErrorBox, Loading, OptionList, PageHeader, Pager, TableWrap } from '../../components/ui';
import { REQUEST_STATUSES, URGENCIES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';

export default function AdminRequests() {
  const toast = useToast();
  const [f, setF] = useState({ bloodGroup: '', urgency: '', status: '', search: '' });
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/requests', { ...f, page, limit: 15 }), [f, page]);
  const [toDelete, setToDelete] = useState<any>(null);
  const upd = (k: string) => (e: any) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const setStatus = async (id: number, status: string) => { try { await put(`/requests/${id}/status`, { status }); toast.success('Status updated'); reload(); } catch (e) { toast.error(errMsg(e)); } };
  const remove = async () => { try { await del('/requests/' + toDelete.id); toast.success('Request deleted'); setToDelete(null); reload(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <div>
      <PageHeader title="Blood Requests" subtitle="All requests in the network" />
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" placeholder="Search patient..." value={f.search} onChange={upd('search')} />
        <BloodSelect all label="" value={f.bloodGroup} onChange={upd('bloodGroup')} />
        <select className="input" value={f.urgency} onChange={upd('urgency')}><OptionList values={URGENCIES} placeholder="All urgency levels" /></select>
        <select className="input" value={f.status} onChange={upd('status')}><OptionList values={REQUEST_STATUSES} placeholder="All statuses" /></select>
      </div>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No requests match" /></div> : (
        <TableWrap>
          <table className="table">
            <thead><tr><th>#</th><th>Patient</th><th>Blood</th><th>Units</th><th>Hospital</th><th>Urgency</th><th>Status</th><th>Required</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{data.items.map((r: any) => (
              <tr key={r.id}>
                <td>{r.id}</td><td><p className="font-medium">{r.patientName}</p><p className="text-xs text-slate-500">by {r.receiver.user.name}</p></td>
                <td><BloodTag value={r.bloodGroup} /></td><td>{r.units}</td><td>{r.hospital?.user.name || '-'}</td><td><Badge value={r.urgency} /></td><td><Badge value={r.status} /></td><td>{fmtDate(r.requiredDate)}</td>
                <td><div className="flex justify-end gap-1">
                  <Link className="btn-outline btn-sm" to={`/admin/requests/${r.id}`}>View</Link>
                  <select className="input w-auto py-1 text-xs" value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} aria-label="Update status"><OptionList values={REQUEST_STATUSES} /></select>
                  <button className="btn-danger btn-sm" onClick={() => setToDelete(r)}>Delete</button>
                </div></td>
              </tr>))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}
      <Confirm open={!!toDelete} danger title="Delete request" message={`Delete request #${toDelete?.id} for ${toDelete?.patientName}? Tip: use status "Cancelled" to keep a record.`} confirmText="Delete" onCancel={() => setToDelete(null)} onConfirm={remove} />
    </div>
  );
}
