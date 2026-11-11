import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Send, Smartphone as PhoneIcon, Users, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { transferWalletToUser } from '../services/paymentService';

interface QuickTransferModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickTransferModal({ open, onClose }: QuickTransferModalProps) {
  const { openTransfer } = useWallet();
  const { user, updateUser } = useAuth();

  const [mode, setMode] = useState<'menu' | 'p2p'>('menu');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ recipientUsername: string; recipientName: string; amount: number; reference: string } | null>(null);

  const resetAndClose = () => {
    setMode('menu');
    setRecipientUsername('');
    setAmount('');
    setNote('');
    setError(null);
    setReceipt(null);
    onClose();
  };

  const handleP2pSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const numericAmount = Number(amount);
    if (!recipientUsername.trim()) {
      setError('Enter the recipient @username.');
      return;
    }
    if (!numericAmount || numericAmount < 100) {
      setError('Minimum wallet transfer amount is ₦100.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await transferWalletToUser({
        recipientUsername: recipientUsername.trim(),
        amount: numericAmount,
        note: note.trim() || undefined
      });
      updateUser({
        ...user,
        walletBalance: res.walletBalance
      });
      setReceipt({
        recipientUsername: res.recipient.username,
        recipientName: res.recipient.name,
        amount: res.amount,
        reference: res.reference
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Transfer could not be completed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
                <div className="flex items-center gap-2">
                  {mode === 'p2p' && !receipt && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('menu');
                        setError(null);
                      }}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <h3 className="text-sm font-sans font-black text-slate-900">
                    {mode === 'p2p' ? 'Wallet-to-Wallet Transfer' : 'Quick Transfer'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {mode === 'menu' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('p2p')}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-slate-900">ShopAffair Wallet Transfer</span>
                      <span className="block text-[10px] text-slate-400">Send instantly to another @username wallet</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetAndClose();
                      openTransfer();
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-slate-900">Withdraw to Bank Account</span>
                      <span className="block text-[10px] text-slate-400">Move funds to your verified Nigerian bank</span>
                    </div>
                  </button>

                  <div className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50/60 opacity-65 text-left">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <PhoneIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-slate-700">Buy Airtime</span>
                      <span className="block text-[10px] text-slate-400">Direct mobile airtime recharge</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Soon</span>
                  </div>

                  <div className="w-full flex items-center gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50/60 opacity-65 text-left">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-slate-700">Buy Data</span>
                      <span className="block text-[10px] text-slate-400">Mobile data bundles</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Soon</span>
                  </div>
                </>
              )}

              {mode === 'p2p' && receipt && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">₦{receipt.amount.toLocaleString()} Sent!</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Transferred to {receipt.recipientName} (@{receipt.recipientUsername})
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-2">Ref: {receipt.reference}</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="w-full py-3 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

              {mode === 'p2p' && !receipt && (
                <form onSubmit={handleP2pSubmit} className="space-y-3 text-xs">
                  {user && (
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Available Balance</span>
                      <strong className="text-slate-900 font-black">₦{Number(user.walletBalance || 0).toLocaleString()}</strong>
                    </div>
                  )}

                  {error && (
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Recipient Username</label>
                    <input
                      type="text"
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value)}
                      placeholder="@username"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (₦)</label>
                    <input
                      type="number"
                      min={100}
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 2000"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Note (Optional)</label>
                    <input
                      type="text"
                      maxLength={120}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What is this transfer for?"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#7C3AED] hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Sending Transfer...' : 'Send Money Now'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}