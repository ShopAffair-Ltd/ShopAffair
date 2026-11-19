import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Loader2, Sparkles, Check, Crown, Zap, Store, RefreshCw, AlertCircle, Wallet } from 'lucide-react';
import { StorePlanId, fetchSubscriptionStatus, SubscriptionStatus } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';

interface StoreUpgradeModalProps {
  isOpen: boolean;
  selectedStorePlan: StorePlanId | null;
  activating: boolean;
  activateError: string | null;
  onClose: () => void;
  onSelectPlan: (plan: StorePlanId | null) => void;
  onActivatePlan: (plan: StorePlanId, months?: number) => Promise<boolean>;
  onAddAuditLog: (type: string, message: string, actor: string) => void;
  onNavigateToMyStore: () => void;
  activeUsername: string;
  isSeller?: boolean;
  storePlan?: StorePlanId | string | null;
  isPro?: boolean;
}

interface PlanInfo {
  name: string;
  monthlyPrice: number;
  originalMonthlyPrice: number;
  minMonths: number;
  capacityLabel: string;
  listingLimitLabel: string;
  badge?: string;
  icon: typeof Store;
  color: string;
  bullets: string[];
  discountLabel: string;
  subLabel: string;
}

const PLAN_DETAILS: Record<StorePlanId, PlanInfo> = {
  TRIAL: {
    name: 'Trial Plan',
    originalMonthlyPrice: 1000,
    monthlyPrice: 499.9,
    minMonths: 3,
    capacityLabel: '5 people limit',
    listingLimitLabel: '5 products',
    badge: '5-Person Limit',
    icon: Store,
    color: 'from-slate-600 to-slate-800',
    bullets: [
      '5 customer engagement slots',
      '5 product listings',
      'Wallet balance only (No promo credits)'
    ],
    discountLabel: 'Discount ₦499.9/mo',
    subLabel: '(₦1,499.7 for 3 months min)'
  },
  STARTER: {
    name: 'Standard (Starter) Plan',
    originalMonthlyPrice: 5000,
    monthlyPrice: 3500,
    minMonths: 1,
    capacityLabel: '1,000 members',
    listingLimitLabel: '250 products',
    badge: 'Recommended',
    icon: Sparkles,
    color: 'from-purple-600 to-indigo-600',
    bullets: [
      '1,000 member capacity',
      '250 product listings • Open Market',
      'Promo & bonus credits applicable!'
    ],
    discountLabel: 'Discount ₦3,500/mo',
    subLabel: '(Pay per month or for 3 months)'
  },
  GROWTH: {
    name: 'Growth Plan',
    originalMonthlyPrice: 18000,
    monthlyPrice: 12000,
    minMonths: 1,
    capacityLabel: '5,000 members',
    listingLimitLabel: '1,000 products',
    badge: 'High Capacity',
    icon: Zap,
    color: 'from-blue-600 to-cyan-600',
    bullets: [
      '5,000 member capacity',
      '1,000 product listings • Open Market',
      'Priority seller support'
    ],
    discountLabel: 'Discount ₦12,000/mo',
    subLabel: '(Ideal for expanding wholesale)'
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    originalMonthlyPrice: 35000,
    monthlyPrice: 25000,
    minMonths: 1,
    capacityLabel: '50,000+ members',
    listingLimitLabel: '10,000 products',
    badge: 'Max Capacity',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    bullets: [
      '50,000+ member capacity',
      '10,000 products • VIP Featured status',
      'Dedicated account manager'
    ],
    discountLabel: 'Discount ₦25,000/mo',
    subLabel: '(Full high-volume catalog power)'
  }
};

const DURATION_OPTIONS = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '1 Year' }
];

const formatNaira = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 !== 0 ? 1 : 0,
    maximumFractionDigits: 2
  });
};

