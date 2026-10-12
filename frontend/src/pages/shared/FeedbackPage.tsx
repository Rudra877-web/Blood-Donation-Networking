import { FormEvent, useState } from 'react';
import { get, post, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { fmtDate } from '../../utils/format';
import { Empty, PageHeader, Textarea } from '../../components/ui';

export const Stars = ({ value, onChange }: { value: number; onChange?: (n: number) => void }) => (
  <span className="inline-flex gap-0.5 text-xl">
    {[1, 2, 3, 4, 5].map((n) => (
      <button type="button" key={n} disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} star`} className={n <= value ? 'text-amber-400' : 'text-slate-300'}>★</button>
    ))}
  </span>
);

export default function FeedbackPage() {
  const toast = useToast();
  const { data, reload } = useFetch(() => get('/feedback'));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { await post('/feedback', { rating, comment }); toast.success('Thank you for your feedback'); setComment(''); setRating(5); reload(); } catch (err) { toast.error(errMsg(err)); }
  };
  return (
    <div className="max-w-3xl">
      <PageHeader title="Feedback" subtitle="Tell us about your experience" />
      <form onSubmit={submit} className="card space-y-3">
        <div><label className="label">Rating</label><Stars value={rating} onChange={setRating} /></div>
        <Textarea label="Review / comment" required minLength={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
        <button className="btn-primary">Submit feedback</button>
      </form>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Your previous feedback</h2>
      {!data?.items.length ? <div className="card"><Empty title="No feedback submitted yet" /></div> : (
        <div className="space-y-2">{data.items.map((f: any) => (<div key={f.id} className="card"><div className="flex justify-between"><Stars value={f.rating} /><span className="text-xs text-slate-400">{fmtDate(f.createdAt)}</span></div><p className="mt-1 text-sm">{f.comment}</p></div>))}</div>
      )}
    </div>
  );
}
