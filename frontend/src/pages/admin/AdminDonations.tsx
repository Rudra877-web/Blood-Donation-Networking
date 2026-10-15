import { FormEvent, useState } from 'react';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import {
  Badge,
  BloodTag,
  Confirm,
  Empty,
  ErrorBox,
  Input,
  Loading,
  Modal,
  OptionList,
  PageHeader,
  Pager,
  Select,
  TableWrap,
  Textarea
} from '../../components/ui';
import { DONATION_STATUSES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';
import { PlusCircle, Droplet, Check } from 'lucide-react';

export default function AdminDonations() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => get('/donations', { status, page, limit: 15 }),
    [status, page]
  );
  const donors = useFetch(() => get('/donors'), []);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<any>(null);

  const { values, setValues, bind } = useForm<any>({
    donorId: '',
    requestId: '',
    units: 1,
    status: 'COMPLETED',
    donationDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await post('/donations', values);
      toast.success('Donation intake record added');
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const update = async (id: number, st: string) => {
    try {
      await put(`/donations/${id}/status`, { status: st });
      toast.success('Donation status updated');
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async () => {
    try {
      await del('/donations/' + toDelete.id);
      toast.success('Record deleted');
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Intake Records"
        subtitle="Historical log of voluntary blood donations and transfusion intake records."
        actions={
          <button className="btn-primary flex items-center gap-1.5" onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            <span>Add Donation Record</span>
          </button>
        }
      />

      <div className="card p-4 max-w-xs">
        <label className="label">Filter By Status</label>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <OptionList values={DONATION_STATUSES} placeholder="All Donation Statuses" />
        </select>
      </div>

      {loading ? (
        <Loading text="Loading donation records..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data.items.length ? (
        <div className="card">
          <Empty title="No donation records found" />
        </div>
      ) : (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voluntary Donor</th>
                <th>Blood Group</th>
                <th>Associated Request</th>
                <th>Hospital</th>
                <th>Units</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium text-slate-300">{fmtDate(d.donationDate)}</td>
                  <td className="font-semibold text-white">{d.donor?.user?.name}</td>
                  <td>
                    <BloodTag value={d.donor?.bloodGroup} />
                  </td>
                  <td>
                    {d.request ? (
                      <span className="text-xs font-semibold text-slate-300">
                        #{d.request.id} · {d.request.patientName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Direct Blood Bank Intake</span>
                    )}
                  </td>
                  <td className="text-slate-300">{d.hospital?.user.name || 'Central Facility'}</td>
                  <td className="font-bold text-white">{d.units}</td>
                  <td>
                    <Badge value={d.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={d.status}
                        onChange={(e) => update(d.id, e.target.value)}
                      >
                        <OptionList values={DONATION_STATUSES} />
                      </select>
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => setToDelete(d)}
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

      {/* Add Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Donation Record">
        <form onSubmit={save} className="space-y-4">
          <Select label="Voluntary Donor" required {...bind('donorId')}>
            <option value="">Select donor...</option>
            {(donors.data || []).map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.user.name} ({d.bloodGroup.replace('_POS', '+').replace('_NEG', '-')})
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Blood Request ID (Optional)" type="number" min={1} {...bind('requestId')} />
            <Input label="Units Donated" type="number" min={1} max={10} required {...bind('units')} />
            <Select label="Status" {...bind('status')}>
              <OptionList values={DONATION_STATUSES} />
            </Select>
            <Input label="Donation Date" type="date" required {...bind('donationDate')} />
          </div>

          <Textarea label="Clinical Notes" {...bind('notes')} />

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setOpen(false);
                setValues({ ...values });
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Record
            </button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={!!toDelete}
        danger
        title="Delete Donation Record"
        message="Permanently delete this donation record? This will adjust system reporting totals."
        confirmText="Delete Record"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
