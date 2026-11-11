import React, { useState } from 'react';
import { EscrowStatus, TradeItem } from '../../types';

interface DisputesTabProps {
  trades: TradeItem[];
  onForceCancelTrade: (tradeId: string) => Promise<TradeItem>;
  onForceReleaseTrade: (tradeId: string) => Promise<TradeItem>;
}

export const DisputesTab: React.FC<DisputesTabProps> = ({
  trades,
  onForceCancelTrade,
  onForceReleaseTrade
}) => {
  const disputedTrades = trades.filter((t) => t.status === EscrowStatus.DISPUTED);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRuleRefund = async (trade: TradeItem) => {
    setProcessingId(trade.id);
    setStatusMessage(null);
    try {
      await onForceCancelTrade(trade.id);
      setStatusMessage({
        type: 'success',
        text: `Dispute resolved: "${trade.title}" refunded (₦${trade.amount.toLocaleString()}) to buyer.`
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not process buyer refund.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRulePayout = async (trade: TradeItem) => {
    setProcessingId(trade.id);
    setStatusMessage(null);
    try {
      await onForceReleaseTrade(trade.id);
      setStatusMessage({
        type: 'success',
        text: `Dispute resolved: escrow for "${trade.title}" (₦${trade.amount.toLocaleString()}) released to seller.`
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not release escrow payout to seller.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Escrow Dispute Mediation Office</h3>
        <span className="text-[10px] text-slate-400">
          {disputedTrades.length} active {disputedTrades.length === 1 ? 'case' : 'cases'}
        </span>
      </div>

      {statusMessage && (
        <div
          className={`px-3 py-2 rounded-xl text-[11px] font-medium border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="space-y-3 text-left">
        {disputedTrades.length > 0 ? (
          disputedTrades.map((t) => {
            const isBusy = processingId === t.id;
            return (
              <div key={t.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center">
                    <strong className="text-white text-xs">{t.title}</strong>
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Disputed</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-1">
                    <p>Trade ID: {t.id} • Escrow: ₦{t.amount.toLocaleString()}</p>
                    <p>
                      Seller: @{t.creatorUsername} • Buyer: {t.buyerUsername ? `@${t.buyerUsername}` : 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleRuleRefund(t)}
                    disabled={isBusy}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-[10px] rounded cursor-pointer text-center transition-colors"
                  >
                    {isBusy ? 'Processing...' : 'Rule: Refund Buyer'}
                  </button>
                  <button
                    onClick={() => handleRulePayout(t)}
                    disabled={isBusy}
                    className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-[10px] rounded cursor-pointer text-center transition-colors"
                  >
                    {isBusy ? 'Processing...' : 'Rule: Payout Seller'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-500 text-xs">Zero active dispute reports found. Excellent trading trust!</div>
        )}
      </div>
    </div>
  );
};
