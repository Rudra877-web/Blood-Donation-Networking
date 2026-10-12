import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, post, errMsg } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { Badge, Empty, Loading, PageHeader } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDateTime } from '../../utils/format';

/** Request-based chat: messages are persisted by the API and pushed live through Socket.IO. */
export default function ChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const convs = useFetch(() => get('/chat/conversations'));
  const active = Number(params.get('request')) || null;
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoadingMsgs(true);
    get('/chat/' + active).then((m) => !cancelled && setMessages(m)).catch((e) => toast.error(errMsg(e))).finally(() => setLoadingMsgs(false));
    const s = getSocket();
    s?.emit('chat:join', active);
    const onMsg = (m: any) => { if (m.requestId === active) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])); };
    s?.on('chat:message', onMsg);
    return () => { cancelled = true; s?.off('chat:message', onMsg); s?.emit('chat:leave', active); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      const m = await post('/chat/' + active, { message: text });
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      setText('');
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div>
      <PageHeader title="Chat" subtitle="Each conversation belongs to a blood request" />
      {convs.loading ? <Loading /> : !convs.data?.length ? <div className="card"><Empty title="No conversations yet" hint="Chat opens for a request once a donor accepts it." /></div> : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card max-h-[70vh] space-y-2 overflow-y-auto p-3 md:col-span-1">
            {convs.data.map((c: any) => (
              <button key={c.id} onClick={() => setParams({ request: String(c.id) })} className={`w-full rounded-lg border p-3 text-left ${active === c.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between"><span className="font-medium">#{c.id} · {c.patientName}</span><span className="text-xs font-bold text-brand-700">{bg(c.bloodGroup)}</span></div>
                <div className="mt-1 flex items-center justify-between"><Badge value={c.status} /></div>
                {c.messages[0] && <p className="mt-1 truncate text-xs text-slate-500">{c.messages[0].message}</p>}
              </button>
            ))}
          </div>
          <div className="card flex h-[70vh] flex-col p-0 md:col-span-2">
            {!active ? <Empty title="Select a conversation" /> : (<>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMsgs ? <Loading /> : !messages.length ? <Empty title="No messages yet" hint="Say hello 👋" /> : messages.map((m) => {
                  const mine = m.sender.id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                        {!mine && <p className="text-xs font-semibold opacity-70">{m.sender.name} · {m.sender.role.toLowerCase()}</p>}
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-red-100' : 'text-slate-400'}`}>{fmtDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
                <input className="input" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
                <button className="btn-primary" disabled={!text.trim()}>Send</button>
              </form>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
