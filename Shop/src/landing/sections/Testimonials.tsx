import React from 'react';
import { Star } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: 'Chinedu Okafor',
      role: 'Electronics Retailer',
      text: 'I sold 14 MacBooks this month using this escrow portal. No single issue, buyer funded instantly and shipping was automatically tracked.',
      rating: 5
    },
    {
      name: 'Amara Williams',
      role: 'Freelance Designer',
      text: 'Buying used phones in Lagos used to be extremely stressful. This platform eliminates all risk. I only approve release after I test the hardware.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-purple-50/10 rounded-xl border border-purple-100/30 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-extrabold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">MEMBER STORIES</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900">What Our Traders Say</h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">Real success stories from Nigeria's safest trading community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {reviews.map((rev, idx) => (
            <div key={idx} className="bg-white p-8 rounded-lg border border-purple-100/50 space-y-4 shadow-xs">
              <div className="flex gap-1">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs text-slate-500 italic leading-relaxed">"{rev.text}"</p>
              <div>
                <h4 className="text-xs font-black text-slate-900">{rev.name}</h4>
                <span className="text-[10px] text-purple-600 font-mono">{rev.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};