export default function StoreUpgradeModal({
  isOpen,
  selectedStorePlan,
  activating,
  activateError,
  onClose,
  onSelectPlan,
  onActivatePlan,
  onAddAuditLog,
  onNavigateToMyStore,
  activeUsername,
  isSeller,
  storePlan,
  isPro
}: StoreUpgradeModalProps) {
  const { user } = useAuth();
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (!isOpen || !activeUsername || activeUsername === 'guest') return;
    fetchSubscriptionStatus()
      .then((status) => {
        setSubStatus(status);
      })
      .catch(() => {});
  }, [isOpen, activeUsername]);

  const isExistingMerchant = Boolean(
    isSeller ||
    isPro ||
    storePlan ||
    subStatus?.hasPaidBefore ||
    subStatus?.isExpired
  );

  const calculateTotalPrice = (planId: StorePlanId, months: number): { total: number; validMonths: number } => {
    const plan = PLAN_DETAILS[planId];
    const validMonths = Math.max(plan.minMonths, months);
    const rawTotal = plan.monthlyPrice * validMonths;
    const total = Math.round(rawTotal * 100) / 100;
    return { total, validMonths };
  };

  const handleChoosePlan = (planId: StorePlanId) => {
    const plan = PLAN_DETAILS[planId];
    if (selectedMonths < plan.minMonths) {
      setSelectedMonths(plan.minMonths);
    }
    onSelectPlan(planId);
  };

  const handleConfirm = async () => {
    if (!selectedStorePlan) return;
    const plan = PLAN_DETAILS[selectedStorePlan];
    const { validMonths } = calculateTotalPrice(selectedStorePlan, selectedMonths);
    const success = await onActivatePlan(selectedStorePlan, validMonths);
    if (success) {
      onAddAuditLog(
        `SUBSCRIBE_${selectedStorePlan}`,
        `${isExistingMerchant ? 'Renewed' : 'Activated'} ${plan.name} for ${validMonths} month(s).`,
        activeUsername
      );
      onNavigateToMyStore();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 max-w-md w-full border border-slate-100 shadow-2xl relative my-auto max-h-[88vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <AnimatePresence mode="wait">
              {!selectedStorePlan ? (
                <motion.div
                  key="plan-list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3 overflow-y-auto pr-1"
                >
                  <div className="text-center space-y-0.5 pt-0.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 text-lg flex items-center justify-center mx-auto shadow-xs">
                      {isExistingMerchant ? '🔄' : '🏪'}
                    </div>
                    <h3 className="text-sm sm:text-base font-display font-bold text-slate-900">
                      {isExistingMerchant
                        ? (subStatus?.isExpired ? 'Renew Store Plan' : 'Renew / Upgrade Store Plan')
                        : 'Open a Merchant Store'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-sans text-slate-500 leading-snug">
                      {isExistingMerchant
                        ? 'Renew your subscription to maintain your catalogue, member capacity, and Open Market visibility.'
                        : 'Choose a plan to activate your store dashboard, catalogue, and store wall.'}
                    </p>
                  </div>

                  {/* Billing Duration Selector */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
                      Choose Billing Duration
                    </label>
                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100/90 rounded-lg">
                      {DURATION_OPTIONS.map((d) => {
                        const isSelected = selectedMonths === d.months;
                        return (
                          <button
                            key={d.months}
                            type="button"
                            onClick={() => setSelectedMonths(d.months)}
                            className={`py-1 px-1 rounded-md text-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-white text-purple-700 font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="block text-[11px] leading-none">{d.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plan Cards */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {(['TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE'] as StorePlanId[]).map((planId) => {
                      const plan = PLAN_DETAILS[planId];
                      const { total, validMonths } = calculateTotalPrice(planId, selectedMonths);
                      const isTrial = planId === 'TRIAL';
                      const isStarter = planId === 'STARTER';
                      const badgeText = isStarter ? 'Recommended' : plan.badge;
                      const isPopular = isStarter;

                      return (
                        <button
                          key={planId}
                          type="button"
                          onClick={() => handleChoosePlan(planId)}
                          className={`w-full p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                            isPopular
                              ? 'border-purple-300 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400 shadow-xs ring-1 ring-purple-200'
                              : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br ${plan.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                                <plan.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{plan.name}</span>
                            </div>
                            {badgeText && (
                              <span
                                className={`text-[8px] font-sans font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  isPopular
                                    ? 'bg-purple-600 text-white'
                                    : isTrial
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                {badgeText}
                              </span>
                            )}
                          </div>

                          {/* Pricing and Total in a neat compact row */}
                          <div className="mt-1 flex items-baseline justify-between gap-1 flex-wrap">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] text-slate-400 line-through">
                                ~₦{formatNaira(plan.originalMonthlyPrice)}~
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold text-purple-700">
                                ₦{formatNaira(plan.monthlyPrice)}
                                <span className="text-[9px] font-normal text-slate-500">/mo</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600">
                              Total: <span className="text-slate-900 font-extrabold">₦{formatNaira(total)}</span>
                              <span className="text-[9px] text-slate-400"> ({validMonths}m{isTrial && validMonths === 3 && selectedMonths < 3 ? ' min' : ''})</span>
                            </div>
                          </div>

                          {/* Capacity and features highlight */}
                          <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-sans border-t border-slate-100/90 pt-1">
                            <span className="truncate">{plan.capacityLabel} • {plan.listingLimitLabel}</span>
                            <span className="text-purple-600 font-medium shrink-0 ml-1">
                              {isTrial ? 'No promo credits' : 'Promo credits apply'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="plan-confirm"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-3 pt-1 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-display font-bold text-slate-900">
                      {isExistingMerchant
                        ? `Confirm Renewal: ${PLAN_DETAILS[selectedStorePlan].name}`
                        : `Confirm ${PLAN_DETAILS[selectedStorePlan].name}`}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-sans text-slate-500 mt-0.5">
                      {isExistingMerchant
                        ? 'Confirm subscription renewal from your wallet balance.'
                        : 'Choose duration & confirm activation from your wallet balance.'}
                    </p>
                  </div>

                  {/* Duration switcher inside confirm view */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">
                      Billing Duration
                    </label>
                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100/90 rounded-lg">
                      {DURATION_OPTIONS.map((d) => {
                        const plan = PLAN_DETAILS[selectedStorePlan];
                        const isDisabled = d.months < plan.minMonths;
                        const isSelected = Math.max(plan.minMonths, selectedMonths) === d.months;

                        return (
                          <button
                            key={d.months}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setSelectedMonths(d.months)}
                            className={`py-1 px-1 rounded-md text-center transition-all cursor-pointer relative ${
                              isDisabled
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : isSelected
                                ? 'bg-white text-purple-700 font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="block text-[11px] leading-none">{d.label}</span>
                            {isDisabled && (
                              <span className="block text-[7px] text-red-500 font-bold mt-0.5 leading-none">
                                3m min
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  {(() => {
                    const plan = PLAN_DETAILS[selectedStorePlan];
                    const { total, validMonths } = calculateTotalPrice(selectedStorePlan, selectedMonths);
                    const isTrial = selectedStorePlan === 'TRIAL';
                    const userPromo = Number(user?.promoBalance || 0);
                    const userWallet = Number(user?.walletBalance || 0);
                    const promoApplicable = !isTrial && userPromo > 0;
                    const promoDeduction = promoApplicable ? Math.min(userPromo, total) : 0;
                    const walletDeduction = total - promoDeduction;

                    return (
                      <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-sans space-y-1.5 text-left">
                        <div className="flex justify-between text-slate-600">
                          <span>Monthly Rate</span>
                          <div className="flex items-center gap-1">
                            <span className="line-through text-slate-400 text-[9px]">
                              ~₦{formatNaira(plan.originalMonthlyPrice)}/mo~
                            </span>
                            <span className="font-bold text-purple-700">
                              ₦{formatNaira(plan.monthlyPrice)}/mo
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Member Capacity</span>
                          <span className="font-bold text-slate-800">{plan.capacityLabel}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Product Listing Limit</span>
                          <span className="font-bold text-slate-800">{plan.listingLimitLabel}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Duration Selected</span>
                          <span className="font-bold text-slate-800">
                            {validMonths} Month{validMonths > 1 ? 's' : ''}
                            {selectedStorePlan === 'TRIAL' ? ' (Minimum 3 months)' : ''}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-[11px] font-semibold text-slate-700">
                          <span>Plan Total</span>
                          <span className="text-slate-900 font-bold">
                            ₦{formatNaira(total)}
                          </span>
                        </div>

                        {isTrial ? (
                          <div className="flex justify-between items-center text-[9px] text-amber-800 bg-amber-50/80 p-1.5 rounded-md border border-amber-200/60">
                            <span>Promo Credits:</span>
                            <span className="font-semibold">Not applicable on Trial plan</span>
                          </div>
                        ) : promoDeduction > 0 ? (
                          <div className="flex justify-between items-center text-[9px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded-md border border-emerald-200/60">
                            <span>Promo Credit Applied:</span>
                            <span className="font-bold">-₦{formatNaira(promoDeduction)}</span>
                          </div>
                        ) : null}

                        <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-900 pt-0.5">
                          <span>Wallet Balance Due</span>
                          <span className="text-purple-600 text-sm sm:text-base">
                            ₦{formatNaira(walletDeduction)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                          <span>Your Current Wallet Balance:</span>
                          <span className="font-medium text-slate-600">₦{formatNaira(userWallet)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {activateError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[11px] font-sans font-semibold text-left">
                      {activateError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(null)}
                      disabled={activating}
                      className="flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={activating}
                      className="flex-1 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {activating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {activating
                        ? (isExistingMerchant ? 'Renewing...' : 'Activating...')
                        : (isExistingMerchant ? 'Pay & Renew Plan' : 'Pay & Activate')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
