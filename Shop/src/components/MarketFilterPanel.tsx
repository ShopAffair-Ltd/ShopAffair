import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin } from 'lucide-react';
import { MarketProduct } from '../types';

interface MarketFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  location: string;
  setLocation: (val: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  condition: MarketProduct['condition'] | '';
  setCondition: (val: MarketProduct['condition'] | '') => void;
  onClear: () => void;
}

const CONDITIONS: MarketProduct['condition'][] = ['New', 'Like New', 'Gently Used', 'Fair'];

export default function MarketFilterPanel({
  isOpen,
  onClose,
  location,
  setLocation,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  condition,
  setCondition,
  onClear
}: MarketFilterPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-5 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-slate-900">Filter Products</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Location</label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Ikeja"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-sans border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600"
                />
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Price Range (₦)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2.5 text-sm font-sans border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600"
                />
                <span className="text-slate-300 shrink-0">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2.5 text-sm font-sans border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCondition(condition === c ? '' : c)}
                    className={`py-2.5 text-xs font-sans font-bold rounded-xl border transition-all cursor-pointer ${
                      condition === c
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClear}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-sans font-bold text-xs rounded-xl border border-slate-200/50 transition-all cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Show Results
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
