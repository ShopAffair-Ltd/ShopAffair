import React, { useEffect, useState } from 'react';
import { fetchAllOrders, AdminOrder } from '../../services/adminService';

export const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllOrders().then((r) => setOrders(r.items)).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Orders</h3>
        <span className="text-[10px] text-slate-400">{orders.length} recent</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No orders yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <strong className="text-white block">{o.product.title}</strong>
                <span className="text-slate-400 font-mono">@{o.buyer.username} → @{o.seller.username} • ₦{Number(o.price).toLocaleString()}</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-slate-700/40 text-slate-300">{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};