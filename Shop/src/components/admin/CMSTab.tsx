import React, { useEffect, useState } from 'react';
import { fetchSettings, updateSetting } from '../../services/settingsService';

export const CMSTab: React.FC = () => {
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then((s) => {
      setWelcomeTitle(s.landing_title ?? 'ShopFair Peer-to-Peer Secure Escrow Trading');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateSetting('landing_title', welcomeTitle).catch(() => {});
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Landing Page Content</h3>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Welcome Title</label>
          <input
            value={welcomeTitle}
            onChange={(e) => setWelcomeTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        {saved && <p className="text-emerald-400 text-[10px]">Saved.</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-[10px] rounded cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};