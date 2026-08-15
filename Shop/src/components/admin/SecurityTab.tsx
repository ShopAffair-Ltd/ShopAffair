import React, { useEffect, useState } from 'react';
import { fetchFrozenUsers, FrozenUser } from '../../services/adminService';

interface SecurityTabProps {
  setActiveSection: (section: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ setActiveSection }) => {
  const [frozenUsers, setFrozenUsers] = useState<FrozenUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFrozenUsers().then(setFrozenUsers).catch(() => setFrozenUsers([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Account Security Overview</h3>
      </div>

      <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-xs">
        <div>
          <strong className="text-white block">Frozen Accounts</strong>
          <span className="text-[10px] text-slate-400">Fully locked out, cannot log in</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-rose-400">{loading ? '—' : frozenUsers.length}</span>
          <button
            onClick={() => setActiveSection('Users')}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded cursor-pointer"
          >
            Manage
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed">
        Account freezing is managed from the Users tab. This platform does not collect BVN or biometric data.
      </p>
    </div>
  );
};