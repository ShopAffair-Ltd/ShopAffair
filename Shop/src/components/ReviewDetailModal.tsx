import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ThumbsUp, Flag, Heart, MessageCircle, ChevronRight, User } from 'lucide-react';

interface ReviewDetailModalProps {
  review: {
    id: string;
    reviewerName: string;
    reviewerUsername: string;
    rating: number;
    date: string;
    content: string;
    helpful: number;
    images?: string[];
  };
  seller: {
    id: string;
    name: string;
    username: string;
    storeName: string;
    avatar: string;
    rating: number;
    reviewsCount: number;
    isVerified?: boolean;
  };
  allReviews: any[];
  onClose: () => void;
  onVisitStore: (sellerId: string) => void;
  onChat: (sellerUsername: string, sellerName: string) => void;
}

export default function ReviewDetailModal({
  review,
  seller,
  allReviews,
  onClose,
  onVisitStore,
  onChat
}: ReviewDetailModalProps) {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);

  const handleHelpful = () => {
    if (isHelpful) {
      setHelpfulCount(helpfulCount - 1);
    } else {
      setHelpfulCount(helpfulCount + 1);
    }
    setIsHelpful(!isHelpful);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-sans font-bold text-slate-900">Review Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-4">
          {/* Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 stroke-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">{review.rating}.0</span>
            </div>
            <span className="text-[10px] text-slate-400">{review.date}</span>
          </div>

          {/* Reviewer */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 font-sans font-bold text-sm flex items-center justify-center">
              {review.reviewerName.charAt(0)}
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">{review.reviewerName}</span>
              <span className="text-[10px] text-slate-400">@{review.reviewerUsername}</span>
            </div>
            <button className="ml-auto text-purple-600 text-[10px] font-bold">View Profile</button>
          </div>

          {/* Review Content */}
          <div className="space-y-2">
            <p className="text-sm text-slate-700 leading-relaxed">{review.content}</p>
            {review.images && review.images.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {review.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-50">
                    <img src={img} alt="Review" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Helpful */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={handleHelpful}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-colors ${
                isHelpful ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isHelpful ? 'fill-purple-600' : ''}`} />
              Helpful ({helpfulCount})
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-sans font-bold">
              <Flag className="w-4 h-4" /> Report
            </button>
          </div>

          {/* Seller Info */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Review For</span>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white font-sans font-bold text-sm flex items-center justify-center">
                {seller.avatar || seller.name.charAt(0)}
                {seller.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-slate-800">{seller.storeName || seller.name}</span>
                <span className="text-[10px] text-slate-500">@{seller.username}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" /> {seller.rating}
                  </span>
                  <span className="text-[10px] text-slate-400">({seller.reviewsCount} reviews)</span>
                </div>
              </div>
              <button
                onClick={() => onChat(seller.username, seller.name)}
                className="text-[10px] font-bold text-purple-600 bg-white border border-purple-200 px-2.5 py-1.5 rounded-lg"
              >
                Chat
              </button>
            </div>
          </div>

          {/* All Reviews from this Seller */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">All Reviews from {seller.name}</span>
              <button 
                onClick={() => onVisitStore(seller.id)}
                className="text-[10px] text-purple-600 font-bold flex items-center gap-0.5"
              >
                Visit Store <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {allReviews.map((r) => (
                <div key={r.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-sans font-bold text-[10px] flex items-center justify-center">
                        {r.reviewerName.charAt(0)}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{r.reviewerName}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-2.5 h-2.5 ${i < r.rating ? 'fill-amber-400 stroke-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">{r.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visit Store Button */}
          <button
            onClick={() => onVisitStore(seller.id)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" /> Visit {seller.storeName || seller.name}'s Store
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}