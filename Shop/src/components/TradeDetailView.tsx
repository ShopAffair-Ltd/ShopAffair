import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, Share2, Copy, Image as ImageIcon, ZoomIn, X, RefreshCw, MapPin, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import ShareToGroupModal from './community/ShareToGroupModal';
import QrShareModal from './modals/QrShareModal';
import { TradeItem, EscrowStatus } from '../types';
import { BuyerPickupCodeDisplay, SellerPickupCodeEntry, MAX_ATTEMPTS } from './EscrowPickupCode';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useTrades } from '../context/TradeContext';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openDeposit } = useWallet();
  const { openLogin } = useAuthModal();
  const { buyAgainTrade } = useTrades();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isFunding, setIsFunding] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTradeQrModal, setShowTradeQrModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  // Buy Again checkout modal state
  const [showBuyAgainModal, setShowBuyAgainModal] = useState(false);
  const [buyAgainDestination, setBuyAgainDestination] = useState(
    trade.deliveryLocation || user?.deliveryAddress || ''
  );
  const [isBuyingAgain, setIsBuyingAgain] = useState(false);
  const [buyAgainError, setBuyAgainError] = useState<string | null>(null);

  const productImages: string[] = trade.image
    ? (() => {
        if (trade.image.startsWith('[')) {
          try {
            const parsed = JSON.parse(trade.image);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
          } catch {}
        }
        if (trade.image.includes(',')) {
          return trade.image.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [trade.image];
      })()
    : [];

  const escrowTotal = trade.amount + trade.deliveryFee;
  const hasInsufficientBalance = !!user && user.walletBalance < escrowTotal;

  const handleFund = async () => {
    if (!user) {
      openLogin();
      return;
    }
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
    if (!window.confirm('Are you sure you want to raise a dispute and freeze this trade for compliance review?')) {
      return;
    }
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

  const handleOpenBuyAgain = () => {
    if (!user) {
      openLogin();
      return;
    }
    setBuyAgainDestination(trade.deliveryLocation || user.deliveryAddress || '');
    setBuyAgainError(null);
    setShowBuyAgainModal(true);
  };

  const handleConfirmBuyAgain = async () => {
    if (!buyAgainDestination.trim()) {
      setBuyAgainError('Please provide your delivery destination.');
      return;
    }
    if (user && user.walletBalance < escrowTotal) {
      setBuyAgainError('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }
    setBuyAgainError(null);
    setIsBuyingAgain(true);
    try {
      const newTrade = await buyAgainTrade(trade.id, buyAgainDestination.trim());
      setShowBuyAgainModal(false);
      navigate(`/trade/${newTrade.id}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setBuyAgainError(msg || 'Failed to place re-order. Please try again.');
    } finally {
      setIsBuyingAgain(false);
    }
  };

  // Escrow release must go through the verified 6-digit pickup code or admin dispute resolution.

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/trade/${trade.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trade.title,
          text: `View this trade on ShopAffair (ID: ${trade.id}) — ₦${trade.amount.toLocaleString()}`,
          url,
        });
        return;
      } catch {
        // fall through to clipboard if share sheet is dismissed/unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    } catch {
      alert(`Copy this trade link:\n${url}`);
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
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => setShowTradeQrModal(true)}
            className="px-2.5 py-1 rounded-full text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-sans font-bold"
            title="Share Trade QR & WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
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
          <span className="block text-[10px] font-sans font-bold tracking-wider text-slate-400 mb-3">TRADE STATUS</span>

          <div className="flex items-center justify-between relative">
            <div className="absolute left-4 right-4 top-4.5 h-0.5 bg-slate-200 -z-10" />

            {PIPELINE_STEPS.map((step, idx) => {
              const activeIdx = PIPELINE_ORDER.indexOf(trade.status);
              const stepIdx = PIPELINE_ORDER.indexOf(step.status);
              const isCompleted =
                stepIdx < activeIdx ||
                (trade.status === EscrowStatus.COMPLETED && stepIdx === activeIdx);
              const isCurrent =
                stepIdx === activeIdx && trade.status !== EscrowStatus.COMPLETED;

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border font-sans font-bold text-xs ${
                      isCompleted
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : isCurrent
                        ? 'bg-purple-50 text-purple-600 border-2 border-purple-600 shadow-sm'
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-sans mt-1.5 font-bold ${
                      isCompleted || isCurrent ? 'text-purple-600' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Product Images Gallery */}
        {productImages.length > 0 ? (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="space-y-2.5"
          >
            <div
              onClick={() => setShowFullImage(true)}
              className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs relative cursor-pointer group"
            >
              <img
                src={productImages[activeImageIndex] || productImages[0]}
                alt={trade.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>
              {productImages.length > 1 && (
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-sans font-bold backdrop-blur-sm">
                  {activeImageIndex + 1} / {productImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip if multiple images */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-purple-600 ring-2 ring-purple-600/20'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="w-full h-36 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1.5"
          >
            <ImageIcon className="w-7 h-7 text-slate-300" />
            <span className="text-[11px] font-sans font-medium text-slate-400">No product photo uploaded</span>
          </motion.div>
        )}

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

          {trade.description && (
            <p className="text-xs font-sans text-slate-500 leading-relaxed whitespace-pre-line">
              {trade.description}
            </p>
          )}
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
            ) : isBuyer ? (
              <div className="space-y-2">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center">
                  <p className="text-xs font-sans text-purple-700 font-bold">You have placed an order on this trade.</p>
                  <p className="text-[10px] font-sans text-purple-600 mt-0.5">Funds are awaiting seller processing or pickup code generation.</p>
                </div>
                <button
                  onClick={handleOpenBuyAgain}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Buy Again (New Order)
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {hasInsufficientBalance && (
                  <button
                    onClick={openDeposit}
                    className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-sans font-bold text-xs rounded-lg border border-amber-200 cursor-pointer text-center"
                  >
                    Fund Wallet (balance too low for this trade)
                  </button>
                )}
                <button
                  onClick={handleFund}
                  disabled={isFunding || hasInsufficientBalance}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer text-center"
                >
                  {isFunding ? 'Processing Payment...' : `Pay Now (₦${escrowTotal.toLocaleString()})`}
                </button>
              </div>
            ))}

          {trade.status === EscrowStatus.FUNDED && (
            <div className="space-y-3">
              {isSeller ? (
                <SellerPickupCodeEntry
                  attempts={trade.pickupAttempts || 0}
                  locked={(trade.pickupAttempts || 0) >= MAX_ATTEMPTS}
                  onAttempt={handlePickupAttempt}
                  tradeAmount={trade.amount}
                  deliveryFee={trade.deliveryFee}
                />
              ) : isBuyer ? (
                <div className="space-y-3">
                  <BuyerPickupCodeDisplay code={trade.pickupCode || ''} />
                  <button
                    onClick={handleOpenBuyAgain}
                    className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-sans font-bold text-xs rounded-lg border border-purple-200 cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Buy Another One (New Order)
                  </button>
                </div>
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
                  Delivery is marked in progress. Share your 6-digit pickup code with the seller only after inspecting the item, or open a dispute if there is an issue.
                </p>
              </div>
              <button
                onClick={handleTriggerDispute}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-sans font-bold text-xs rounded-lg border border-red-200 cursor-pointer text-center"
              >
                Open Dispute
              </button>
            </div>
          )}

          {trade.status === EscrowStatus.DISPUTED && (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-red-600">Dispute Under Arbitration</span>
                <p className="text-xs font-sans leading-normal">
                  This trade has been temporarily frozen. Our assigned compliance auditor is investigating chat logs, tracking tickets, and specifications.
                </p>
              </div>
              {isSeller && (
                <SellerPickupCodeEntry
                  attempts={trade.pickupAttempts || 0}
                  locked={(trade.pickupAttempts || 0) >= MAX_ATTEMPTS}
                  onAttempt={handlePickupAttempt}
                  tradeAmount={trade.amount}
                  deliveryFee={trade.deliveryFee}
                />
              )}
              {isBuyer && <BuyerPickupCodeDisplay code={trade.pickupCode || ''} />}
            </div>
          )}

          {trade.status === EscrowStatus.COMPLETED && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-100 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-green-800">Trade Resolved & Released</span>
                  <p className="text-[10px] font-sans leading-relaxed text-green-700 mt-0.5">
                    Secure escrow finalized. Funds disbursed to merchant's settlement account.
                  </p>
                </div>
              </div>

              {!isSeller && (
                <button
                  onClick={handleOpenBuyAgain}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Buy Again (Place New Order)
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      <QrShareModal
        isOpen={showTradeQrModal}
        onClose={() => setShowTradeQrModal(false)}
        kind="trade"
        title={trade.title}
        subtitle={`₦${trade.amount.toLocaleString()} • ${trade.creatorUsername ? `@${trade.creatorUsername}` : 'Escrow Trade'}`}
        url={`${window.location.origin}/trade/${trade.id}`}
        imageUrl={productImages[0] || trade.image}
        badgeText="ESCROW TRADE"
      />

      {/* Buy Again Checkout Modal */}
      <AnimatePresence>
        {showBuyAgainModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isBuyingAgain && setShowBuyAgainModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Buy Again</h3>
                    <p className="text-[11px] text-gray-500">Re-order directly via Escrow</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBuyAgainModal(false)}
                  disabled={isBuyingAgain}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Product Summary */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {productImages[0] ? (
                      <img src={productImages[0]} alt={trade.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{trade.title}</h4>
                    <p className="text-[11px] text-purple-600 font-medium">@{trade.creatorUsername}</p>
                    <p className="text-xs font-extrabold text-gray-900 mt-0.5">₦{trade.amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Delivery Destination Input */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    Delivery Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={buyAgainDestination}
                    onChange={(e) => setBuyAgainDestination(e.target.value)}
                    placeholder="e.g. 12 Broad Street, Marina, Lagos"
                    disabled={isBuyingAgain}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Specify where the seller should deliver this new order.</p>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Item Price</span>
                    <span className="font-semibold text-gray-900">₦{trade.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-gray-900">₦{(trade.deliveryFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
                    <span>Total Escrow Amount</span>
                    <span className="text-purple-600">₦{escrowTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Wallet Balance Info */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-[10px] font-medium text-gray-500">Your Wallet Balance</p>
                      <p className="text-xs font-bold text-gray-900">₦{(user?.walletBalance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {user && user.walletBalance < escrowTotal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowBuyAgainModal(false);
                        openDeposit();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-100"
                    >
                      Top Up
                    </button>
                  )}
                </div>

                {/* Insufficient balance / errors */}
                {user && user.walletBalance < escrowTotal && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[11px]">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Your wallet balance is insufficient for this trade. Please top up your wallet to continue.</span>
                  </div>
                )}

                {buyAgainError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-[11px]">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{buyAgainError}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBuyAgainModal(false)}
                  disabled={isBuyingAgain}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBuyAgain}
                  disabled={isBuyingAgain || (!!user && user.walletBalance < escrowTotal)}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isBuyingAgain ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    'Confirm & Pay via Escrow'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Image Lightbox Modal */}
      <AnimatePresence>
        {showFullImage && productImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowFullImage(false)}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-3xl max-h-[85vh] w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={productImages[activeImageIndex] || productImages[0]}
                alt={trade.title}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
              {productImages.length > 1 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx ? 'border-purple-500 scale-105' : 'border-white/30 opacity-60'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}