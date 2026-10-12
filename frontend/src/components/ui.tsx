import { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { BLOOD_GROUPS } from '../utils/constants';
import { titleCase } from '../utils/format';

export const Spinner = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <div className={`${className} animate-spin rounded-full border-2 border-slate-200 border-t-brand-600`} />
);

export const Loading = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-500"><Spinner /> {text}</div>
);

export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {message} {onRetry && <button className="ml-2 font-medium underline" onClick={onRetry}>Retry</button>}
  </div>
);

export const Empty = ({ title = 'Nothing here yet', hint }: { title?: string; hint?: string }) => (
  <div className="py-12 text-center">
    <div className="text-4xl">🩸</div>
    <p className="mt-2 font-medium text-slate-700">{title}</p>
    {hint && <p className="text-sm text-slate-500">{hint}</p>}
  </div>
);

const BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700', APPROVED: 'bg-emerald-100 text-emerald-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  AVAILABLE: 'bg-emerald-100 text-emerald-700', CONFIRMED: 'bg-blue-100 text-blue-700', MATCHED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700', PENDING: 'bg-amber-100 text-amber-700', NOTIFIED: 'bg-amber-100 text-amber-700',
  LOW: 'bg-orange-100 text-orange-700', RESERVED: 'bg-purple-100 text-purple-700', URGENT: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700', REJECTED: 'bg-red-100 text-red-700', DECLINED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700', SUSPENDED: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-200 text-slate-600',
  NORMAL: 'bg-slate-100 text-slate-600', ADMITTED: 'bg-blue-100 text-blue-700', UNDER_TREATMENT: 'bg-amber-100 text-amber-700',
  DISCHARGED: 'bg-slate-200 text-slate-600',
};
export const Badge = ({ value }: { value?: string | null }) =>
  value ? <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[value] || 'bg-slate-100 text-slate-600'}`}>{titleCase(value)}</span> : <span>-</span>;

export const BloodTag = ({ value }: { value: string }) => (
  <span className="inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-full bg-brand-100 px-2 text-xs font-bold text-brand-700">
    {value.replace('_POS', '+').replace('_NEG', '-')}
  </span>
);

export const Stat = ({ label, value, hint, tone = 'red' }: { label: string; value: ReactNode; hint?: string; tone?: 'red' | 'blue' | 'green' | 'amber' | 'slate' }) => {
  const tones = { red: 'text-brand-600', blue: 'text-blue-600', green: 'text-emerald-600', amber: 'text-amber-600', slate: 'text-slate-700' };
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="card overflow-hidden p-0"><div className="overflow-x-auto">{children}</div></div>
);

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4" onMouseDown={onClose}>
      <div className={`my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl bg-white shadow-xl`} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, title, message, confirmText = 'Confirm', danger, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmText?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-outline" onClick={onCancel}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmText}</button>
      </div>
    </Modal>
  );
}

type FieldProps = { label?: string; hint?: string };
export const Input = ({ label, hint, ...p }: FieldProps & InputHTMLAttributes<HTMLInputElement>) => (
  <div>{label && <label className="label">{label}{p.required && <span className="text-brand-600"> *</span>}</label>}<input className="input" {...p} />{hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}</div>
);
export const Select = ({ label, children, ...p }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>{label && <label className="label">{label}{p.required && <span className="text-brand-600"> *</span>}</label>}<select className="input" {...p}>{children}</select></div>
);
export const Textarea = ({ label, ...p }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div>{label && <label className="label">{label}{p.required && <span className="text-brand-600"> *</span>}</label>}<textarea className="input min-h-[80px]" {...p} /></div>
);
export const BloodSelect = ({ label = 'Blood group', all, ...p }: FieldProps & { all?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) => (
  <Select label={label} {...p}>
    <option value="">{all ? 'All blood groups' : 'Select...'}</option>
    {BLOOD_GROUPS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
  </Select>
);
export const OptionList = ({ values, placeholder }: { values: string[]; placeholder?: string }) => (
  <>{placeholder !== undefined && <option value="">{placeholder}</option>}{values.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}</>
);

export function Pager({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>Page {page} of {pages} · {total} records</span>
      <div className="flex gap-2">
        <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export const Grid = ({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) => (
  <div className={`grid gap-4 sm:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : cols === 3 ? 'lg:grid-cols-3' : ''}`}>{children}</div>
);
