import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Landmark, X } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

interface AccountCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountNumber: string;
  bankName: string;
}

// Shown as its own step right after a new account's Paystack Dedicated
// Virtual Account has been generated - separate from the registration
// modal itself, so the person clearly sees "your account number is ready"
// as a distinct moment, with an explicit choice to fund now or skip.
export default function AccountCreatedModal({ isOpen, onClose, accountNumber, bankName }: AccountCreatedModalProps) {
  const { openDeposit } = useWallet();

  const handleFundNow = () => {
    onClose();
    openDeposit();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="h-1.5 w-full bg-purple-600" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-green-50 text-green-600">
                <CheckCircle2 className="w-7 h-7 stroke-[2]" />
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-slate-900">Your account is ready</h3>
                <p className="text-sm font-sans text-slate-500 mt-1">
                  This is your personal deposit account number. Fund your wallet anytime by transferring here.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 text-left">
                <Landmark className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold text-purple-400 uppercase">{bankName}</span>
                  <strong className="font-mono text-lg text-purple-800 tracking-wide">{accountNumber}</strong>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleFundNow}
                  className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 cursor-pointer"
                >
                  Fund my wallet now
                </button>
                <button
                  onClick={onClose}
                  className="w-full font-sans font-semibold text-sm text-slate-500 hover:text-slate-700 py-2.5 cursor-pointer"
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}