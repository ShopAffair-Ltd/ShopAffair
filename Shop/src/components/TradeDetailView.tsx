import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Share2 } from 'lucide-react';
import ShareToGroupModal from './community/ShareToGroupModal';
import { TradeItem, EscrowStatus } from '../types';
import { BuyerPickupCodeDisplay, SellerPickupCodeEntry, MAX_ATTEMPTS } from './EscrowPickupCode';

interface TradeDetailViewProps {
  trade: TradeItem;
  isSeller: boolean;
  isBuyer: boolean;
  onBack: () => void;
  onFundTrade: (tradeId: string) => Promise<void>;
  onVerifyPickupCode: (tradeId: string, code: string) => Promise<void>;
  onUpdateStatus: (tradeId: string, status: EscrowStatus) => Promise<void>;
  onEditTrade: (tradeId: string) => void;
  onCancelTrade: (tradeId: string) => Promise<void>;
}

const PIPELINE_STEPS = [
  { label: 'Draft', status: EscrowStatus.DRAFT },
  { label: 'Pending', status: EscrowStatus.PENDING },
  { label: 'Funded', status: EscrowStatus.FUNDED },
  { label: 'Completed', status: EscrowStatus.COMPLETED }
];
const PIPELINE_ORDER = [
  EscrowStatus.DRAFT,
  EscrowStatus.PENDING,
  EscrowStatus.FUNDED,
  EscrowStatus.DELIVERED,
  EscrowStatus.COMPLETED
];

