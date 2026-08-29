import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { StorePlanId, TRIAL_PLAN_PRICE_DISPLAY, STARTER_PLAN_PRICE_DISPLAY } from '../../services/paymentService';

interface StoreUpgradeModalProps {
  isOpen: boolean;
  selectedStorePlan: StorePlanId | null;
  activating: boolean;
  activateError: string | null;
  onClose: () => void;
  onSelectPlan: (plan: StorePlanId | null) => void;
  onActivatePlan: (plan: StorePlanId) => Promise<boolean>;
  onAddAuditLog: (type: string, message: string, actor: string) => void;
  onNavigateToMyStore: () => void;
  activeUsername: string;
}

const PLAN_DETAILS: Record<StorePlanId, { name: string; price: string; bullets: string[] }> = {
  TRIAL: {
    name: 'Trial Plan',
    price: TRIAL_PLAN_PRICE_DISPLAY,
    bullets: ['Trial plan badge', 'Store capacity: 5', 'Product listing limit: 5']
  },
  STARTER: {
    name: 'Starter Plan',
    price: `${STARTER_PLAN_PRICE_DISPLAY}/month`,
    bullets: ['Merchant badge', 'Unlimited trades', 'Store capacity: 1,000 (expandable)', 'Product listing limit: 250 items']
  }
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
  activeUsername
}: StoreUpgradeModalProps) {
  const handleConfirm = async () => {
    if (!selectedStorePlan) return;
    const plan = PLAN_DETAILS[selectedStorePlan];
    const success = await onActivatePlan(selectedStorePlan);
    if (success) {
      onAddAuditLog(
        selectedStorePlan === 'STARTER' ? 'SUBSCRIBE_STARTER' : 'SUBSCRIBE_TRIAL',
        `Activated ${plan.name}.`,
        activeUsername
      );
      onNavigateToMyStore();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {!selectedStorePlan ? (
                <motion.div key="plan-list" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 text-3xl flex items-center justify-center mx-auto animate-float">🏪</div>

                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900">Open a Merchant Store</h3>
                    <p className="text-xs font-sans text-slate-500 mt-1">
                      Choose a plan to activate your store dashboard, catalogue, and store wall.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-left">
                    <button
                      onClick={() => onSelectPlan('TRIAL')}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl text-left transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-sans font-bold text-slate-800">{PLAN_DETAILS.TRIAL.name}</span>
                        <span className="text-xs font-sans font-bold text-slate-500">{PLAN_DETAILS.TRIAL.price}</span>
                      </div>
                      <ul className="text-[10px] font-sans text-slate-500 mt-1 space-y-0.5 leading-relaxed">
                        {PLAN_DETAILS.TRIAL.bullets.map((b) => (
                          <li key={b}>• {b}</li>
                        ))}
                      </ul>
                    </button>

                    <button
                      onClick={() => onSelectPlan('STARTER')}
                      className="w-full p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left transition-colors cursor-pointer relative overflow-hidden"
                    >
                      <span className="absolute top-2 right-2 text-[8px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white">Recommended</span>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-sans font-bold text-purple-700">{PLAN_DETAILS.STARTER.name}</span>
                        <span className="text-xs font-sans font-bold text-purple-600">{PLAN_DETAILS.STARTER.price}</span>
                      </div>
                      <ul className="text-[10px] font-sans text-purple-700/80 mt-1.5 space-y-0.5 leading-relaxed">
                        {PLAN_DETAILS.STARTER.bullets.map((b) => (
                          <li key={b}>• {b}</li>
                        ))}
                      </ul>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="plan-confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900">
                      Confirm {PLAN_DETAILS[selectedStorePlan].name}
                    </h3>
                    <p className="text-xs font-sans text-slate-500 mt-1">
                      This amount will be charged from your wallet balance immediately.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs font-sans">
                    <span className="text-slate-500">Amount due today</span>
                    <span className="font-bold text-slate-800">{PLAN_DETAILS[selectedStorePlan].price}</span>
                  </div>

                  {activateError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-sans font-semibold text-left">
                      {activateError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectPlan(null)}
                      disabled={activating}
                      className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 disabled:opacity-60 text-slate-600 font-sans font-bold text-xs rounded-xl border border-slate-200/50 transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
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