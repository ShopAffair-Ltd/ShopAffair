import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, User, ArrowLeft, Landmark, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { UserProfile } from '../types';
import {
  loginUser,
  startDraftRegistration,
  resolveBankAccount,
  updateDraftRegistration,
  verifySignupOtp,
  resendSignupOtp,
  confirmDraftRegistration,
  getApiErrorMessage
} from '../services/authService';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';

type RegisterStep = 'credentials' | 'verifyEmail' | 'verify' | 'confirm';

interface ResolvedBankAccount {
  accountName: string;
  bankCode: string;
  bankName: string;
}

interface AuthModalProps {
  onForgotPassword: () => void;
}

export default function AuthModal({ onForgotPassword }: AuthModalProps) {
  const { isOpen, mode: initialMode, close } = useAuthModal();
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode as 'login' | 'register');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('credentials');
  const [draftProfile, setDraftProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode as 'login' | 'register');
      setRegisterStep('credentials');
      setDraftProfile(null);
    }
  }, [isOpen, initialMode]);

  const onClose = close;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankMatches, setBankMatches] = useState<ResolvedBankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<ResolvedBankAccount | null>(null);
  const [isResolving, setIsResolving] = useState(false);
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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const profile = await startDraftRegistration({ email, password });
      setDraftProfile(profile);
      setRegisterStep('verifyEmail');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftProfile || emailOtp.length !== 6) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const profile = await verifySignupOtp(draftProfile.id, emailOtp);
      setDraftProfile(profile);
      setRegisterStep('verify');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!draftProfile) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resendSignupOtp(draftProfile.id);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveAccount = async () => {
    if (bankAccountNumber.length !== 10) return;

    setIsResolving(true);
    setErrorMessage(null);
    setBankMatches([]);
    setSelectedBank(null);

    try {
      const matches = await resolveBankAccount(bankAccountNumber);
      setBankMatches(matches);
      if (matches.length === 1) {
        handleSelectBank(matches[0]);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsResolving(false);
    }
  };

  const handleSelectBank = (bank: ResolvedBankAccount) => {
    setSelectedBank(bank);
    if (!username) {
      const suggested = bank.accountName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .join('_')
        .slice(0, 24);
      setUsername(suggested);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftProfile || !selectedBank || !username || !phoneNumber) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const profile = await updateDraftRegistration(draftProfile.id, {
        bankAccountNumber,
        bankCode: selectedBank.bankCode,
        username,
        phoneNumber,
        role
      });
      setDraftProfile(profile);
      setRegisterStep('confirm');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToVerify = () => {
    setRegisterStep('verify');
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
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500">Password</label>
                        <button
                          type="button"
                          onClick={onForgotPassword}
                          className="text-[11px] font-sans font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
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

              {mode === 'register' && registerStep === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <User className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Create Account</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">Step 1 of 4 — Get started with your email</p>
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
                    {isSubmitting ? 'Setting up...' : 'Next'}
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

              {mode === 'register' && registerStep === 'verifyEmail' && (
                <form onSubmit={handleVerifyEmailSubmit} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <Mail className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Verify Your Email</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">
                      Step 2 of 4 — We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Verification Code</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full font-sans text-lg tracking-[0.5em] text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || emailOtp.length !== 6}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? 'Verifying...' : 'Verify Email'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleResendEmailOtp}
                      disabled={isSubmitting}
                      className="text-xs font-sans font-semibold text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}

              {mode === 'register' && registerStep === 'verify' && (
                <form onSubmit={handleVerifySubmit} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <Landmark className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Verify Your Bank Account</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">Step 3 of 4 — We'll use this to confirm your real name</p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bank Account Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          maxLength={10}
                          value={bankAccountNumber}
                          onChange={(e) => {
                            setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''));
                            setBankMatches([]);
                            setSelectedBank(null);
                          }}
                          placeholder="e.g. 0123456789"
                          className="flex-1 font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleResolveAccount}
                          disabled={bankAccountNumber.length !== 10 || isResolving}
                          className="px-4 font-sans font-bold text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 rounded-xl transition-all cursor-pointer shrink-0"
                        >
                          {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                      <p className="text-[11px] font-sans text-slate-400 mt-1">
                        Any of your existing bank, OPay, or PalmPay accounts — we auto-detect the bank
                      </p>
                    </div>

                    {bankMatches.length > 1 && (
                      <div className="space-y-2">
                        <p className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500">
                          This account number is linked to {bankMatches.length} banks — pick one
                        </p>
                        <div className="space-y-1.5">
                          {bankMatches.map((bank) => (
                            <button
                              key={bank.bankCode}
                              type="button"
                              onClick={() => handleSelectBank(bank)}
                              className={`w-full text-left p-3 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer ${
                                selectedBank?.bankCode === bank.bankCode
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  selectedBank?.bankCode === bank.bankCode ? 'text-green-600' : 'text-slate-300'
                                }`}
                              />
                              <div className="text-xs font-sans">
                                <p className={`font-bold ${selectedBank?.bankCode === bank.bankCode ? 'text-green-800' : 'text-slate-700'}`}>
                                  {bank.accountName}
                                </p>
                                <p className={selectedBank?.bankCode === bank.bankCode ? 'text-green-600' : 'text-slate-400'}>
                                  {bank.bankName}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {bankMatches.length === 1 && selectedBank && (
                      <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div className="text-xs font-sans">
                          <p className="text-green-800 font-bold">{selectedBank.accountName}</p>
                          <p className="text-green-600">{selectedBank.bankName}</p>
                        </div>
                      </div>
                    )}

                    {selectedBank && (
                      <>
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
                          <p className="text-[11px] font-sans text-slate-400 mt-1">Suggested from your name — feel free to change it</p>
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
                      </>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedBank || !username || !phoneNumber}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Setting up your account...' : 'Next'}
                  </button>
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
                      Step 4 of 4 — This is your personal deposit account. Confirm your details to finish.
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
                    <p><span className="text-slate-400">Name:</span> <span className="font-semibold text-slate-700">{selectedBank?.accountName}</span></p>
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
                      onClick={handleBackToVerify}
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