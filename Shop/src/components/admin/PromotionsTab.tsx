import React, { useEffect, useState } from 'react';
import { fetchPromoCodes, createPromoCode, togglePromoCode, deletePromoCode, PromoCode } from '../../services/settingsService';

export const PromotionsTab: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  const load = () => {
    fetchPromoCodes().then(setPromos).catch(() => setPromos([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newCode.trim() || !newDiscount) return;
    await createPromoCode(newCode.trim(), Number(newDiscount)).catch(() => {});
    setNewCode('');
    setNewDiscount('');
    load();
  };

  const handleToggle = async (id: string) => {
    await togglePromoCode(id).catch(() => {});
    load();
  };

  const handleDelete = async (id: string) => {
    await deletePromoCode(id).catch(() => {});
    load();
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Promo Codes</h3>
      </div>

      <div className="flex gap-2">
        <input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="CODE"
          className="flex-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
        />
        <input
          type="number"
          value={newDiscount}
          onChange={(e) => setNewDiscount(e.target.value)}
          placeholder="% off"
          className="w-20 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
        />
        <button onClick={handleCreate} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded cursor-pointer">Add</button>
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : promos.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No promo codes yet.</p>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <strong className="text-white font-mono">{p.code}</strong>
                <span className="text-slate-400 ml-2">{p.discountPct}% off</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleToggle(p.id)} className={`px-2.5 py-1 font-bold text-[9px] rounded cursor-pointer ${p.active ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleDelete(p.id)} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] rounded cursor-pointer">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};