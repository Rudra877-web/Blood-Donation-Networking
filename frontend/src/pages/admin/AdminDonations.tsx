import { FormEvent, useState } from 'react';
import { del, errMsg, get, post, put } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { Badge, BloodTag, Confirm, Empty, ErrorBox, Input, Loading, Modal, OptionList, PageHeader, Pager, Select, TableWrap, Textarea } from '../../components/ui';
import { DONATION_STATUSES } from '../../utils/constants';
import { fmtDate } from '../../utils/format';

export default function AdminDonations() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => get('/donations', { status, page, limit: 15 }), [status, page]);
  const donors = useFetch(() => get('/donors'), []);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<any>(null);
  const { values, setValues, bind } = useForm<any>({ donorId: '', requestId: '', units: 1, status: 'COMPLETED', donationDate: new Date().toISOString().slice(0, 10), notes: '' });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try { await post('/donations', values); toast.success('Donation record added'); setOpen(false); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  const update = async (id: number, st: string) => { try { await put(`/donations/${id}/status`, { status: st }); toast.success('Status updated'); reload(); } catch (e) { toast.error(errMsg(e)); } };
  const remove = async () => { try { await del('/donations/' + toDelete.id); toast.success('Record deleted'); setToDelete(null); reload(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <div>
      <PageHeader title="Donations" subtitle="Donation records and history" actions={<button className="btn-primary" onClick={() => setOpen(true)}>+ Add donation</button>} />
      <div className="card mb-4 max-w-xs"><select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><OptionList values={DONATION_STATUSES} placeholder="All statuses" /></select></div>
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : !data.items.length ? <div className="card"><Empty title="No donation records" /></div> : (
        <TableWrap>
          <table className="table">
            <thead><tr><th>Date</th><th>Donor</th><th>Blood</th><th>Request</th><th>Hospital</th><th>Units</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{data.items.map((d: any) => (
              <tr key={d.id}><td>{fmtDate(d.donationDate)}</td><td>{d.donor.user.name}</td><td><BloodTag value={d.donor.bloodGroup} /></td><td>{d.request ? `#${d.request.id} ${d.request.patientName}` : '-'}</td><td>{d.hospital?.user.name || '-'}</td><td>{d.units}</td><td><Badge value={d.status} /></td>
                <td><div className="flex justify-end gap-1"><select className="input w-auto py-1 text-xs" value={d.status} onChange={(e) => update(d.id, e.target.value)}><OptionList values={DONATION_STATUSES} /></select><button className="btn-danger btn-sm" onClick={() => setToDelete(d)}>Delete</button></div></td></tr>))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </TableWrap>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add donation record">
        <form onSubmit={save} className="space-y-4">
          <Select label="Donor" required {...bind('donorId')}><option value="">Select donor...</option>{(donors.data || []).map((d: any) => <option key={d.id} value={d.id}>{d.user.name} ({d.bloodGroup.replace('_POS', '+').replace('_NEG', '-')})</option>)}</Select>
          <div className="grid gap-4 sm:grid-cols-2"><Input label="Request ID (optional)" type="number" min={1} {...bind('requestId')} /><Input label="Units" type="number" min={1} max={10} required {...bind('units')} />
            <Select label="Status" {...bind('status')}><OptionList values={DONATION_STATUSES} /></Select><Input label="Donation date" type="date" required {...bind('donationDate')} /></div>
          <Textarea label="Notes" {...bind('notes')} />
          <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => { setOpen(false); setValues({ ...values }); }}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>
      <Confirm open={!!toDelete} danger title="Delete donation record" message="Delete this incorrect donation record?" confirmText="Delete" onCancel={() => setToDelete(null)} onConfirm={remove} />
    </div>
  );
}
