import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset, resetPassword, getApiErrorMessage } from '../services/authService';

type Step = 'email' | 'reset' | 'done';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetLocalState = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetLocalState();
    onClose();
  };

  const handleBackToLogin = () => {
    resetLocalState();
    onBackToLogin();
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await requestPasswordReset(email);
      setStep('reset');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resetPassword({ email, code, newPassword });
      setStep('done');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await requestPasswordReset(email);
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
          onClick={(e) => e.target === e.currentTarget && handleClose()}
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
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[85vh] no-scrollbar">
              {step === 'email' && (
                <form onSubmit={handleRequestCode} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <KeyRound className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Reset your password</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">
                      Enter your email and we'll send you a code to reset your password
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

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

                  <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending code...' : 'Send Reset Code'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-xs font-sans font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              )}

              {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 mb-3">
                      <KeyRound className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900">Enter your code</h3>
                    <p className="text-sm font-sans text-slate-500 mt-1">
                      We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-sans font-semibold rounded-xl border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">Reset Code</label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full font-sans text-lg tracking-[0.5em] text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold uppercase tracking-wider text-slate-500 mb-1.5">New Password</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full font-sans text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || code.length !== 6 || newPassword.length < 8}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <div className="text-center pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isSubmitting}
                      className="text-xs font-sans font-semibold text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50"
                    >
                      Resend code
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-xs font-sans font-semibold text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              )}

              {step === 'done' && (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600 mb-3">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">Password reset</h3>
                  <p className="text-sm font-sans text-slate-500">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>

                  <button
                    onClick={handleBackToLogin}
                    className="w-full font-sans font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 py-3.5 rounded-xl transition-all shadow-md shadow-purple-100 flex items-center justify-center cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}