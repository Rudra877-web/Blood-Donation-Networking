import { FormEvent, useState } from 'react';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { Badge, BloodSelect, BloodTag, Confirm, Empty, ErrorBox, Input, Loading, Modal, PageHeader, Select, TableWrap } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDate, fmtDateTime, toInputDate } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);
const plus = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const blank = () => ({ bloodGroup: '', units: 1, amountMl: '', status: 'AVAILABLE', collectionDate: today(), expiryDate: plus(35) });

export default function AdminInventory() {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const { data, loading, error, reload } = useFetch(() => get('/inventory', { bloodGroup: filter }), [filter]);
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const { values, setValues, bind } = useForm<any>(blank());

  const openNew = () => { setValues(blank()); setEditing('new'); };
  const openEdit = (r: any) => { setValues({ bloodGroup: r.bloodGroup, units: r.units, amountMl: r.amountMl, status: r.status, collectionDate: toInputDate(r.collectionDate), expiryDate: toInputDate(r.expiryDate) }); setEditing(r); };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing === 'new') await post('/inventory', values); else await put('/inventory/' + editing.id, values);
      toast.success('Inventory saved'); setEditing(null); reload();
    } catch (err) { toast.error(errMsg(err)); }
  };
  const remove = async () => { try { await del('/inventory/' + toDelete.id); toast.success('Record deleted'); setToDelete(null); reload(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <div className="space-y-6">
      <PageHeader title="Blood Inventory" subtitle="Stock status is calculated automatically (Available / Low / Reserved / Expired)" actions={<button className="btn-primary" onClick={openNew}>+ Add stock</button>} />
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : (<>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.summary.map((s: any) => (
            <button key={s.bloodGroup} onClick={() => setFilter(filter === s.bloodGroup ? '' : s.bloodGroup)} className={`card p-3 text-center transition ${filter === s.bloodGroup ? 'ring-2 ring-brand-500' : ''}`}>
              <p className="text-xl font-extrabold text-brand-600">{bg(s.bloodGroup)}</p><p className="text-sm font-medium">{s.units} units</p><p className="text-xs text-slate-400">{s.amountMl} ml</p><Badge value={s.status} />
              {s.reservedUnits > 0 && <p className="mt-1 text-[11px] text-purple-600">{s.reservedUnits} reserved</p>}{s.expiredUnits > 0 && <p className="text-[11px] text-red-600">{s.expiredUnits} expired</p>}
            </button>
          ))}
        </div>
        {!data.items.length ? <div className="card"><Empty title="No inventory records" /></div> : (
          <TableWrap>
            <table className="table">
              <thead><tr><th>Blood</th><th>Units</th><th>Amount (ml)</th><th>Status</th><th>Source</th><th>Collected</th><th>Expires</th><th>Updated</th><th className="text-right">Actions</th></tr></thead>
              <tbody>{data.items.map((r: any) => (
                <tr key={r.id}><td><BloodTag value={r.bloodGroup} /></td><td>{r.units}</td><td>{r.amountMl}</td><td><Badge value={r.effectiveStatus} /></td><td>{r.hospital?.user.name || 'Central'}</td><td>{fmtDate(r.collectionDate)}</td><td>{fmtDate(r.expiryDate)}</td><td className="text-xs">{fmtDateTime(r.updatedAt)}</td>
                  <td><div className="flex justify-end gap-1"><button className="btn-outline btn-sm" onClick={() => openEdit(r)}>Edit</button><button className="btn-danger btn-sm" onClick={() => setToDelete(r)}>Delete</button></div></td></tr>))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </>)}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add blood stock' : 'Edit blood stock'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <BloodSelect required {...bind('bloodGroup')} />
            <Input label="Units" type="number" min={0} required {...bind('units')} />
            <Input label="Amount (ml)" type="number" min={0} hint="Defaults to 450 ml per unit" {...bind('amountMl')} />
            <Select label="Status" {...bind('status')}><option value="AVAILABLE">Available</option><option value="RESERVED">Reserved</option></Select>
            <Input label="Collection date" type="date" required {...bind('collectionDate')} />
            <Input label="Expiry date" type="date" required {...bind('expiryDate')} />
          </div>
          <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>
      <Confirm open={!!toDelete} danger title="Delete inventory record" message="Delete this stock record?" confirmText="Delete" onCancel={() => setToDelete(null)} onConfirm={remove} />
    </div>
  );
}
