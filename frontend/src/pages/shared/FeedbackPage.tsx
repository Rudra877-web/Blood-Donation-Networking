import { FormEvent, useState } from 'react';
import { get, post, errMsg } from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { fmtDate } from '../../utils/format';
import { Empty, PageHeader, Textarea, Spinner } from '../../components/ui';
import { Star, MessageSquareQuote, CheckCircle2 } from 'lucide-react';

export const Stars = ({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) => (
  <span className="inline-flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => {
      const active = n <= value;
      return (
        <button
          type="button"
          key={n}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} of 5 stars`}
          className={`p-0.5 rounded transition ${
            onChange ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}
        >
          <Star
            className={`h-5 w-5 ${
              active
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 fill-slate-100'
            }`}
          />
        </button>
      );
    })}
  </span>
);

export default function FeedbackPage() {
  const toast = useToast();
  const { data, reload } = useFetch(() => get('/feedback'));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await post('/feedback', { rating, comment });
      toast.success('Thank you for contributing your feedback!');
      setComment('');
      setRating(5);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Community Feedback & Reviews"
        subtitle="Share your donation or transfusion experience to help us improve the platform."
      />

      <form onSubmit={submit} className="card p-6 sm:p-8 space-y-5">
        <div>
          <label className="label mb-2">Overall Experience Rating</label>
          <div className="flex items-center gap-3">
            <Stars value={rating} onChange={setRating} />
            <span className="text-xs font-bold text-slate-700">
              {rating === 5
                ? 'Excellent (5/5)'
                : rating === 4
                ? 'Very Good (4/5)'
                : rating === 3
                ? 'Average (3/5)'
                : rating === 2
                ? 'Poor (2/5)'
                : 'Terrible (1/5)'}
            </span>
          </div>
        </div>

        <Textarea
          label="Your Feedback / Clinical Experience"
          required
          minLength={3}
          maxLength={1000}
          placeholder="Describe how the matching or hospital transfusion process went..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              <span>Submitting...</span>
            </span>
          ) : (
            <span>Submit Feedback</span>
          )}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Your Submitted Feedback</h2>

        {!data?.items.length ? (
          <div className="card">
            <Empty
              icon={MessageSquareQuote}
              title="No previous reviews"
              hint="Your reviews and suggestions will be archived here once submitted."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((f: any) => (
              <div key={f.id} className="card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <Stars value={f.rating} />
                  <span className="text-xs text-slate-400 font-medium">{fmtDate(f.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{f.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
