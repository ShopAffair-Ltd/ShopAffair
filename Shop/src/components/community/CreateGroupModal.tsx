import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunities } from '../../context/CommunityContext';
import { fetchSubscriptionStatus, subscribeToStorePlan } from '../../services/paymentService';
import SellerProRequiredModal from './SellerProRequiredModal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PermissionValue = 'ALL' | 'ADMINS';

function PermissionToggle({
  label,
  value,
  onChange
}: {
  label: string;
  value: PermissionValue;
  onChange: (v: PermissionValue) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-sans text-slate-600">{label}</span>
      <div className="flex bg-slate-100 rounded-lg p-0.5">
        {(['ALL', 'ADMINS'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-md transition-all cursor-pointer ${
              value === opt ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-400'
            }`}
          >
            {opt === 'ALL' ? 'Everyone' : 'Admins only'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { user, updateUser } = useAuth();
  const { create } = useCommunities();

  const [checkingStatus, setCheckingStatus] = useState(true);
  // Fail-safe: any uncertainty (still checking, or the status check itself
  // failed) must NEVER be treated as "is Pro" - defaulting open here would
  // let a non-paying seller slip past the paywall. Only an explicit
  // isPro: true from the backend flips this.
  const [isPro, setIsPro] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [whoCanChat, setWhoCanChat] = useState<PermissionValue>('ALL');
  const [whoCanPostTrades, setWhoCanPostTrades] = useState<PermissionValue>('ALL');
  const [whoCanViewParticipants, setWhoCanViewParticipants] = useState<PermissionValue>('ALL');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setSubmitError(null);
    setSubscribeError(null);
    setCheckingStatus(true);
    setIsPro(false);

    fetchSubscriptionStatus()
      .then((status) => setIsPro(status.isPro === true))
      .catch(() => setIsPro(false))
      .finally(() => setCheckingStatus(false));
  }, [isOpen]);

  const handleSubscribe = async () => {
    setSubscribeError(null);
    setSubscribing(true);
    try {
      await subscribeToStorePlan('STARTER');
      setIsPro(true);
      if (user) updateUser({ ...user, isPro: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not activate the Starter Plan. Please try again.';
      setSubscribeError(message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setSubmitError('Group name is required');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await create({
        name: name.trim(),
        description: description.trim() || undefined,
        settings: { whoCanChat, whoCanPostTrades, whoCanViewParticipants }
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create group. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setWhoCanChat('ALL');
    setWhoCanPostTrades('ALL');
    setWhoCanViewParticipants('ALL');
    onClose();
  };

  if (!isOpen) return null;

  if (user?.role !== 'seller') {
    return <SellerProRequiredModal isOpen={isOpen} onClose={onClose} reason="not-seller" />;
  }

  if (checkingStatus) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl"
          >
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (!isPro) {
    return (
      <SellerProRequiredModal
        isOpen={isOpen}
        onClose={onClose}
        reason="not-pro"
        onSubscribe={handleSubscribe}
        subscribing={subscribing}
        subscribeError={subscribeError}
      />
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-50">
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center space-y-3 py-4">
                <ShieldCheck className="w-12 h-12 text-purple-600 mx-auto" />
                <h3 className="text-base font-display font-bold text-slate-900">Submitted for approval</h3>
                <p className="text-xs font-sans text-slate-500 leading-relaxed">
                  Your group "{name}" has been sent to our team for review. You'll get a notification once it's approved and live.
                </p>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                  <h3 className="text-base font-display font-bold text-slate-900">Create Trade Group</h3>
                  <p className="text-[11px] font-sans text-slate-400 mt-0.5">
                    Every group is reviewed before it goes live.
                  </p>
                </div>

                {submitError && (
                  <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[11px] font-sans font-semibold">
                    {submitError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-slate-400 uppercase mb-1">Group name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Lagos Electronics Traders"
                      className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-slate-400 uppercase mb-1">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="What's this group about?"
                      className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 resize-none"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-1 divide-y divide-slate-50">
                    <PermissionToggle label="Who can chat" value={whoCanChat} onChange={setWhoCanChat} />
                    <PermissionToggle label="Who can post trades" value={whoCanPostTrades} onChange={setWhoCanPostTrades} />
                    <PermissionToggle label="Who can view members" value={whoCanViewParticipants} onChange={setWhoCanViewParticipants} />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for approval'}
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}