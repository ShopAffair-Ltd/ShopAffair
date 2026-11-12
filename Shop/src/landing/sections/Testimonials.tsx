import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../services/api';

interface RealReview {
  id: string;
  rating: number;
  comment: string | null;
  reviewer: { name: string; username: string };
  seller: { name: string; storeName: string | null };
}

export const Testimonials: React.FC = () => {
  const [reviews, setReviews] = useState<RealReview[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ reviews: RealReview[] }>('/products/landing-summary')
      .then((res) => {
        if (!cancelled && Array.isArray(res.data?.reviews)) {
          setReviews(res.data.reviews.filter((r) => !!r.comment?.trim()));
        }
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only render real verified reviews from the database
  if (reviews.length === 0) return null;

  return (
    <section className="py-20 bg-purple-50/10 rounded-xl border border-purple-100/30 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">
            VERIFIED REVIEWS
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">What Our Traders Say</h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">
            Real feedback from completed ShopAffair trades.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-8 rounded-lg border border-purple-100/50 space-y-4 shadow-xs">
              <div className="flex gap-1">
                {[...Array(Math.max(1, Math.min(5, rev.rating)))].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{rev.reviewer.name}</h4>
                <span className="text-[10px] text-purple-600 font-medium">
                  @{rev.reviewer.username} • Reviewed {rev.seller.storeName || rev.seller.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
