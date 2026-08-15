import React, { useEffect, useState } from 'react';
import { fetchSettings, updateSetting } from '../../services/settingsService';

export const SettingsTab: React.FC = () => {
  const [escrowFee, setEscrowFee] = useState('5');
  const [systemOnline, setSystemOnline] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then((s) => {
      if (s.escrow_fee) setEscrowFee(s.escrow_fee);
      if (s.system_online) setSystemOnline(s.system_online === 'true');
    }).catch(() => {});
  }, []);

  const save = async (key: string, value: string) => {
    setSaving(true);
    await updateSetting(key, value).catch(() => {});
    setSaving(false);
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Platform Settings</h3>
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div>
            <strong className="text-white block">Escrow Commission Fee (%)</strong>
            <span className="text-[10px] text-slate-400">Applied to completed trades</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={escrowFee}
              onChange={(e) => setEscrowFee(e.target.value)}
              className="w-16 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-white text-center"
            />
            <button
              disabled={saving}
              onClick={() => save('escrow_fee', escrowFee)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div>
            <strong className="text-white block">Platform Online</strong>
            <span className="text-[10px] text-slate-400">Toggle maintenance mode</span>
          </div>
          <button
            onClick={() => {
              const next = !systemOnline;
              setSystemOnline(next);
              save('system_online', String(next));
            }}
            className={`px-4 py-1.5 rounded-full font-bold text-[10px] cursor-pointer ${systemOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
          >
            {systemOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};