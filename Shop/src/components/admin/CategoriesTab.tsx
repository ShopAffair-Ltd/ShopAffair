import React, { useEffect, useState } from 'react';
import { fetchCategories, ProductCategory } from '../../services/adminService';

export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Product Categories</h3>
        <span className="text-[10px] text-slate-400">Live from listed products</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No products listed yet.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.name} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px]">
              <strong className="text-white">{c.name}</strong>
              <span className="text-slate-400 font-mono">{c.productCount} product(s)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};