import React, { useEffect, useState } from 'react';
import { fetchVendors, AdminVendor } from '../../services/adminService';

export const VendorsTab: React.FC = () => {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors().then((r) => setVendors(r.items)).catch(() => setVendors([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Vendors</h3>
        <span className="text-[10px] text-slate-400">{vendors.length} sellers</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : vendors.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No sellers yet.</p>
      ) : (
        <div className="space-y-2">
          {vendors.map((v) => (
            <div key={v.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <strong className="text-white block">{v.name} <span className="text-slate-500 font-mono">@{v.username}</span></strong>
                <span className="text-slate-400 font-mono">{v.rating.toFixed(1)}★ • {v.totalSales} sales • {v.reviewsCount} reviews</span>
              </div>
              <div className="flex gap-1.5 items-center shrink-0">
                {v.isPro && <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 uppercase">Pro</span>}
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${v.isFrozen ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {v.isFrozen ? 'Frozen' : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};