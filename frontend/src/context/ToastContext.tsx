import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type Kind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: Kind;
  text: string;
}

interface Ctx {
  success: (t: string) => void;
  error: (t: string) => void;
  info: (t: string) => void;
}

const ToastCtx = createContext<Ctx>({
  success() {},
  error() {},
  info() {},
});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  const value: Ctx = {
    success: (t) => push('success', t),
    error: (t) => push('error', t),
    info: (t) => push('info', t),
  };

  const config: Record<Kind, { icon: typeof CheckCircle2; bg: string; text: string; border: string; iconColor: string }> = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-[#151822]',
      text: 'text-slate-100',
      border: 'border-slate-800 border-l-4 border-l-emerald-500',
      iconColor: 'text-emerald-400',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-[#151822]',
      text: 'text-slate-100',
      border: 'border-slate-800 border-l-4 border-l-brand-500',
      iconColor: 'text-brand-400',
    },
    info: {
      icon: Info,
      bg: 'bg-[#151822]',
      text: 'text-slate-100',
      border: 'border-slate-800 border-l-4 border-l-slate-400',
      iconColor: 'text-slate-300',
    },
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => {
          const c = config[t.kind];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl transition-all animate-in slide-in-from-top-2 duration-200 ${c.bg} ${c.border}`}
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${c.iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-snug text-slate-100">
                {t.text}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-200 transition -mr-1 -mt-1 p-1 rounded-md"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
