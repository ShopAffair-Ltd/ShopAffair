import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Gift } from 'lucide-react';

interface RedeemPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<{ ok: boolean; message: string }>;
}

export default function RedeemPromoModal({ isOpen, onClose, onRedeem }: RedeemPromoModalProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Enter a promo code');
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await onRedeem(code.trim());

    if (result.ok) {
      setSuccessMessage(result.message);
      setCode('');
    } else {
      setError(result.message);
    }

    setSubmitting(false);
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Gift className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Redeem a Promo Code</h3>
              <p className="text-xs font-sans text-slate-500 mt-1">
                Credit added here can only be used for in-app services like store plans — it can't be withdrawn or used to fund trades.
              </p>
            </div>

            {successMessage ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-xs font-sans font-semibold text-center">
                {successMessage}
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-sans font-semibold">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Promo Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME2000"
                    disabled={submitting}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full text-sm font-sans font-mono tracking-wide px-3 py-2.5 border border-slate-200 rounded-xl disabled:opacity-60 uppercase"
                  />
                </div>
              </>
            )}

            <button
              onClick={successMessage ? handleClose : handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redeeming...
                </>
              ) : successMessage ? (
                'Done'
              ) : (
                'Redeem Code'
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
