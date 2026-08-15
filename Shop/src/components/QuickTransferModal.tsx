import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Send, Smartphone as PhoneIcon } from 'lucide-react';

interface QuickTransferModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickTransferModal({ open, onClose }: QuickTransferModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-45 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="bg-white w-full max-w-md rounded-t-lg shadow-2xl border-t border-slate-150"
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-3" />
            <div className="px-6 pb-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-sans font-black text-slate-900">Quick Transfer</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => alert('Airtime top-up coming soon.')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-colors cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Buy Airtime</span>
                  <span className="block text-[10px] text-slate-400">Top up any Nigerian network instantly</span>
                </div>
              </button>

              <button
                onClick={() => alert('Data bundle purchase coming soon.')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-colors cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Buy Data</span>
                  <span className="block text-[10px] text-slate-400">Affordable data bundles, all networks</span>
                </div>
              </button>

              <button
                onClick={() => alert('Wallet-to-wallet transfer coming soon.')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-colors cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Send Transfer</span>
                  <span className="block text-[10px] text-slate-400">Move funds to any bank account</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}