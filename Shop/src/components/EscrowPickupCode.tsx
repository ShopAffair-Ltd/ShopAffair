import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Copy, Check, ShieldAlert, Eye, EyeOff, Lock } from 'lucide-react';

const MAX_ATTEMPTS = 5;

export function generatePickupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface BuyerCodeDisplayProps {
  code: string;
}

export function BuyerPickupCodeDisplay({ code }: BuyerCodeDisplayProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
    }
  };

  return (
    <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg space-y-3">
      <div className="flex items-start gap-2.5">
        <KeyRound className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <span className="block text-xs font-sans font-bold text-purple-900">Your Pickup Code</span>
          <p className="text-[10px] font-sans text-purple-700 leading-relaxed mt-0.5">
            Give this code to the seller ONLY when you physically receive and inspect the item. They'll enter it to release your locked funds.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-white border border-purple-200 rounded-lg font-mono">
          {revealed ? (
            <span className="text-xl font-black tracking-[0.3em] text-slate-900">{code}</span>
          ) : (
            <span className="text-xl font-black tracking-[0.3em] text-slate-300 select-none">••••••</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="w-10 h-10 rounded-lg bg-white border border-purple-200 text-purple-600 flex items-center justify-center cursor-pointer hover:bg-purple-50 transition-colors shrink-0"
          aria-label={revealed ? 'Hide code' : 'Reveal code'}
        >
          {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!revealed}
          className="w-10 h-10 rounded-lg bg-white border border-purple-200 text-purple-600 flex items-center justify-center cursor-pointer hover:bg-purple-50 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] font-sans text-purple-600/80">
        <Lock className="w-3 h-3" />
        <span>Do not share this before the item is in your hands.</span>
      </div>
    </div>
  );
}

interface SellerCodeEntryProps {
  onAttempt: (code: string) => Promise<void>;
  attempts: number;
  locked: boolean;
}

export function SellerPickupCodeEntry({ onAttempt, attempts, locked }: SellerCodeEntryProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || checking || input.length !== 6) return;

    setError(null);
    setChecking(true);

    try {
      await onAttempt(input);
    } catch (e) {
      setError('Incorrect code. Ask the buyer to confirm and re-enter.');
      setInput('');
    } finally {
      setChecking(false);
    }
  };

  if (locked) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <div>
          <span className="block text-xs font-sans font-bold text-red-800">Too Many Failed Attempts</span>
          <p className="text-[10px] font-sans text-red-700 leading-relaxed mt-0.5">
            Pickup code entry has been locked for this trade. Please contact support or open a dispute if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
      <div className="flex items-start gap-2.5">
        <KeyRound className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="block text-xs font-sans font-bold text-slate-800">Enter Buyer's Pickup Code</span>
          <p className="text-[10px] font-sans text-slate-500 leading-relaxed mt-0.5">
            Ask the buyer for their 6-digit code once you've handed over the item. Entering it confirms receipt and releases your funds.
          </p>
        </div>
      </div>

      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full text-center text-lg font-mono font-black tracking-[0.3em] px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all"
      />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] font-sans font-semibold text-red-600 flex items-center gap-1.5 overflow-hidden"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <span className="text-[9px] font-sans text-slate-400">
          Attempts: {attempts}/{MAX_ATTEMPTS}
        </span>
        <button
          type="submit"
          disabled={input.length !== 6 || checking}
          className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-sans font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
        >
          {checking ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Confirm & Release Funds'
          )}
        </button>
      </div>
    </form>
  );
}

export { MAX_ATTEMPTS };