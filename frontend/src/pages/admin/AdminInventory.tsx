import { FormEvent, useState } from 'react';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import {
  Badge,
  BloodSelect,
  BloodTag,
  Confirm,
  Empty,
  ErrorBox,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  TableWrap
} from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDate, fmtDateTime, toInputDate } from '../../utils/format';
import { PlusCircle, PackageCheck, AlertTriangle, Calendar, Droplet } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const plus = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const blank = () => ({
  bloodGroup: '',
  units: 1,
  amountMl: '',
  status: 'AVAILABLE',
  collectionDate: today(),
  expiryDate: plus(35),
});

export default function AdminInventory() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const { data, loading, error, reload } = useFetch(
    () => get('/inventory', { bloodGroup: filter }),
    [filter]
  );
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const { values, setValues, bind } = useForm<any>(blank());

  const openNew = () => {
    setValues(blank());
    setEditing('new');
  };

  const openEdit = (r: any) => {
    setValues({
      bloodGroup: r.bloodGroup,
      units: r.units,
      amountMl: r.amountMl,
      status: r.status,
      collectionDate: toInputDate(r.collectionDate),
      expiryDate: toInputDate(r.expiryDate),
    });
    setEditing(r);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing === 'new') await post('/inventory', values);
      else await put('/inventory/' + editing.id, values);
      toast.success('Inventory batch saved successfully');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async () => {
    try {
      await del('/inventory/' + toDelete.id);
      toast.success('Inventory batch deleted');
      setToDelete(null);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Bank Inventory Management"
        subtitle="Manage centralized blood reserves. Status is automatically calculated based on available vs reserved units and expiry dates."
        actions={
          <button className="btn-primary flex items-center gap-1.5" onClick={openNew}>
            <PlusCircle className="h-4 w-4" />
            <span>Add Stock Batch</span>
          </button>
        }
      />

      {loading ? (
        <Loading text="Loading blood inventory..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <>
          {/* 8-Group Status Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {data.summary.map((s: any) => {
              const active = filter === s.bloodGroup;
              return (
                <button
                  type="button"
                  key={s.bloodGroup}
                  onClick={() => setFilter(active ? '' : s.bloodGroup)}
                  className={`card p-3.5 text-center transition-all ${
                    active
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-950/40 shadow-card-hover'
                      : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-center">
                    <BloodTag value={s.bloodGroup} />
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-white">{s.units}</p>
                  <p className="text-[11px] text-slate-400 mb-2">units ({s.amountMl} ml)</p>
                  <Badge value={s.status} />

                  {s.reservedUnits > 0 && (
                    <p className="mt-1 text-[11px] font-semibold text-purple-400">
                      {s.reservedUnits} reserved
                    </p>
                  )}
                  {s.expiredUnits > 0 && (
                    <p className="text-[11px] font-semibold text-red-400">
                      {s.expiredUnits} expired
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {filter && (
            <div className="flex items-center justify-between text-xs text-brand-300 bg-brand-950/50 border border-brand-800/60 rounded-xl p-3">
              <span>
                Filtering by <b>{bg(filter)}</b> blood group.
              </span>
              <button
                className="font-bold underline text-brand-400 hover:text-brand-300"
                onClick={() => setFilter('')}
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Batches Table */}
          {!data.items.length ? (
            <div className="card">
              <Empty title="No stock records found" hint="Add blood units to start tracking inventory batches." />
            </div>
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Blood Group</th>
                    <th>Units</th>
                    <th>Volume (ml)</th>
                    <th>Effective Status</th>
                    <th>Source Facility</th>
                    <th>Collection Date</th>
                    <th>Expiry Date</th>
                    <th>Last Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        <BloodTag value={r.bloodGroup} />
                      </td>
                      <td className="font-bold text-white">{r.units}</td>
                      <td className="text-xs text-slate-300">{r.amountMl} ml</td>
                      <td>
                        <Badge value={r.effectiveStatus} />
                      </td>
                      <td className="text-slate-300">{r.hospital?.user.name || 'Central Blood Bank'}</td>
                      <td className="text-xs text-slate-400">{fmtDate(r.collectionDate)}</td>
                      <td className="text-xs font-semibold text-white">{fmtDate(r.expiryDate)}</td>
                      <td className="text-[11px] text-slate-400">{fmtDateTime(r.updatedAt)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className="btn-outline btn-sm"
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => setToDelete(r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add Blood Stock Batch' : 'Edit Blood Stock Batch'}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <BloodSelect required {...bind('bloodGroup')} />
            <Input label="Units Count" type="number" min={0} required {...bind('units')} />
            <Input
              label="Volume (ml)"
              type="number"
              min={0}
              hint="Standard = 450 ml per unit"
              {...bind('amountMl')}
            />
            <Select label="Batch Reservation Status" {...bind('status')}>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
            </Select>
            <Input label="Collection Date" type="date" required {...bind('collectionDate')} />
            <Input label="Expiry Date" type="date" required {...bind('expiryDate')} />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Batch
            </button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={!!toDelete}
        danger
        title="Delete Blood Stock Record"
        message="Permanently delete this blood stock batch? This will alter active availability counts immediately."
        confirmText="Delete Record"
        onCancel={() => setToDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
