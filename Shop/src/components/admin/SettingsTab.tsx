import React, { useEffect, useState } from 'react';
import { fetchSettings, updateSetting } from '../../services/settingsService';

export const SettingsTab: React.FC = () => {
  const [escrowFee, setEscrowFee] = useState('1.3');
  const [systemOnline, setSystemOnline] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        if (s.escrow_fee) setEscrowFee(s.escrow_fee);
        if (s.system_online) setSystemOnline(s.system_online === 'true');
      })
      .catch(() => {
        setStatusMessage({ type: 'error', text: 'Failed to load current platform settings.' });
      });
  }, []);

  const save = async (key: string, value: string, label: string) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await updateSetting(key, value);
      setStatusMessage({ type: 'success', text: `${label} saved successfully.` });
    } catch {
      setStatusMessage({ type: 'error', text: `Failed to save ${label.toLowerCase()}.` });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEscrowFee = () => {
    const num = Number(escrowFee);
    if (!Number.isFinite(num) || num < 0 || num > 25) {
      setStatusMessage({ type: 'error', text: 'Escrow fee must be between 0% and 25%.' });
      return;
    }
    save('escrow_fee', String(num), 'Escrow commission fee');
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Platform Settings</h3>
      </div>

      {statusMessage && (
        <div
          className={`px-3 py-2 rounded-xl text-[11px] font-medium border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="space-y-3.5 text-xs">
        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div>
            <strong className="text-white block">Escrow Commission Fee (%)</strong>
            <span className="text-[10px] text-slate-400">Applied to completed trades</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="25"
              step="0.1"
              value={escrowFee}
              onChange={(e) => setEscrowFee(e.target.value)}
              className="w-16 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-white text-center"
            />
            <button
              disabled={saving}
              onClick={handleSaveEscrowFee}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <div>
            <strong className="text-white block">Platform Online</strong>
            <span className="text-[10px] text-slate-400">Toggle maintenance mode</span>
          </div>
          <button
            disabled={saving}
            onClick={() => {
              const next = !systemOnline;
              setSystemOnline(next);
              save('system_online', String(next), 'Platform online status');
            }}
            className={`px-4 py-1.5 rounded-full font-bold text-[10px] cursor-pointer disabled:opacity-60 ${systemOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
          >
            {systemOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};