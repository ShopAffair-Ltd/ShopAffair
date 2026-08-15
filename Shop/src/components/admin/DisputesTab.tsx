import React from 'react';
import { EscrowStatus, TradeItem } from '../../types';

interface DisputesTabProps {
  trades: TradeItem[];
  onForceCancelTrade: (tradeId: string) => void;
}

export const DisputesTab: React.FC<DisputesTabProps> = ({ trades, onForceCancelTrade }) => {
  const disputedTrades = trades.filter(t => t.status === EscrowStatus.DISPUTED);

  const handleRuleRefund = (trade: TradeItem) => {
    onForceCancelTrade(trade.id);
    alert(`Dispute resolved! Escrow contract terminated and a full refund of ₦${trade.amount.toLocaleString()} is initiated for the buyer.`);
  };

  const handleRulePayout = (trade: TradeItem) => {
    alert(`Case completed! Escrow balance of ₦${trade.amount.toLocaleString()} has been forcefully disbursed to the seller's verified bank account.`);
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Escrow Dispute Mediation Office</h3>
        <span className="text-[10px] text-slate-400">Secure judicial overrides</span>
      </div>

      <div className="space-y-3 text-left">
        {disputedTrades.length > 0 ? (
          disputedTrades.map((t) => (
            <div key={t.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center">
                  <strong className="text-white text-xs">{t.title}</strong>
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">Disputed</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-1">
                  <p>Trade ID: {t.id} • Secure Vault: ₦{t.amount.toLocaleString()}</p>
                  <p>Buyer Account: @{t.creatorUsername} • Merchant: Multi-sig Locked</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button 
                  onClick={() => handleRuleRefund(t)}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded cursor-pointer text-center transition-colors"
                >
                  Rule: Refund Buyer
                </button>
                <button 
                  onClick={() => handleRulePayout(t)}
                  className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded cursor-pointer text-center transition-colors"
                >
                  Rule: Payout Seller
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500 text-xs">Zero active dispute reports found. Excellent trading trust!</div>
        )}
      </div>
    </div>
  );
};
