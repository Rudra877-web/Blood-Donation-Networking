import { useState } from 'react';
import { Link } from 'react-router-dom';
import { del, errMsg, get, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import {
  Badge,
  BloodSelect,
  BloodTag,
  Confirm,
  Empty,
  ErrorBox,
  Loading,
  OptionList,
  PageHeader,
  Pager,
  TableWrap
} from '../../components/ui';
import { REQUEST_STATUSES, URGENCIES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';
import { Search, AlertOctagon, Trash2, Eye } from 'lucide-react';

export default function AdminRequests() {
  const toast = useToast();
  const [f, setF] = useState({ bloodGroup: '', urgency: '', status: '', search: '' });
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => get('/requests', { ...f, page, limit: 15 }),
    [f, page]
  );
  const [toDelete, setToDelete] = useState<any>(null);

  const upd = (k: string) => (e: any) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };

  const setStatus = async (id: number, status: string) => {
    try {
      await put(`/requests/${id}/status`, { status });
      toast.success('Request status updated');
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async () => {
    try {
      await del('/requests/' + toDelete.id);
      toast.success('Request deleted');
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Network Blood Requests"
        subtitle="Oversight of all active, fulfilled, and cancelled requests across the entire healthcare network."
      />

      {/* Filter Bar */}
      <div className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-0 ml-3 h-4 w-4 my-auto text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search patient name..."
            value={f.search}
            onChange={upd('search')}
          />
        </div>
        <BloodSelect all label="" value={f.bloodGroup} onChange={upd('bloodGroup')} />
        <select className="input" value={f.urgency} onChange={upd('urgency')}>
          <OptionList values={URGENCIES} placeholder="All Urgency Levels" />
        </select>
        <select className="input" value={f.status} onChange={upd('status')}>
          <OptionList values={REQUEST_STATUSES} placeholder="All Statuses" />
        </select>
      </div>

      {loading ? (
        <Loading text="Loading blood requests..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty title="No blood requests match your filters" hint="Try adjusting the filters above." />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient & Attendant</th>
                <th>Blood</th>
                <th>Units</th>
                <th>Hospital Facility</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Required Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-semibold text-xs text-slate-400">#{r.id}</td>
                  <td>
                    <p className="font-bold text-white">{r.patientName}</p>
                    <p className="text-xs text-slate-400">by {r.receiver?.user?.name || 'Receiver'}</p>
                  </td>
                  <td>
                    <BloodTag value={r.bloodGroup} />
                  </td>
                  <td className="font-bold text-white">{r.units}</td>
                  <td className="text-slate-300">{r.hospital?.user.name || '-'}</td>
                  <td>
                    <Badge value={r.urgency} />
                  </td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td className="text-xs text-slate-400">{fmtDate(r.requiredDate)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link className="btn-outline btn-sm" to={`/admin/requests/${r.id}`}>
                        View
                      </Link>
                      <select
                        className="input w-auto py-1 text-xs"
                        value={r.status}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                        aria-label="Update request status"
                      >
                        <OptionList values={REQUEST_STATUSES} />
                      </select>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => setToDelete(r)}
                        aria-label="Delete request"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}

      <Confirm
        open={!!toDelete}
        danger
        title="Delete Blood Request"
        message={`Delete request #${toDelete?.id} for patient ${toDelete?.patientName}? Note: It is generally safer to change the status to "Cancelled" to preserve audit logs.`}
        confirmText="Delete Request"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
