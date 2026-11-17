import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Loader2, Sparkles, Check, Crown, Zap, Store, RefreshCw, AlertCircle } from 'lucide-react';
import { StorePlanId, fetchSubscriptionStatus, SubscriptionStatus } from '../../services/paymentService';

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
    capacityLabel: '5 members',
    listingLimitLabel: '5 products',
    icon: Store,
    color: 'from-slate-600 to-slate-800',
    bullets: ['Trial plan badge', 'Member capacity: 5 members', 'Product listing limit: 5 products', 'Basic store wall & catalogue'],
    discountLabel: 'Discount ₦499.9/month',
    subLabel: '(₦1,499.7 for full 3 months)'
  },
  STARTER: {
    name: 'Starter Plan',
    originalMonthlyPrice: 5000,
    monthlyPrice: 3500,
    minMonths: 1,
    capacityLabel: '1,000 members',
    listingLimitLabel: '250 products',
    badge: 'Recommended',
    icon: Sparkles,
    color: 'from-purple-600 to-indigo-600',
    bullets: ['Merchant badge', 'Open Market publishing', 'Member capacity: 1,000 members', 'Product listing limit: 250 products', 'Full store wall & comments'],
    discountLabel: 'Discount ₦3,500/month',
    subLabel: '(People can still pay per month or for 3 months)'
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
    bullets: ['Verified Gold badge', 'Open Market priority', 'Member capacity: 5,000 members', 'Product listing limit: 1,000 products', 'Fast-track customer support'],
    discountLabel: 'Discount ₦12,000/month',
    subLabel: '(Ideal for expanding wholesale merchants)'
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    originalMonthlyPrice: 35000,
    monthlyPrice: 25000,
    minMonths: 1,
    capacityLabel: '50,000+ members (Unlimited)',
    listingLimitLabel: '10,000 products',
    badge: 'Max Capacity',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    bullets: ['VIP Merchant status', 'Featured on Open Market', 'Member capacity: 50,000+ members (Unlimited)', 'Product listing limit: 10,000 products', 'Dedicated account manager'],
    discountLabel: 'Discount ₦25,000/month',
    subLabel: '(Full high-volume catalog & store power)'
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
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [trialNotice, setTrialNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !activeUsername || activeUsername === 'guest') return;
    setTrialNotice(null);
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
    if (planId === 'TRIAL' && isExistingMerchant) {
      setTrialNotice('The Trial Plan is strictly for first-time store activations. Returning merchants renew on Starter Plan or above.');
      return;
    }
    setTrialNotice(null);
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
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-100 shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {!selectedStorePlan ? (
                <motion.div
                  key="plan-list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4 overflow-y-auto pr-1"
                >
                  <div className="text-center space-y-1 pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 text-2xl flex items-center justify-center mx-auto shadow-sm">
                      {isExistingMerchant ? '🔄' : '🏪'}
                    </div>
                    <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
                      {isExistingMerchant
                        ? (subStatus?.isExpired ? 'Renew Store Plan' : 'Renew / Upgrade Store Plan')
                        : 'Open a Merchant Store'}
                    </h3>
                    <p className="text-[11px] font-sans text-slate-500">
                      {isExistingMerchant
                        ? 'Renew your subscription to maintain your catalogue, member capacity, and Open Market visibility.'
                        : 'Choose a plan to activate your store dashboard, catalogue, and store wall.'}
                    </p>
                  </div>

                  {trialNotice && (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-[11px] font-sans flex items-start gap-2 text-left">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{trialNotice}</span>
                    </div>
                  )}

                  {/* Billing Duration Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                      Choose Billing Duration
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                      {DURATION_OPTIONS.map((d) => {
                        const isSelected = selectedMonths === d.months;
                        return (
                          <button
                            key={d.months}
                            type="button"
                            onClick={() => setSelectedMonths(d.months)}
                            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-white text-purple-700 font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="block text-xs leading-none">{d.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plan Cards */}
                  <div className="space-y-2.5">
                    {(['TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE'] as StorePlanId[]).map((planId) => {
                      const plan = PLAN_DETAILS[planId];
                      const { total, validMonths } = calculateTotalPrice(planId, selectedMonths);
                      const isTrial = planId === 'TRIAL';
                      const isStarter = planId === 'STARTER';
                      const badgeText = isTrial && isExistingMerchant
                        ? 'First-Time Stores Only'
                        : isStarter && isExistingMerchant
                        ? 'Renew Your Store (Recommended)'
                        : plan.badge;
                      const isPopular = (isStarter && isExistingMerchant) || plan.badge === 'Recommended';

                      return (
                        <button
                          key={planId}
                          type="button"
                          onClick={() => handleChoosePlan(planId)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                            isTrial && isExistingMerchant
                              ? 'border-slate-200 bg-slate-50/60 opacity-80 hover:border-amber-300'
                              : isPopular
                              ? 'border-purple-300 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-400 shadow-xs ring-1 ring-purple-200'
                              : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/70'
                          }`}
                        >
                          {badgeText && (
                            <span
                              className={`absolute top-2.5 right-3 text-[9px] font-sans font-bold px-2 py-0.5 rounded-full ${
                                isTrial && isExistingMerchant
                                  ? 'bg-slate-200 text-slate-700'
                                  : isPopular
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-800 text-white'
                              }`}
                            >
                              {badgeText}
                            </span>
                          )}

                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${plan.color} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                              <plan.icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{plan.name}</span>
                              </div>

                              {/* Pricing with strikethrough & discount */}
                              <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mt-1">
                                <span className="text-[11px] text-slate-400 line-through font-medium">
                                  ~₦{formatNaira(plan.originalMonthlyPrice)}/month~
                                </span>
                                <span className="text-xs font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded">
                                  {plan.discountLabel}
                                </span>
                              </div>

                              {/* Note / Subtext */}
                              <p className="text-[10px] text-slate-500 font-medium mt-1">
                                {plan.subLabel}
                              </p>

                              {/* Total calculation for current duration */}
                              <div className="mt-1.5 flex items-baseline gap-1 text-slate-800">
                                <span className="text-xs text-slate-400">Total:</span>
                                <span className="text-sm font-extrabold text-slate-900">
                                  ₦{formatNaira(total)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  for {validMonths} month{validMonths > 1 ? 's' : ''}
                                  {isTrial && validMonths === 3 && selectedMonths < 3 ? ' (3 mos min)' : ''}
                                </span>
                              </div>

                              <p className="text-[10px] text-purple-700 font-semibold mt-1">
                                Member Capacity: {plan.capacityLabel} • Products Limit: {plan.listingLimitLabel}
                              </p>
                            </div>
                          </div>

                          <ul className="text-[10px] font-sans text-slate-500 mt-2.5 space-y-0.5 border-t border-slate-100 pt-2">
                            {plan.bullets.map((b) => (
                              <li key={b} className="flex items-center gap-1.5 text-slate-600">
                                <Check className="w-3 h-3 text-green-600 shrink-0" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
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
                  className="space-y-4 pt-2 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-xs">
                    <ShieldCheck className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-base font-display font-bold text-slate-900">
                      {isExistingMerchant
                        ? `Confirm Renewal: ${PLAN_DETAILS[selectedStorePlan].name}`
                        : `Confirm ${PLAN_DETAILS[selectedStorePlan].name}`}
                    </h3>
                    <p className="text-xs font-sans text-slate-500 mt-0.5">
                      {isExistingMerchant
                        ? 'Confirm subscription renewal from your wallet balance.'
                        : 'Choose duration & confirm activation from your wallet balance.'}
                    </p>
                  </div>

                  {/* Duration switcher inside confirm view */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                      Billing Duration
                    </label>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl">
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
                            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer relative ${
                              isDisabled
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : isSelected
                                ? 'bg-white text-purple-700 font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="block text-xs leading-none">{d.label}</span>
                            {isDisabled && (
                              <span className="block text-[8px] text-red-500 font-bold mt-0.5 leading-none">
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

                    return (
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-sans space-y-2 text-left">
                        <div className="flex justify-between text-slate-600">
                          <span>Monthly Rate</span>
                          <div className="flex items-center gap-1.5">
                            <span className="line-through text-slate-400 text-[10px]">
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
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                          <span>Total Amount Due</span>
                          <span className="text-purple-600 text-base">
                            ₦{formatNaira(total)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {activateError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-sans font-semibold text-left">
                      {activateError}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(null)}
                      disabled={activating}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={activating}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
