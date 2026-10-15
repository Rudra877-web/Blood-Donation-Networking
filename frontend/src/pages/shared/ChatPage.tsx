import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, post, errMsg } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { Badge, BloodTag, Empty, Loading, PageHeader } from '../../components/ui';
import { bg } from '../../utils/constants';
import { fmtDateTime } from '../../utils/format';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCheck,
  AlertCircle,
  Search,
  Sparkles
} from 'lucide-react';

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
    get('/chat/' + active)
      .then((m) => !cancelled && setMessages(m))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoadingMsgs(false));

    const s = getSocket();
    s?.emit('chat:join', active);
    const onMsg = (m: any) => {
      if (m.requestId === active) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
    };
    s?.on('chat:message', onMsg);
    return () => {
      cancelled = true;
      s?.off('chat:message', onMsg);
      s?.emit('chat:leave', active);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      const m = await post('/chat/' + active, { message: text });
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      setText('');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const activeConv = (convs.data || []).find((c: any) => c.id === active);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Request Coordination Chat"
        subtitle="End-to-end communication channel attached directly to active blood requests."
      />

      {convs.loading ? (
        <Loading text="Loading conversations..." />
      ) : !convs.data?.length ? (
        <div className="card p-8">
          <Empty
            icon={MessageSquare}
            title="No active conversations yet"
            hint="A dedicated secure chat automatically opens once a voluntary donor accepts an emergency request."
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#151822] shadow-card overflow-hidden grid md:grid-cols-12 h-[75vh]">
          {/* Left: Conversation List */}
          <div className="md:col-span-4 border-r border-slate-800 flex flex-col h-full bg-[#0E111A]">
            <div className="p-4 border-b border-slate-800 bg-[#151822]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Discussions ({convs.data.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {convs.data.map((c: any) => {
                const isSelected = active === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setParams({ request: String(c.id) })}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-[#191D2B] shadow-card ring-1 ring-brand-500/20'
                        : 'border-slate-800/80 bg-[#121520] hover:bg-[#181C28] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        #{c.id} · {c.patientName}
                      </span>
                      <BloodTag value={c.bloodGroup} size="sm" />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <Badge value={c.status} />
                    </div>
                    {c.messages[0] && (
                      <p className="mt-2 text-xs text-slate-400 truncate leading-relaxed">
                        {c.messages[0].message}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Message Stream */}
          <div className="md:col-span-8 flex flex-col h-full bg-[#151822]">
            {!active ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                <MessageSquare className="h-10 w-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Select a conversation</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Pick a request thread on the left to review messages and coordinate transfusion details.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#151822]/90 backdrop-blur-sm">
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Request #{activeConv?.id} · Patient: {activeConv?.patientName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Direct coordination between donor, hospital, and attendant
                    </p>
                  </div>
                  {activeConv && <Badge value={activeConv.status} />}
                </div>

                {/* Message Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-[#0B0D13]">
                  {loadingMsgs ? (
                    <Loading text="Loading message history..." />
                  ) : !messages.length ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                      <Sparkles className="h-8 w-8 text-brand-400 mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No messages yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Send a message to start coordinating location or arrival times.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender.id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-subtle ${
                              mine
                                ? 'bg-brand-600 text-white rounded-br-none border border-brand-500/30'
                                : 'bg-[#1C2130] border border-slate-800 text-slate-100 rounded-bl-none'
                            }`}
                          >
                            {!mine && (
                              <p className="font-bold text-[11px] text-brand-400 mb-1">
                                {m.sender.name}{' '}
                                <span className="font-normal text-slate-400">
                                  ({m.sender.role.toLowerCase()})
                                </span>
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                              {m.message}
                            </p>
                            <p
                              className={`mt-1.5 text-[10px] text-right font-medium ${
                                mine ? 'text-red-200/80' : 'text-slate-400'
                              }`}
                            >
                              {fmtDateTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottom} />
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={send}
                  className="flex items-center gap-2.5 border-t border-slate-800 p-4 bg-[#151822]"
                >
                  <input
                    className="input flex-1"
                    placeholder="Type a message to the team..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2000}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="btn-primary shrink-0 shadow-sm flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
