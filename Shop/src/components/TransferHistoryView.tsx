import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw, Landmark, ShieldCheck, Clock } from 'lucide-react';
import { fetchWalletTransactions, WalletTransaction } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS: Record<WalletTransaction['type'], string> = {
  FUNDING: 'Wallet Funding',
  WITHDRAWAL: 'Withdrawal',
  ESCROW_LOCK: 'Escrow Locked',
  ESCROW_RELEASE: 'Escrow Released',
  REFUND: 'Refund'
};

const isInbound = (type: WalletTransaction['type']) => type === 'FUNDING' || type === 'ESCROW_RELEASE' || type === 'REFUND';

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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
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
              className="text-xs font-sans font-bold text-purple-600 hover:underline"
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
                  className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    inbound ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {typeIcon(tx.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-sans font-bold text-slate-800 truncate">
                      {TYPE_LABELS[tx.type]}
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
                      {inbound ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
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
              className="px-3 py-1.5 text-xs font-sans font-bold text-purple-600 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs font-sans text-slate-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-sans font-bold text-purple-600 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}