import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { fetchWalletTransactions, WalletTransaction } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS: Record<string, string> = {
  FUNDING: 'Wallet Funding',
  WITHDRAWAL: 'Withdrawal',
  ESCROW_LOCK: 'Escrow Locked',
  ESCROW_RELEASE: 'Escrow Released',
  REFUND: 'Refund',
  PLATFORM_FEE: 'Platform Fee'
};

const isInbound = (type: WalletTransaction['type']) =>
  type === 'FUNDING' || type === 'ESCROW_RELEASE' || type === 'REFUND';

const typeIcon = (type: WalletTransaction['type']) => {
  if (type === 'ESCROW_LOCK') return <ShieldCheck className="w-4 h-4" />;
  if (type === 'ESCROW_RELEASE') return <ShieldCheck className="w-4 h-4" />;
  if (type === 'WITHDRAWAL') return <Landmark className="w-4 h-4" />;
  return isInbound(type) ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />;
};

const statusStyles: Record<WalletTransaction['status'], string> = {
  SUCCESS: 'bg-green-50 text-green-600 border-green-100',
  PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
  FAILED: 'bg-red-50 text-red-600 border-red-100'
};

interface TransferHistoryViewProps {
  onBack: () => void;
}

export default function TransferHistoryView({ onBack }: TransferHistoryViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWalletTransactions({ page, limit: 20 });
        if (cancelled) return;
        setTransactions(result.items);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        if (!cancelled) setError('Could not load your transfer history. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden pb-24">
      <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-display font-bold text-slate-900">Transfer History</h2>
        <div className="w-8 h-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar bg-slate-50/50">
        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-3 font-sans">Loading your transfers...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-sm text-red-500 font-sans font-semibold mb-3">{error}</p>
            <button
              onClick={() => setPage((p) => p)}
              className="text-xs font-sans font-bold text-purple-600 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-sans font-semibold text-slate-600">No transfers yet</p>
            <p className="text-xs font-sans text-slate-400 mt-1">Deposits, withdrawals, and trade payments will show up here.</p>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const inbound = isInbound(tx.type);
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-purple-200 hover:shadow-sm cursor-pointer transition-all flex items-center gap-3 active:scale-[0.99]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${inbound ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {typeIcon(tx.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-sans font-bold text-slate-800 truncate">
                      {TYPE_LABELS[tx.type] || tx.type}
                    </p>
                    <p className="text-[11px] font-sans text-slate-400">
                      {new Date(tx.createdAt).toLocaleString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-sans font-bold ${inbound ? 'text-green-600' : 'text-slate-800'}`}>
                      {inbound ? '+' : '-'}₦{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-block text-[9px] font-sans font-bold uppercase px-2 py-0.5 rounded-full border mt-1 ${statusStyles[tx.status]}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 pb-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-sans font-bold text-purple-600 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-sans text-slate-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-sans font-bold text-purple-600 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* OPay-style Transaction Receipt Modal */}
      <AnimatePresence>
        {selectedTx && (() => {
          const inbound = isInbound(selectedTx.type);
          const ref = selectedTx.reference || selectedTx.id;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setSelectedTx(null)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wide">Transaction Details</span>
                  </div>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-2 ring-8 ring-green-50/50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-sans font-bold text-green-600 uppercase tracking-wider">
                    {selectedTx.status === 'SUCCESS' ? 'Transaction Successful' : selectedTx.status}
                  </p>
                  <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                    {inbound ? '+' : '-'}₦{Number(selectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </h3>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Description</span>
                    <span className="font-bold text-slate-800">{TYPE_LABELS[selectedTx.type] || selectedTx.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-green-100 text-green-700">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Payment Channel</span>
                    <span className="font-semibold text-slate-700">{selectedTx.provider || 'ShopAffair Wallet'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Date & Time</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(selectedTx.createdAt).toLocaleString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-400">Reference Number</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] text-slate-700 max-w-[140px] truncate">{ref}</span>
                      <button
                        onClick={() => handleCopyReference(ref)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {selectedTx.tradeId && (
                    <button
                      onClick={() => {
                        setSelectedTx(null);
                        navigate(`/trade/${selectedTx.tradeId}`);
                      }}
                      className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Linked Escrow Trade
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyReference(ref)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedRef ? 'Reference Copied to Clipboard!' : 'Copy Transaction Reference'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}