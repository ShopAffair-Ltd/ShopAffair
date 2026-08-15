import React, { useEffect, useState } from 'react';
import { fetchAllReviews, deleteReview, AdminReview } from '../../services/adminService';

export const ReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllReviews().then((r) => setReviews(r.items)).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review?')) return;
    await deleteReview(id).catch(() => {});
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Reviews</h3>
        <span className="text-[10px] text-slate-400">{reviews.length} total</span>
      </div>
      {loading ? (
        <p className="text-[11px] text-slate-500 text-center py-6">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-[11px] text-slate-500 text-center py-6">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-white">@{r.reviewer.username} → @{r.seller.username} ({r.rating}★)</strong>
                <button onClick={() => handleDelete(r.id)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] rounded cursor-pointer">Delete</button>
              </div>
              <p className="text-slate-400">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};