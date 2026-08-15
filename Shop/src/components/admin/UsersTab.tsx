import React, { useEffect, useState } from 'react';
import {
  fetchFrozenUsers, freezeUser, unfreezeUser, FrozenUser,
  fetchPendingKyc, approveKyc, rejectKyc, KycUser
} from '../../services/adminService';

export const UsersTab: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<KycUser[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const loadKyc = () => {
    setLoadingKyc(true);
    fetchPendingKyc().then(setPendingUsers).catch(() => setPendingUsers([])).finally(() => setLoadingKyc(false));
  };
  useEffect(() => { loadKyc(); }, []);

  const onApproveUser = async (userId: string) => {
    await approveKyc(userId).catch(() => {});
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };
  const onRejectUser = async (userId: string, reason: string) => {
    await rejectKyc(userId, reason).catch(() => {});
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const [frozenUsers, setFrozenUsers] = useState<FrozenUser[]>([]);
  const [loadingFrozen, setLoadingFrozen] = useState(true);
  const [freezeTargetId, setFreezeTargetId] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeError, setFreezeError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadFrozen = () => {
    setLoadingFrozen(true);
    fetchFrozenUsers()
      .then(setFrozenUsers)
      .catch(() => setFrozenUsers([]))
      .finally(() => setLoadingFrozen(false));
  };

  useEffect(() => { loadFrozen(); }, []);

  const handleFreeze = async () => {
    if (!freezeTargetId.trim() || !freezeReason.trim()) {
      setFreezeError('User ID and reason are both required');
      return;
    }
    setFreezeError(null);
    setBusyId(freezeTargetId);
    try {
      await freezeUser(freezeTargetId.trim(), freezeReason.trim());
      setFreezeTargetId('');
      setFreezeReason('');
      loadFrozen();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not freeze this account';
      setFreezeError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleUnfreeze = async (userId: string) => {
    setBusyId(userId);
    try {
      await unfreezeUser(userId);
      loadFrozen();
    } catch {
      alert('Could not unfreeze this account. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Account freeze/suspend - super admin control */}
      <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-white">Account Suspension Control</h3>
          <span className="text-[10px] text-slate-500">Fully locks a user out on freeze</span>
        </div>

        {freezeError && (
          <div className="p-2.5 bg-red-950/30 text-red-400 border border-red-900/40 rounded-lg text-[11px] font-bold">
            {freezeError}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={freezeTargetId}
            onChange={(e) => setFreezeTargetId(e.target.value)}
            placeholder="User ID to freeze"
            className="flex-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-red-500"
          />
          <input
            type="text"
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
            placeholder="Reason"
            className="flex-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleFreeze}
            disabled={busyId === freezeTargetId && !!freezeTargetId}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer"
          >
            Freeze
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Currently frozen ({frozenUsers.length})</p>
          {loadingFrozen ? (
            <p className="text-[11px] text-slate-500 text-center py-4">Loading...</p>
          ) : frozenUsers.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-4">No frozen accounts.</p>
          ) : (
            <div className="space-y-2">
              {frozenUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-lg border border-slate-800">
                  <div className="text-[11px]">
                    <strong className="text-white block">{u.name} <span className="text-slate-500 font-mono">@{u.username}</span></strong>
                    <span className="text-red-400 block mt-0.5">{u.frozenReason}</span>
                  </div>
                  <button
                    onClick={() => handleUnfreeze(u.id)}
                    disabled={busyId === u.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer shrink-0"
                  >
                    Unfreeze
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KYC verification queue - separate from freeze, this is for new registrations */}
      <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-white">KYC Document Verification Queue</h3>
          <span className="text-[10px] text-slate-500">Manual compliance overrides</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {pendingUsers.length > 0 ? (
              pendingUsers.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => { setSelectedUser(user); setShowRejectForm(false); }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedUser?.id === user.id ? 'border-purple-600 bg-purple-950/10' : 'border-slate-800 bg-slate-900/60'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="text-xs text-white block">{user.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">@{user.username} • {user.email}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold">{user.tempId}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">No pending verification applicants found.</div>
            )}
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {selectedUser ? (
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">Document Inspector</h4>
                <div className="space-y-2 text-[11px] text-slate-300 font-mono">
                  <p>Verification Doc: <strong className="text-white">{selectedUser.verificationDocumentName || 'N/A'}</strong></p>
                  <p>Phone: <strong className="text-white">{selectedUser.phoneNumber || 'N/A'}</strong></p>
                  <p>Bank: <strong className="text-white">{selectedUser.bankName || 'Access Bank'}</strong></p>
                  <p>Account NUBAN: <strong className="text-white">{selectedUser.accountNumber || 'N/A'}</strong></p>
                </div>

                {!showRejectForm ? (
                  <div className="space-y-2 pt-2">
                    <button 
                      onClick={() => { onApproveUser(selectedUser.id); setSelectedUser(null); }}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Approve Registration
                    </button>
                    <button 
                      onClick={() => setShowRejectForm(true)}
                      className="w-full py-2 bg-slate-800 hover:bg-red-950/20 text-red-400 font-bold text-xs rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Reject Documents
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-red-400 block uppercase">Rejection Reason</label>
                    <input 
                      type="text" 
                      required
                      value={rejectionReason} 
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g., Mismatched document spelling"
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs focus:outline-none focus:border-red-500 text-white"
                    />
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { 
                          if (rejectionReason.trim()) {
                            onRejectUser(selectedUser.id, rejectionReason); 
                            setSelectedUser(null); 
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }
                        }}
                        className="flex-1 py-1.5 bg-red-600 text-white font-bold text-[10px] rounded cursor-pointer"
                      >
                        Submit Reject
                      </button>
                      <button onClick={() => setShowRejectForm(false)} className="px-2 py-1.5 bg-slate-800 text-slate-300 font-bold text-[10px] rounded cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-[11px]">Select a user queue item to inspect bank identity credentials.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};