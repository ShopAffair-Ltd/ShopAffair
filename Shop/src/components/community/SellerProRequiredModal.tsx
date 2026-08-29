import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Sparkles, Loader2 } from 'lucide-react';
import { STARTER_PLAN_PRICE_DISPLAY } from '../../services/paymentService';

interface SellerProRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'not-seller' | 'not-pro';
  onSubscribe?: () => void;
  subscribing?: boolean;
  subscribeError?: string | null;
}

export default function SellerProRequiredModal({
  isOpen,
  onClose,
  reason,
  onSubscribe,
  subscribing,
  subscribeError
}: SellerProRequiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden"
          >
            <div className="h-1.5 w-full bg-amber-500" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 text-amber-600">
                {reason === 'not-seller' ? <Lock className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
              </div>

              {reason === 'not-seller' ? (
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">Sellers only</h3>
                  <p className="text-sm font-sans text-slate-500 mt-1">
                    Only seller accounts can create trade groups. Buyers can join a group once an admin adds them.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900">Upgrade to the Starter Plan</h3>
                  <p className="text-sm font-sans text-slate-500 mt-1">
                    You need the Starter Plan before you can create a trade group. It's {STARTER_PLAN_PRICE_DISPLAY}/month, charged from your wallet balance.
                  </p>
                </div>
              )}

              {subscribeError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100 text-left">
                  {subscribeError}
                </div>
              )}

              {reason === 'not-pro' && onSubscribe && (
                <button
                  onClick={onSubscribe}
                  disabled={subscribing}
                  className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {subscribing ? 'Upgrading...' : `Upgrade for ${STARTER_PLAN_PRICE_DISPLAY}`}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full font-sans font-semibold text-sm text-slate-500 hover:text-slate-700 py-2.5 cursor-pointer"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}