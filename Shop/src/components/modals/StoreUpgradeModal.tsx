import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Loader2, Sparkles, Check, Crown, Zap, Store } from 'lucide-react';
import { StorePlanId } from '../../services/paymentService';

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
}

interface PlanInfo {
  name: string;
  monthlyPrice: number;
  capacityLabel: string;
  listingLimitLabel: string;
  badge?: string;
  icon: typeof Store;
  color: string;
  bullets: string[];
}

const PLAN_DETAILS: Record<StorePlanId, PlanInfo> = {
  TRIAL: {
    name: 'Trial Plan',
    monthlyPrice: 499.9,
    capacityLabel: '5 items',
    listingLimitLabel: '5 products',
    icon: Store,
    color: 'from-slate-500 to-slate-700',
    bullets: ['Trial badge', 'Store capacity: 5 items', 'Product listing limit: 5 items', 'Basic store wall']
  },
  STARTER: {
    name: 'Starter Plan',
    monthlyPrice: 5000,
    capacityLabel: '1,000 items',
    listingLimitLabel: '250 products',
    badge: 'Popular',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-600',
    bullets: ['Merchant badge', 'Open Market publishing', 'Store capacity: 1,000 items', 'Product listing limit: 250 items', 'Full store wall & comments']
  },
  GROWTH: {
    name: 'Growth Plan',
    monthlyPrice: 12000,
    capacityLabel: '5,000 items',
    listingLimitLabel: '1,000 products',
    badge: 'High Capacity',
    icon: Zap,
    color: 'from-blue-600 to-cyan-600',
    bullets: ['Verified Gold badge', 'Open Market priority', 'Store capacity: 5,000 items', 'Product listing limit: 1,000 items', 'Fast-track customer support']
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    monthlyPrice: 25000,
    capacityLabel: '50,000 items (Unlimited)',
    listingLimitLabel: '10,000 products',
    badge: 'Max Capacity',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    bullets: ['VIP Merchant status', 'Featured on Open Market', 'Store capacity: 50,000+ items (Unlimited)', 'Product listing limit: 10,000 items', 'Dedicated account manager']
  }
};

const DURATION_OPTIONS = [
  { months: 1, label: '1 Month', discountRate: 0, tag: '' },
  { months: 3, label: '3 Months', discountRate: 0.05, tag: '5% OFF' },
  { months: 6, label: '6 Months', discountRate: 0.10, tag: '10% OFF' },
  { months: 12, label: '1 Year', discountRate: 0.15, tag: '15% OFF' }
];

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
  activeUsername
}: StoreUpgradeModalProps) {
  const [selectedMonths, setSelectedMonths] = useState<number>(1);

  const calculatePrice = (baseMonthly: number, months: number) => {
    const option = DURATION_OPTIONS.find((d) => d.months === months) || DURATION_OPTIONS[0];
    const rawTotal = baseMonthly * months * (1 - option.discountRate);
    return Math.round(rawTotal);
  };

  const handleConfirm = async () => {
    if (!selectedStorePlan) return;
    const plan = PLAN_DETAILS[selectedStorePlan];
    const success = await onActivatePlan(selectedStorePlan, selectedMonths);
    if (success) {
      onAddAuditLog(
        `SUBSCRIBE_${selectedStorePlan}`,
        `Activated ${plan.name} for ${selectedMonths} month(s).`,
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
                      🏪
                    </div>
                    <h3 className="text-base sm:text-lg font-display font-bold text-slate-900">
                      Store Plan & Capacity Upgrade
                    </h3>
                    <p className="text-[11px] font-sans text-slate-500">
                      Upgrade your store capacity, product limits, and Open Market visibility.
                    </p>
                  </div>

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
                            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-white text-purple-700 font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 font-medium'
                            }`}
                          >
                            <span className="block text-xs leading-none">{d.label}</span>
                            {d.tag && (
                              <span
                                className={`block text-[8px] font-extrabold mt-0.5 leading-none ${
                                  isSelected ? 'text-green-600' : 'text-green-700'
                                }`}
                              >
                                {d.tag}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plan Cards */}
                  <div className="space-y-2.5">
                    {(['STARTER', 'GROWTH', 'ENTERPRISE', 'TRIAL'] as StorePlanId[]).map((planId) => {
                      const plan = PLAN_DETAILS[planId];
                      const totalPrice = calculatePrice(plan.monthlyPrice, selectedMonths);
                      const isPopular = plan.badge === 'Popular';

                      return (
                        <button
                          key={planId}
                          type="button"
                          onClick={() => onSelectPlan(planId)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                            isPopular
                              ? 'border-purple-300 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/70'
                          }`}
                        >
                          {plan.badge && (
                            <span
                              className={`absolute top-2.5 right-3 text-[9px] font-sans font-bold px-2 py-0.5 rounded-full ${
                                isPopular ? 'bg-purple-600 text-white' : 'bg-slate-800 text-white'
                              }`}
                            >
                              {plan.badge}
                            </span>
                          )}

                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${plan.color} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                              <plan.icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0 pr-12">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{plan.name}</span>
                              </div>
                              <p className="text-[10px] text-purple-700 font-bold mt-0.5">
                                Capacity: {plan.capacityLabel} • {plan.listingLimitLabel}
                              </p>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-sm font-extrabold text-slate-900">
                                  ₦{totalPrice.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  / {selectedMonths === 1 ? 'month' : `${selectedMonths} months`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <ul className="text-[10px] font-sans text-slate-500 mt-2 space-y-0.5 border-t border-slate-100 pt-1.5">
                            {plan.bullets.slice(0, 3).map((b) => (
                              <li key={b} className="flex items-center gap-1.5 text-slate-600">
                                <Check className="w-2.5 h-2.5 text-green-600 shrink-0" />
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
                      Confirm {PLAN_DETAILS[selectedStorePlan].name}
                    </h3>
                    <p className="text-xs font-sans text-slate-500 mt-0.5">
                      Duration: <span className="font-bold text-slate-800">{selectedMonths} Month{selectedMonths > 1 ? 's' : ''}</span>
                    </p>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-sans space-y-2 text-left">
                    <div className="flex justify-between text-slate-600">
                      <span>Store Capacity</span>
                      <span className="font-bold text-slate-800">{PLAN_DETAILS[selectedStorePlan].capacityLabel}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Product Listing Limit</span>
                      <span className="font-bold text-slate-800">{PLAN_DETAILS[selectedStorePlan].listingLimitLabel}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Duration</span>
                      <span className="font-bold text-slate-800">{selectedMonths} Month{selectedMonths > 1 ? 's' : ''}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                      <span>Total Amount Due</span>
                      <span className="text-purple-600 text-base">
                        ₦{calculatePrice(PLAN_DETAILS[selectedStorePlan].monthlyPrice, selectedMonths).toLocaleString()}
                      </span>
                    </div>
                  </div>

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
                      {activating ? 'Activating...' : 'Pay & Activate'}
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
