import React, { useEffect, useState } from 'react';
import { fetchSystemHealth, SystemHealth } from '../../services/adminService';

export const SystemMonitoringTab: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth().then(setHealth).catch(() => setHealth(null)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Platform Health</h3>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : !health ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Could not load health data.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-900 rounded-xl">
            <span className="block text-[10px] text-slate-400">Active Trades</span>
            <strong className="text-purple-400 text-lg">{health.activeTrades}</strong>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl">
            <span className="block text-[10px] text-slate-400">Total Trades</span>
            <strong className="text-purple-400 text-lg">{health.totalTrades}</strong>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl">
            <span className="block text-[10px] text-slate-400">Failed Transactions</span>
            <strong className={`text-lg ${health.failedTransactions > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{health.failedTransactions}</strong>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl">
            <span className="block text-[10px] text-slate-400">Pending Withdrawals</span>
            <strong className={`text-lg ${health.pendingWithdrawals > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{health.pendingWithdrawals}</strong>
          </div>
        </div>
      )}
    </div>
  );
};