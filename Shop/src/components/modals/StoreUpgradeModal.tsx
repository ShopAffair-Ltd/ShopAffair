import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';

interface StoreUpgradeModalProps {
  isOpen: boolean;
  selectedStorePlan: 'free' | 'pro' | null;
  onClose: () => void;
  onSelectPlan: (plan: 'free' | 'pro' | null) => void;
  onActivatePlan: (plan: 'free' | 'pro') => void;
  onAddAuditLog: (type: string, message: string, actor: string) => void;
  onNavigateToMyStore: () => void;
  activeUsername: string;
}

export default function StoreUpgradeModal({
  isOpen,
  selectedStorePlan,
  onClose,
  onSelectPlan,
  onActivatePlan,
  onAddAuditLog,
  onNavigateToMyStore,
  activeUsername
}: StoreUpgradeModalProps) {
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
                      onClick={() => onSelectPlan('free')}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl text-left transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-sans font-bold text-slate-800">Free Plan</span>
                        <span className="text-xs font-sans font-bold text-slate-500">₦0 / month</span>
                      </div>
                      <p className="text-[10px] font-sans text-slate-500 mt-1 leading-relaxed">
                        List up to 10 products, standard escrow fees, basic store wall.
                      </p>
                    </button>

                    <button
                      onClick={() => onSelectPlan('pro')}
                      className="w-full p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left transition-colors cursor-pointer relative overflow-hidden"
                    >
                      <span className="absolute top-2 right-2 text-[8px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white">Recommended</span>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-sans font-bold text-purple-700">Pro Merchant</span>
                        <span className="text-xs font-sans font-bold text-purple-600">₦10,000 / month</span>
                      </div>
                      <ul className="text-[10px] font-sans text-purple-700/80 mt-1.5 space-y-0.5 leading-relaxed">
                        <li>• Zero escrow mediation fee on supply trades</li>
                        <li>• Dedicated virtual settlement account</li>
                        <li>• Listings limit raised to 250 items</li>
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
                      Confirm {selectedStorePlan === 'pro' ? 'Pro Merchant' : 'Free'} Plan
                    </h3>
                    <p className="text-xs font-sans text-slate-500 mt-1">
                      {selectedStorePlan === 'pro'
                        ? 'This is a mock checkout — no real payment will be charged.'
                        : 'Free plan activates instantly, no payment required.'}
                    </p>
                  </div>

                  {selectedStorePlan === 'pro' && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs font-sans">
                      <span className="text-slate-500">Amount due today</span>
                      <span className="font-bold text-slate-800">₦10,000.00</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectPlan(null)}
                      className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-sans font-bold text-xs rounded-xl border border-slate-200/50 transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        const isPro = selectedStorePlan === 'pro';
                        onActivatePlan(selectedStorePlan);
                        onAddAuditLog(
                          isPro ? 'SUBSCRIBE_PRO' : 'SUBSCRIBE_FREE',
                          `Activated ${isPro ? 'premium PRO' : 'Free'} store plan.`,
                          activeUsername
                        );
                        onNavigateToMyStore();
                      }}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      {selectedStorePlan === 'pro' ? 'Pay & Activate' : 'Activate Free Plan'}
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