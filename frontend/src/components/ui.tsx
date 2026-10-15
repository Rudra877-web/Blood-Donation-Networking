import { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Droplet,
  ChevronLeft,
  ChevronRight,
  X,
  LucideIcon
} from 'lucide-react';
import { BLOOD_GROUPS } from '../utils/constants';
import { titleCase } from '../utils/format';

export const Spinner = ({ className = 'h-5 w-5 text-brand-500' }: { className?: string }) => (
  <Loader2 className={`${className} animate-spin`} />
);

export const Loading = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
    <Spinner className="h-8 w-8 text-brand-500" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200 flex items-start gap-3 shadow-subtle">
    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-semibold text-red-300">An error occurred</p>
      <p className="mt-0.5 text-red-200/90 text-xs">{message}</p>
      {onRetry && (
        <button
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 underline hover:text-red-300"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  </div>
);

export const Empty = ({
  title = 'Nothing here yet',
  hint,
  icon: Icon = Droplet,
  action,
}: {
  title?: string;
  hint?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-950/50 border border-brand-900/60 text-brand-400 shadow-subtle mb-3">
      <Icon className="h-7 w-7 stroke-[1.75]" />
    </div>
    <h3 className="text-base font-semibold text-slate-200">{title}</h3>
    {hint && <p className="mt-1 text-xs text-slate-400 max-w-sm">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

interface BadgeConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const BADGE_MAP: Record<string, BadgeConfig> = {
  // Positive / Successful
  ACTIVE: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', dot: 'bg-emerald-400' },
  APPROVED: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', dot: 'bg-emerald-400' },
  COMPLETED: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', dot: 'bg-emerald-400' },
  AVAILABLE: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', dot: 'bg-emerald-400' },
  ACCEPTED: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/60', dot: 'bg-emerald-400' },
  
  // Informational / Pending
  CONFIRMED: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/60', dot: 'bg-blue-400' },
  MATCHED: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/60', dot: 'bg-blue-400' },
  ADMITTED: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/60', dot: 'bg-blue-400' },
  PENDING: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60', dot: 'bg-amber-400' },
  NOTIFIED: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60', dot: 'bg-amber-400' },
  UNDER_TREATMENT: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/60', dot: 'bg-amber-400' },
  
  // Urgent / Warning
  URGENT: { bg: 'bg-orange-950/40', text: 'text-orange-300', border: 'border-orange-800/60', dot: 'bg-orange-400' },
  LOW: { bg: 'bg-orange-950/40', text: 'text-orange-300', border: 'border-orange-800/60', dot: 'bg-orange-400' },
  RESERVED: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/60', dot: 'bg-purple-400' },
  
  // Critical / Negative
  CRITICAL: { bg: 'bg-red-950/40', text: 'text-red-300', border: 'border-red-800/60', dot: 'bg-red-400' },
  REJECTED: { bg: 'bg-red-950/40', text: 'text-red-300', border: 'border-red-800/60', dot: 'bg-red-400' },
  DECLINED: { bg: 'bg-red-950/40', text: 'text-red-300', border: 'border-red-800/60', dot: 'bg-red-400' },
  EXPIRED: { bg: 'bg-red-950/40', text: 'text-red-300', border: 'border-red-800/60', dot: 'bg-red-400' },
  SUSPENDED: { bg: 'bg-red-950/40', text: 'text-red-300', border: 'border-red-800/60', dot: 'bg-red-400' },
  
  // Neutral
  CANCELLED: { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700/60', dot: 'bg-slate-400' },
  NORMAL: { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700/60', dot: 'bg-slate-400' },
  DISCHARGED: { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700/60', dot: 'bg-slate-400' },
};

export const Badge = ({ value }: { value?: string | null }) => {
  if (!value) return <span className="text-slate-500">-</span>;
  const cfg = BADGE_MAP[value] || { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-700/60', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {titleCase(value)}
    </span>
  );
};

export const BloodTag = ({ value, size = 'md' }: { value: string; size?: 'sm' | 'md' | 'lg' }) => {
  const formatted = value ? value.replace('_POS', '+').replace('_NEG', '-') : '-';
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-extrabold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-lg bg-brand-950/70 border border-brand-800/70 text-brand-300 shadow-subtle ${sizeClasses}`}>
      <Droplet className="h-3.5 w-3.5 fill-brand-400 text-brand-400 shrink-0" />
      <span>{formatted}</span>
    </span>
  );
};

export const Stat = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'slate',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'red' | 'blue' | 'green' | 'amber' | 'slate';
}) => {
  const tones = {
    red: { text: 'text-brand-400', iconBg: 'bg-brand-950/60 text-brand-400 border-brand-900/60' },
    blue: { text: 'text-blue-400', iconBg: 'bg-blue-950/60 text-blue-400 border-blue-900/60' },
    green: { text: 'text-emerald-400', iconBg: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/60' },
    amber: { text: 'text-amber-400', iconBg: 'bg-amber-950/60 text-amber-400 border-amber-900/60' },
    slate: { text: 'text-slate-100', iconBg: 'bg-slate-800/80 text-slate-300 border-slate-700' },
  }[tone];

  return (
    <div className="card flex flex-col justify-between p-5 relative overflow-hidden group hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${tones.text}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones.iconBg} shadow-subtle shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {hint && <p className="mt-3 text-xs text-slate-400 font-medium">{hint}</p>}
    </div>
  );
};

export const PageHeader = ({
  title,
  subtitle,
  actions,
  badge,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="flex items-center gap-2.5">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);

export const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="card overflow-hidden p-0 shadow-card border-slate-800/80">
    <div className="overflow-x-auto">{children}</div>
  </div>
);

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6"
      onMouseDown={onClose}
    >
      <div
        className={`my-8 w-full ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        } rounded-2xl bg-[#151822] shadow-2xl border border-slate-800 text-slate-100 animate-in fade-in zoom-in-95 duration-150`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title,
  message,
  confirmText = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex items-start gap-3">
        {danger ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-950/60 border border-red-900/60 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-950/60 border border-brand-900/60 text-brand-400">
            <HelpCircle className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm text-slate-300 leading-relaxed mt-1">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" className="btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

type FieldProps = { label?: string; hint?: string; error?: string };

export const Input = ({
  label,
  hint,
  error,
  ...p
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) => (
  <div className="w-full">
    {label && (
      <label className="label">
        {label}
        {p.required && <span className="text-brand-400 font-bold"> *</span>}
      </label>
    )}
    <input className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} {...p} />
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
  </div>
);

export const Select = ({
  label,
  children,
  hint,
  error,
  ...p
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="w-full">
    {label && (
      <label className="label">
        {label}
        {p.required && <span className="text-brand-400 font-bold"> *</span>}
      </label>
    )}
    <select className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} {...p}>
      {children}
    </select>
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
  </div>
);

export const Textarea = ({
  label,
  hint,
  error,
  ...p
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="w-full">
    {label && (
      <label className="label">
        {label}
        {p.required && <span className="text-brand-400 font-bold"> *</span>}
      </label>
    )}
    <textarea className={`input min-h-[90px] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} {...p} />
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
  </div>
);

export const BloodSelect = ({
  label = 'Blood Group',
  all,
  ...p
}: FieldProps & { all?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) => (
  <Select label={label} {...p}>
    <option value="" className="bg-[#151822] text-white">
      {all ? 'All blood groups' : 'Select blood group...'}
    </option>
    {BLOOD_GROUPS.map((b) => (
      <option key={b.value} value={b.value} className="bg-[#151822] text-white">
        {b.label}
      </option>
    ))}
  </Select>
);

export const OptionList = ({
  values,
  placeholder,
}: {
  values: string[];
  placeholder?: string;
}) => (
  <>
    {placeholder !== undefined && (
      <option value="" className="bg-[#151822] text-white">
        {placeholder}
      </option>
    )}
    {values.map((v) => (
      <option key={v} value={v} className="bg-[#151822] text-white">
        {titleCase(v)}
      </option>
    ))}
  </>
);

export function Pager({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-[#0E111A] px-5 py-3 text-sm text-slate-400">
      <span className="text-xs font-medium">
        Showing <span className="font-semibold text-slate-200">{(page - 1) * limit + 1}</span> to{' '}
        <span className="font-semibold text-slate-200">{Math.min(page * limit, total)}</span> of{' '}
        <span className="font-semibold text-slate-200">{total}</span> records
      </span>
      <div className="flex items-center gap-1.5">
        <button
          className="btn-outline btn-sm h-8 px-2.5"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="px-2 text-xs font-semibold text-slate-300">
          Page {page} of {pages}
        </span>
        <button
          className="btn-outline btn-sm h-8 px-2.5"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const Grid = ({
  children,
  cols = 4,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}) => (
  <div
    className={`grid gap-4 sm:grid-cols-2 ${
      cols === 4 ? 'lg:grid-cols-4' : cols === 3 ? 'lg:grid-cols-3' : ''
    }`}
  >
    {children}
  </div>
);
