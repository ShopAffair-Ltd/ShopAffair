import React, { useEffect, useState } from 'react';
import { fetchAllProducts, deleteProduct, AdminProduct } from '../../services/adminService';

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchAllProducts().then((r) => setProducts(r.items)).catch(() => setProducts([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product listing?')) return;
    await deleteProduct(id).catch(() => {});
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Products</h3>
        <span className="text-[10px] text-slate-400">{products.length} listed</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No products yet.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <strong className="text-white block">{p.title}</strong>
                <span className="text-slate-400 font-mono">₦{Number(p.price).toLocaleString()} • @{p.seller.username} • {p.category}</span>
              </div>
              <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded cursor-pointer">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};