import React, { useEffect, useState } from 'react';
import { fetchAllTickets, replyToTicket, setTicketStatus, SupportTicket } from '../../services/supportService';

export const SupportTab: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = () => {
    fetchAllTickets().then((r) => setTickets(r.items)).catch(() => setTickets([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    await replyToTicket(selected.id, replyText.trim()).catch(() => {});
    setReplyText('');
    load();
  };

  const handleResolve = async () => {
    if (!selected) return;
    await setTicketStatus(selected.id, 'RESOLVED').catch(() => {});
    load();
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Support Tickets</h3>
        <span className="text-[10px] text-slate-400">{tickets.length} total</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
          ) : tickets.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-6">No tickets yet.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3 rounded-xl border cursor-pointer text-[11px] ${selectedId === t.id ? 'border-purple-600 bg-purple-950/10' : 'border-slate-800 bg-slate-900/60'}`}
              >
                <strong className="text-white block truncate">{t.subject}</strong>
                <span className="text-slate-400 font-mono">@{t.user.username} • {t.status}</span>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          {selected ? (
            <div className="space-y-3 text-xs">
              <div>
                <strong className="text-white block">{selected.subject}</strong>
                <p className="text-slate-400 mt-1">{selected.message}</p>
              </div>
              <div className="space-y-2 border-t border-slate-800 pt-2 max-h-48 overflow-y-auto">
                {selected.replies.map((r) => (
                  <div key={r.id} className={`p-2 rounded-lg text-[11px] ${r.isAdminReply ? 'bg-purple-950/20 text-purple-200' : 'bg-slate-800/40 text-slate-300'}`}>
                    <span className="font-mono text-[9px] block text-slate-500">{r.isAdminReply ? 'Support' : `@${r.author?.username}`}</span>
                    {r.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
                />
                <button onClick={handleReply} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded cursor-pointer">Reply</button>
                <button onClick={handleResolve} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer">Resolve</button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 text-center py-10">Select a ticket to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};