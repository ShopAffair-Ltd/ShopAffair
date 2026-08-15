import React, { useEffect, useState } from 'react';
import { fetchAllTransactions, AdminTransaction } from '../../services/adminService';

export const PaymentsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTransactions().then((r) => setTransactions(r.items)).catch(() => setTransactions([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Payment Logs</h3>
        <span className="text-[10px] text-slate-400">{transactions.length} recent</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No transactions yet.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <strong className="text-white block">{t.type.replace('_', ' ')} - ₦{Number(t.amount).toLocaleString()}</strong>
                <span className="text-slate-400 font-mono">@{t.user.username} • {t.provider} • {t.reference ?? 'no ref'}</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                t.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};