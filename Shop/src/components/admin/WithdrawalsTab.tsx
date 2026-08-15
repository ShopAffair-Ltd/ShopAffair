import React, { useEffect, useState } from 'react';
import { fetchAllWithdrawals, AdminWithdrawal } from '../../services/adminService';

export const WithdrawalsTab: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllWithdrawals().then((r) => setWithdrawals(r.items)).catch(() => setWithdrawals([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Withdrawals</h3>
        <span className="text-[10px] text-slate-400">{withdrawals.length} recent</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : withdrawals.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No withdrawals yet.</p>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <strong className="text-white block">@{w.user.username} - ₦{Number(w.amount).toLocaleString()}</strong>
                <span className="text-slate-400 font-mono">{w.user.withdrawalBankName} • {w.user.withdrawalAccountNumber}</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                w.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : w.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{w.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};