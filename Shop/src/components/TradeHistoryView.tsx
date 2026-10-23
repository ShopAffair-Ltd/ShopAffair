import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Info } from 'lucide-react';
import { TradeItem, EscrowStatus, TradeType } from '../types';

interface TradeHistoryViewProps {
    trades: TradeItem[];
    activeUsername: string;
    onSelectTrade: (id: string) => void;
    onCancelTrade: (tradeId: string) => Promise<void>;
    onBack: () => void;
}

// A trade is "unengaged" - cancelable and (once a real delete endpoint
// exists) deletable - only while it's still a draft/pending listing that
// the other party hasn't acted on yet: no buyer attached, no funds moved.
const isUnengaged = (trade: TradeItem) =>
    (trade.status === EscrowStatus.DRAFT || trade.status === EscrowStatus.PENDING) && !trade.buyerUsername;

export default function TradeHistoryView({ trades, activeUsername, onSelectTrade, onCancelTrade, onBack }: TradeHistoryViewProps) {
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

    // History is every trade the user has been party to (as creator or
    // buyer) that has left the live open-market/offer flow - completed,
    // cancelled, or disputed - plus their own unengaged listings they may
    // still want to cancel from here.
    const historyTrades = trades
        .filter(
            (t) =>
                t.creatorUsername === activeUsername || t.buyerUsername === activeUsername
        )
        .filter(
            (t) =>
                t.status === EscrowStatus.COMPLETED ||
                t.status === EscrowStatus.DISPUTED ||
                t.status === EscrowStatus.REFUNDED ||
                (t.creatorUsername === activeUsername && isUnengaged(t))
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleCancel = async (tradeId: string) => {
        setCancelingId(tradeId);
        try {
            await onCancelTrade(tradeId);
        } finally {
            setCancelingId(null);
            setConfirmCancelId(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white h-full overflow-hidden pb-24">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-slate-900">Trade History</h2>
            </div>

            <div className="mx-4 mb-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-sans text-slate-500 leading-relaxed">
                    A 1.3% platform fee is deducted from the seller's payout when a trade completes.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2.5">
                {historyTrades.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-sans text-slate-500 font-medium">No trade history yet.</p>
                    </div>
                ) : (
                    historyTrades.map((trade) => (
                        <motion.div
                            key={trade.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative p-4 bg-white border border-slate-100 rounded-2xl shadow-xs"
                        >
                            <div onClick={() => onSelectTrade(trade.id)} className="cursor-pointer space-y-1.5 pr-20">
                                <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider ${trade.type === TradeType.SUPPLY
                                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                            : 'bg-sky-50 text-sky-600 border border-sky-100'
                                        }`}
                                >
                                    {trade.type === TradeType.SUPPLY ? 'Supply Order' : 'Demand Order'}
                                </span>
                                <h3 className="text-sm font-sans font-extrabold text-slate-800 truncate">{trade.title}</h3>
                                <p className="text-sm font-sans font-black text-purple-600">₦{trade.amount.toLocaleString()}</p>
                            </div>

                            <div className="absolute top-4 right-4 text-[10px] font-mono font-bold uppercase tracking-wider">
                                <span
                                    className={`px-2 py-0.5 rounded-full ${trade.status === EscrowStatus.COMPLETED
                                            ? 'bg-green-50 text-green-600 border border-green-100'
                                            : trade.status === EscrowStatus.DISPUTED
                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                : trade.status === EscrowStatus.REFUNDED
                                                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    : 'bg-slate-50 text-slate-500 border border-slate-200/50'
                                        }`}
                                >
                                    {trade.status === EscrowStatus.REFUNDED ? 'CANCELLED' : trade.status}
                                </span>
                            </div>

                            {trade.creatorUsername === activeUsername && isUnengaged(trade) && (
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                                    {confirmCancelId === trade.id ? (
                                        <>
                                            <span className="text-[10px] font-sans text-slate-500 flex-1">Cancel this listing?</span>
                                            <button
                                                onClick={() => handleCancel(trade.id)}
                                                disabled={cancelingId === trade.id}
                                                className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-sans font-bold rounded-lg disabled:opacity-60"
                                            >
                                                {cancelingId === trade.id ? 'Cancelling...' : 'Yes, cancel'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmCancelId(null)}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-sans font-bold rounded-lg"
                                            >
                                                Keep it
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmCancelId(trade.id)}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-sans font-bold rounded-lg border border-red-100"
                                        >
                                            Cancel listing
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}