import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingCart, Heart, Eye, EyeOff, ChevronLeft, Pencil, X, 
  Check as CheckIcon, SlidersHorizontal
} from 'lucide-react';
import { UserProfile } from '../types';

interface MarketHeaderProps {
  isLoggedIn: boolean;
  activeProfile: UserProfile | null;
  showBalance: boolean;
  setShowBalance: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  cartCount: number;
  setCartOpen: (val: boolean) => void;
  currentSlide: number;
  goToSlide: (index: number) => void;
  carouselMessages: any[];
  editingAccount: boolean;
  setEditingAccount: (val: boolean) => void;
  accountNumber: string;
  setAccountNumber: (val: string) => void;
  accountDraft: string;
  setAccountDraft: (val: string) => void;
  saveAccountNumber: () => void;
  cancelAccountEdit: () => void;
  activeFilterCount?: number;
  onOpenFilters?: () => void;
}

export default function MarketHeader({
  isLoggedIn,
  activeProfile,
  showBalance,
  setShowBalance,
  searchQuery,
  setSearchQuery,
  cartCount,
  setCartOpen,
  currentSlide,
  goToSlide,
  carouselMessages,
  editingAccount,
  setEditingAccount,
  accountNumber,
  accountDraft,
  setAccountDraft,
  saveAccountNumber,
  cancelAccountEdit,
  activeFilterCount = 0,
  onOpenFilters
}: MarketHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="px-4 pt-4 pb-2 sticky top-0 bg-[#F8F9FC] z-10 border-b border-slate-50">
      {isLoggedIn ? (
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 flex-1 max-w-[70%]">
            <div className="flex-1 min-w-0">
              <span className="block text-[8px] font-sans font-semibold text-slate-400 tracking-wide uppercase leading-none">Wallet Balance</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-sans font-black text-slate-950 truncate leading-none">
                  {showBalance ? `₦${(activeProfile?.walletBalance ?? 82000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦••••••'}
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0"
                >
                  {showBalance ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/favorites')}
              className="w-8 h-8 rounded-lg bg-[#F4F4F6] flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="w-8 h-8 rounded-lg bg-[#F4F4F6] flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors relative cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#7C3AED] text-white text-[8px] font-sans font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="relative h-10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.5}
                  onDragEnd={(_, info) => {
                    const SWIPE_THRESHOLD = 40;
                    if (info.offset.x < -SWIPE_THRESHOLD) {
                      goToSlide((currentSlide + 1) % carouselMessages.length);
                    } else if (info.offset.x > SWIPE_THRESHOLD) {
                      goToSlide((currentSlide - 1 + carouselMessages.length) % carouselMessages.length);
                    }
                  }}
                  className="absolute inset-0 flex flex-col justify-center cursor-grab active:cursor-grabbing touch-pan-y"
                >
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-sans font-black text-slate-950 tracking-tight leading-none">
                      {carouselMessages[currentSlide].text}
                    </h1>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {carouselMessages[currentSlide].subtext}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="flex gap-1 mt-0.5">
              {carouselMessages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-3 bg-[#7C3AED]' : 'w-1 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="w-8 h-8 rounded-lg bg-[#F4F4F6] flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors relative cursor-pointer ml-1"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#7C3AED] text-white text-[8px] font-sans font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Account Number Edit - Commented out as per your original */}
      {/* {isLoggedIn && (
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[9px] text-slate-400 font-medium">Account No:</span>
          {editingAccount ? (
            <div className="flex items-center gap-1">
              <input
                value={accountDraft}
                onChange={(e) => setAccountDraft(e.target.value)}
                className="w-28 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/30"
              />
              <button onClick={saveAccountNumber} className="text-emerald-600 hover:bg-emerald-50 rounded p-0.5 cursor-pointer">
                <CheckIcon className="w-3 h-3" />
              </button>
              <button onClick={cancelAccountEdit} className="text-slate-400 hover:bg-slate-100 rounded p-0.5 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingAccount(true)}
              className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 hover:text-[#7C3AED] transition-colors cursor-pointer"
            >
              {accountNumber}
              <Pencil className="w-2.5 h-2.5 text-slate-400" />
            </button>
          )}
        </div>
      )} */}

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isLoggedIn ? "Search products..." : "Search materials..."}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-sans text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
          />
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
        </div>
        {isLoggedIn && (
          <button
            onClick={onOpenFilters}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0 transition-colors cursor-pointer relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#7C3AED] text-white text-[8px] font-sans font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs border border-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}