import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, User, ArrowLeft, Landmark, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import {
  loginUser,
  startDraftRegistration,
  updateDraftRegistration,
  confirmDraftRegistration,
  getApiErrorMessage
} from '../services/authService';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isOpen, mode: initialMode, close } = useAuthModal();
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode as 'login' | 'register');
  const [registerStep, setRegisterStep] = useState<'form' | 'confirm'>('form');
  const [draftProfile, setDraftProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode as 'login' | 'register');
      setRegisterStep('form');
      setDraftProfile(null);
    }
  }, [isOpen, initialMode]);

  const onClose = close;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, mode]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const profile = await loginUser({ email, password });
      login(profile);
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // "Next" generates the account (creates a draft user + Paystack DVA) and
  // moves to the confirmation step, WITHOUT logging the person in yet.
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password || !fullName || !phoneNumber) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let profile: UserProfile;
      if (draftProfile) {
        profile = await updateDraftRegistration(draftProfile.id, {
          name: fullName,
          username,
          email,
          password,
          phoneNumber,
          role
        });
      } else {
        profile = await startDraftRegistration({ name: fullName, username, email, password, phoneNumber, role });
      }
      setDraftProfile(profile);
      setRegisterStep('confirm');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Back from confirmation returns to the same editable form, values intact.
  const handleBackToForm = () => {
    setRegisterStep('form');
    setErrorMessage(null);
  };

  const handleConfirm = async () => {
    if (!draftProfile) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const profile = await confirmDraftRegistration(draftProfile.id);
      login(profile);
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col"
          >
            <div className="h-1.5 w-full bg-purple-600" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[85vh] no-scrollbar">
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <ShieldCheck className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Sign in to ShopFair</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">Unlock secure trades & real-time messaging</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rumline@shopfair.com"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Signing in...' : 'Continue Securely'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-xs font-sans font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      New to ShopFair? Create a secure account
                    </button>
                  </div>
                </form>
              )}

              {mode === 'register' && registerStep === 'form' && (
                <form onSubmit={handleNext} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <User className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Create Account</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">Get started with secure multi-sig escrow trading</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rumline Peters"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username</label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={30}
                        pattern="[a-z0-9_]+"
                        title="Lowercase letters, numbers, and underscores only"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. rumline"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                      <p className="text-[11px] font-sans text-slate-400 mt-1">Lowercase letters, numbers, and underscores only</p>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                        placeholder="e.g. 08012345678"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                      <p className="text-[11px] font-sans text-slate-400 mt-1">Used to set up your personal deposit account number</p>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">I want to</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/40">
                        <button
                          type="button"
                          onClick={() => setRole('buyer')}
                          className={`py-2.5 text-xs font-sans font-bold rounded-lg transition-all cursor-pointer ${
                            role === 'buyer' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Buy items
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('seller')}
                          className={`py-2.5 text-xs font-sans font-bold rounded-lg transition-all cursor-pointer ${
                            role === 'seller' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          Sell items
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rumline@example.com"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Setting up your account...' : 'Next'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs font-sans font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Already registered? Sign in
                    </button>
                  </div>
                </form>
              )}

              {mode === 'register' && registerStep === 'confirm' && draftProfile && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <Landmark className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Your Account Number</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">
                      This is your personal deposit account. Confirm your details to finish creating your account.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  {draftProfile.accountNumber && draftProfile.bankName ? (
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 text-left">
                      <Landmark className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold text-purple-400 uppercase">{draftProfile.bankName}</span>
                        <strong className="font-mono text-lg text-purple-800 tracking-wide">{draftProfile.accountNumber}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-700 text-xs font-sans font-semibold rounded-xl border border-amber-100">
                      We couldn't generate your account number just now. You can still continue and try again later from your wallet.
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs font-sans text-left">
                    <p><span className="text-slate-400">Name:</span> <span className="font-semibold text-slate-700">{fullName}</span></p>
                    <p><span className="text-slate-400">Username:</span> <span className="font-semibold text-slate-700">@{username}</span></p>
                    <p><span className="text-slate-400">Email:</span> <span className="font-semibold text-slate-700">{email}</span></p>
                    <p><span className="text-slate-400">Phone:</span> <span className="font-semibold text-slate-700">{phoneNumber}</span></p>
                    <p><span className="text-slate-400">Role:</span> <span className="font-semibold text-slate-700 capitalize">{role}</span></p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {isSubmitting ? 'Creating account...' : 'Confirm & Continue'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToForm}
                      disabled={isSubmitting}
                      className="w-full font-sans font-semibold text-sm text-slate-500 hover:text-slate-700 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Edit details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}