export default function TradeDetailView({
  trade,
  isSeller,
  isBuyer,
  onBack,
  onFundTrade,
  onVerifyPickupCode,
  onUpdateStatus,
  onEditTrade,
  onCancelTrade
}: TradeDetailViewProps) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isFunding, setIsFunding] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleFund = async () => {
    setActionError(null);
    setIsFunding(true);
    try {
      await onFundTrade(trade.id);
    } catch (err: unknown) {
      console.error(err);
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(backendMessage ?? 'Could not fund escrow. Please try again.');
    } finally {
      setIsFunding(false);
    }
  };

  const handlePickupAttempt = async (code: string) => {
    try {
      await onVerifyPickupCode(trade.id, code);
    } catch (err) {
      throw err;
    }
  };

  const handleTriggerDispute = async () => {
    setActionError(null);
    try {
      await onUpdateStatus(trade.id, EscrowStatus.DISPUTED);
    } catch (err) {
      console.error(err);
      setActionError('Could not raise dispute. Please try again.');
    }
  };

  const handleCancelTrade = async () => {
    setActionError(null);
    setIsCancelling(true);
    try {
      await onCancelTrade(trade.id);
      setShowCancelConfirm(false);
    } catch (err: unknown) {
      console.error(err);
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionError(backendMessage ?? 'Could not cancel this trade. Please try again.');
      setShowCancelConfirm(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReleaseFunds = async () => {
    setActionError(null);
    try {
      await onUpdateStatus(trade.id, EscrowStatus.COMPLETED);
    } catch (err) {
      console.error(err);
      setActionError('Could not release funds. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono font-bold text-purple-600">TRADE {trade.id}</span>
        {isSeller ? (
          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 rounded-full text-slate-400 hover:text-purple-600 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      <ShareToGroupModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} tradeId={trade.id} />

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
          >
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">Cancel this trade?</h3>
              <p className="text-xs font-sans text-slate-500 mt-1.5 leading-relaxed">
                This will permanently cancel "{trade.title}". Buyers will no longer be able to fund or view this listing.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-sans font-bold text-xs rounded-lg cursor-pointer"
              >
                Keep Trade
              </button>
              <button
                onClick={handleCancelTrade}
                disabled={isCancelling}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-lg cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar pb-28"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="p-4 bg-slate-50 border border-slate-100 rounded-lg"
        >
          <span className="block text-[10px] font-sans font-bold tracking-wider text-slate-400 mb-3">ESCROW PIPELINE STATE</span>

          <div className="flex items-center justify-between relative">
            <div className="absolute left-4 right-4 top-4.5 h-0.5 bg-slate-200 -z-10" />

            {PIPELINE_STEPS.map((step, idx) => {
              const activeIdx = PIPELINE_ORDER.indexOf(trade.status);
              const stepIdx = PIPELINE_ORDER.indexOf(step.status);
              const isDone = activeIdx >= stepIdx;

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border font-sans font-bold text-xs ${
                      isDone ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] font-sans mt-1.5 font-bold ${isDone ? 'text-purple-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="space-y-3">
          <h2 className="text-lg font-sans font-extrabold text-slate-900 leading-snug">{trade.title}</h2>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-sans font-black text-slate-900">₦{trade.amount.toLocaleString()}</span>
            {trade.condition && (
              <span className="text-xs font-sans font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                {trade.condition}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white font-sans font-bold text-sm flex items-center justify-center">
              {trade.creatorName.charAt(0)}
            </div>
            <div>
              <span className="block text-xs font-sans font-bold text-slate-800">{trade.creatorName}</span>
              <span className="text-[10px] font-sans text-purple-600">@{trade.creatorUsername} • Trader</span>
            </div>
          </div>
        </motion.div>

        {trade.specs && Object.keys(trade.specs).length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="space-y-2">
            <span className="block text-xs font-sans font-bold text-slate-500 uppercase">Trade Specifications</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(trade.specs).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="block text-[9px] font-sans font-bold text-slate-400 uppercase">{key}</span>
                  <span className="text-xs font-sans font-bold text-slate-700">{val}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3 text-xs font-sans"
        >
          <span className="block text-[10px] font-sans font-bold tracking-wider text-slate-400 uppercase">Logistics & Escrow Parameters</span>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Take-off Location:</span>
            <span className="font-semibold text-slate-700">{trade.takeOffLocation || 'Ikeja, Lagos'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Destination:</span>
            <span className="font-semibold text-slate-700">{trade.deliveryLocation || 'Lekki Phase 1, Lagos'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Delivery Time:</span>
            <span className="font-semibold text-slate-700">{trade.deliveryTime}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
            <span className="text-slate-400 font-bold">Delivery Fee:</span>
            <span className="font-bold text-slate-800">₦{(trade.deliveryFee || 0).toLocaleString()}</span>
          </div>
        </motion.div>

        {actionError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-sans font-semibold">
            {actionError}
          </div>
        )}

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="space-y-2 pt-4">
          {trade.status === EscrowStatus.PENDING &&
            (isSeller ? (
              <div className="space-y-2">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <p className="text-xs font-sans text-slate-500">This is your listing. Waiting for a buyer to fund escrow.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onEditTrade(trade.id)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs rounded-lg cursor-pointer text-center"
                  >
                    Edit Trade
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-sans font-bold text-xs rounded-lg border border-red-100 cursor-pointer text-center"
                  >
                    Cancel Trade
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleFund}
                disabled={isFunding}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer text-center"
              >
                {isFunding ? 'Funding...' : `Fund Escrow Lock (₦${(trade.amount + trade.deliveryFee).toLocaleString()})`}
              </button>
            ))}

          {trade.status === EscrowStatus.FUNDED && (
            <div className="space-y-3">
              {isSeller ? (
                <SellerPickupCodeEntry
                  attempts={trade.pickupAttempts || 0}
                  locked={(trade.pickupAttempts || 0) >= MAX_ATTEMPTS}
                  onAttempt={handlePickupAttempt}
                />
              ) : isBuyer ? (
                <BuyerPickupCodeDisplay code={trade.pickupCode || ''} />
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
                  <p className="text-xs font-sans text-slate-500">
                    This trade is funded and awaiting pickup confirmation between the buyer and seller.
                  </p>
                </div>
              )}

              {(isSeller || isBuyer) && (
                <button
                  onClick={handleTriggerDispute}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-sans font-bold text-xs rounded-lg border border-red-100 cursor-pointer text-center"
                >
                  Trigger Disagreement/Dispute
                </button>
              )}
            </div>
          )}

          {trade.status === EscrowStatus.DELIVERED && (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100">
                <p className="text-[10px] font-sans font-bold leading-normal">
                  The merchant has submitted proof of delivery. Please inspect the assets carefully before releasing locked multi-sig funds!
                </p>
              </div>
              {isBuyer && (
                <button
                  onClick={handleReleaseFunds}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer text-center"
                >
                  Release Funds to Merchant (Complete)
                </button>
              )}
            </div>
          )}

          {trade.status === EscrowStatus.DISPUTED && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-red-600">Dispute Under Arbitration</span>
              <p className="text-xs font-sans leading-normal">
                This trade has been temporarily frozen. Our assigned compliance auditor is investigating chat logs, tracking tickets, and specifications.
              </p>
            </div>
          )}

          {trade.status === EscrowStatus.COMPLETED && (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-100 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <span className="block text-xs font-bold text-green-800">Trade Resolved & Released</span>
                <p className="text-[10px] font-sans leading-relaxed text-green-700 mt-0.5">
                  Secure escrow finalized. Funds disbursed to merchant's settlement account.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}