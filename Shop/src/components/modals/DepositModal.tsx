import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { generateVirtualAccount, VirtualAccount } from '../../services/paymentService';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<void>;
  onAddAuditLog: (action: string, details: string, actor?: string) => void;
  activeUsername: string;
}

export default function DepositModal({ isOpen, onClose, onDeposit, onAddAuditLog, activeUsername }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [virtualAccountUnavailable, setVirtualAccountUnavailable] = useState(false);

  // On open, try to fetch (or provision) a dedicated virtual account so the
  // user can see a real transfer-to-fund option. If Paystack hasn't enabled
  // Dedicated NUBAN for this business yet, this fails gracefully and we just
  // show the "pay by card/transfer via checkout" flow instead - no error
  // shown to the user, since this is an expected state until approval.
  useEffect(() => {
    if (!isOpen) return;
    setVirtualAccount(null);
    setVirtualAccountUnavailable(false);

    generateVirtualAccount()
      .then(setVirtualAccount)
      .catch(() => setVirtualAccountUnavailable(true));
  }, [isOpen]);

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    setError(null);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      onAddAuditLog('WALLET_DEPOSIT_INITIATED', `Started checkout for ₦${amt.toLocaleString()}.`, activeUsername);
      await onDeposit(amt); // redirects the browser to Paystack on success
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not start payment. Please try again.';
      setError(message);
      setSubmitting(false);
    }
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
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-display font-bold text-slate-900">Fund Naira Wallet</h3>
              <p className="text-xs font-sans text-slate-500 mt-1">
                Pay by card, bank transfer, or USSD via Paystack checkout.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-sans font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enter Deposit amount (₦)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  disabled={submitting}
                  className="w-full text-sm font-sans px-3 py-2 border border-slate-200 rounded-xl disabled:opacity-60"
                />
              </div>

              {virtualAccount && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between text-slate-700">
                  <div>
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Or transfer directly to</span>
                    <strong className="font-mono text-sm text-slate-800">{virtualAccount.accountNumber}</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase">Bank</span>
                    <strong className="text-purple-700 text-xs">{virtualAccount.bankName}</strong>
                  </div>
                </div>
              )}

              {virtualAccountUnavailable && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Direct bank transfer accounts aren't set up yet - use checkout below to fund your wallet by card,
                  transfer, or USSD instead.
                </p>
              )}
            </div>

            <button
              onClick={handleDeposit}
              disabled={submitting}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                'Continue to Checkout'
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}