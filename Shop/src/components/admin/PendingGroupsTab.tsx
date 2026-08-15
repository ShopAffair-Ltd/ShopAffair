import React, { useEffect, useState } from 'react';
import { fetchPendingCommunities, approveCommunity, rejectCommunity, PendingCommunity } from '../../services/adminService';

export const PendingGroupsTab: React.FC = () => {
  const [groups, setGroups] = useState<PendingCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchPendingCommunities()
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveCommunity(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch {
      alert('Could not approve this group. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Reason for rejecting this group?');
    if (!reason) return;
    setBusyId(id);
    try {
      await rejectCommunity(id, reason);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch {
      alert('Could not reject this group. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Pending Trade Groups</h3>
        <span className="text-[10px] text-slate-400">{groups.length} awaiting review</span>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No groups awaiting approval.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center">
                  <strong className="text-white text-xs">{g.name}</strong>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Pending</span>
                </div>
                {g.description && <p className="text-[10px] text-slate-400 mt-1">{g.description}</p>}
                <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-1">
                  <p>Created by @{g.creator.username} {g.creator.isPro ? '(Seller Pro)' : ''}</p>
                  <p>{g._count.participants} member(s)</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleApprove(g.id)}
                  disabled={busyId === g.id}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer text-center transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(g.id)}
                  disabled={busyId === g.id}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer text-center transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};