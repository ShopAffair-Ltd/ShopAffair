import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TradeItem } from '../../types';
import { fetchDashboard, DashboardOverview } from '../../services/adminService';

interface OverviewTabProps {
  trades: TradeItem[];
  setActiveSection: (section: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ trades, setActiveSection }) => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    fetchDashboard().then(setOverview).catch(() => setOverview(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Escrow Volume</span>
          <strong className="text-lg font-black text-white block mt-1">₦{Number(overview?.totalVolume ?? 0).toLocaleString()}</strong>
          <span className="text-[8px] text-slate-500 font-mono">Completed trades</span>
        </div>
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Users</span>
          <strong className="text-lg font-black text-white block mt-1">{overview?.userCount ?? 0}</strong>
          <span className="text-[8px] text-slate-500 font-mono">Registered on platform</span>
        </div>
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Disputed Cases</span>
          <strong className="text-lg font-black text-amber-500 block mt-1">{overview?.disputedCount ?? 0}</strong>
          <span className="text-[8px] text-slate-500 font-mono">Flagged trade overrides</span>
        </div>
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">KYC Document Queue</span>
          <strong className="text-lg font-black text-emerald-500 block mt-1">{overview?.pendingKycCount ?? 0}</strong>
          <span className="text-[8px] text-slate-500 font-mono">Verification applicants</span>
        </div>
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Pending Groups</span>
          <strong className="text-lg font-black text-purple-400 block mt-1">{overview?.pendingGroupsCount ?? 0}</strong>
          <span className="text-[8px] text-slate-500 font-mono">Awaiting approval</span>
        </div>
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Frozen Accounts</span>
          <strong className="text-lg font-black text-rose-400 block mt-1">{overview?.frozenCount ?? 0}</strong>
          <span className="text-[8px] text-slate-500 font-mono">Currently suspended</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2">Compliance Action Required</h3>
          <div className="space-y-2">
            {(overview?.pendingKycCount ?? 0) > 0 ? (
              <div className="flex justify-between items-center text-xs p-2.5 bg-slate-900 rounded-lg">
                <span className="font-bold text-slate-200">{overview?.pendingKycCount} pending KYC review(s)</span>
                <button onClick={() => setActiveSection('Users')} className="text-[10px] font-bold text-purple-400 hover:text-white flex items-center gap-1 cursor-pointer">
                  Review <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-slate-500 text-xs py-3 text-center">All user verification queues are clean!</div>
            )}
          </div>
        </div>

        <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2">Recent Escrows</h3>
          <div className="space-y-2">
            {trades.slice(0, 3).map((t) => (
              <div key={t.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-900 rounded-lg">
                <div>
                  <span className="font-bold text-slate-200 block truncate max-w-[150px]">{t.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">₦{t.amount.toLocaleString()}</span>
                </div>
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono uppercase font-bold">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};