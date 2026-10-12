import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type Kind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: Kind; text: string }
interface Ctx { success: (t: string) => void; error: (t: string) => void; info: (t: string) => void }

const ToastCtx = createContext<Ctx>({ success() {}, error() {}, info() {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const value: Ctx = { success: (t) => push('success', t), error: (t) => push('error', t), info: (t) => push('info', t) };
  const colors: Record<Kind, string> = { success: 'bg-emerald-600', error: 'bg-red-700', info: 'bg-slate-800' };
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`${colors[t.kind]} rounded-lg px-4 py-3 text-sm text-white shadow-lg`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
