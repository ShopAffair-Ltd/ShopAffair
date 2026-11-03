import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { resolveAccountAllBanks, ResolvedBankMatch } from '../../services/paymentService';

interface SavedAccount {
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  isVerified?: boolean;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (
    amount: number,
    beneficiaryAccount: string,
    beneficiaryBankCode: string,
    beneficiaryBankName: string
  ) => Promise<{ ok: boolean; message: string }>;
  onAddAuditLog: (action: string, details: string, actor?: string) => void;
  activeUsername: string;
  accountHolderName?: string;
  verifiedAccountNumber?: string;
  verifiedBankName?: string;
}

const looksLikeNameMatch = (a: string, b: string): boolean => {
  const tokenize = (s: string) =>
    s
      .toUpperCase()
      .replace(/['’]/g, '')
      .replace(/[^A-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  const setB = new Set(tokensB);
  const shared = tokensA.filter((t) => setB.has(t)).length;
  return shared >= (Math.min(tokensA.length, tokensB.length) <= 1 ? 1 : 2);
};

export default function TransferModal({
  isOpen,
  onClose,
  onTransfer,
  onAddAuditLog,
  activeUsername,
  accountHolderName,
  verifiedAccountNumber,
  verifiedBankName
}: TransferModalProps) {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferBeneficiary, setTransferBeneficiary] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  // Same account-number auto-detect used at signup: when the account
  // number matches more than one bank, the user picks from these; when it
  // matches exactly one, the bank is selected automatically.
  const [bankMatches, setBankMatches] = useState<ResolvedBankMatch[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const stored = localStorage.getItem(`shopfair_withdrawal_accs_${activeUsername}`);
      const list: SavedAccount[] = stored ? JSON.parse(stored) : [];
      if (verifiedAccountNumber && !list.some(a => a.accountNumber === verifiedAccountNumber)) {
        list.unshift({
          accountNumber: verifiedAccountNumber,
          bankCode: '',
          bankName: verifiedBankName || 'Verified Bank',
          accountName: accountHolderName || activeUsername,
          isVerified: true
        });
      }
      setSavedAccounts(list);
      if (list.length > 0 && !transferBeneficiary) {
        setTransferBeneficiary(list[0].accountNumber);
        setSelectedBankCode(list[0].bankCode);
        setResolvedName(list[0].accountName);
      }
    } catch {
      // ignore
    }
  }, [isOpen, activeUsername, verifiedAccountNumber, verifiedBankName, accountHolderName]);

  const handleSelectAccount = (acc: SavedAccount) => {
    setTransferBeneficiary(acc.accountNumber);
    setSelectedBankCode(acc.bankCode);
    setResolvedName(acc.accountName);
    setShowManualForm(false);
    setError(null);
  };

  // As soon as a 10-digit account number is entered, look up which bank(s)
  // it belongs to automatically - no manual bank search required. This
  // fires on the number alone, before any bank is chosen.
  useEffect(() => {
    if (transferBeneficiary.length !== 10) {
      setBankMatches([]);
      setResolvedName(null);
      setSelectedBankCode('');
      return;
    }

    setResolving(true);
    setError(null);
    setBankMatches([]);
    resolveAccountAllBanks(transferBeneficiary)
      .then((matches) => {
        setBankMatches(matches);
        if (matches.length === 1) {
          setSelectedBankCode(matches[0].bankCode);
          setResolvedName(matches[0].accountName);
        } else if (matches.length === 0) {
          if (transferBeneficiary === verifiedAccountNumber && accountHolderName) {
            setResolvedName(accountHolderName);
          } else {
            setError('Could not find a bank for this account number. Double-check it and try again.');
          }
        }
      })
      .catch(() => {
        if (transferBeneficiary === verifiedAccountNumber && accountHolderName) {
          setResolvedName(accountHolderName);
        } else {
          setError('Could not verify this account. Double-check the number.');
        }
      })
      .finally(() => setResolving(false));
  }, [transferBeneficiary, verifiedAccountNumber, accountHolderName]);

  const handleSelectBankMatch = (match: ResolvedBankMatch) => {
    setSelectedBankCode(match.bankCode);
    setResolvedName(match.accountName);
  };

  const selectedBankName =
    bankMatches.find((b) => b.bankCode === selectedBankCode)?.bankName ??
    savedAccounts.find((a) => a.bankCode === selectedBankCode)?.bankName ??
    '';

  const handleSubmit = async () => {
    const amt = parseFloat(transferAmount);
    setError(null);

    if (!resolvedName) {
      setError('Please enter a valid account number and select a bank first');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onTransfer(amt, transferBeneficiary, selectedBankCode, selectedBankName);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      const updatedAccounts: SavedAccount[] = [
        {
          accountNumber: transferBeneficiary,
          bankCode: selectedBankCode,
          bankName: selectedBankName,
          accountName: resolvedName,
          isVerified: transferBeneficiary === verifiedAccountNumber
        },
        ...savedAccounts.filter((a) => a.accountNumber !== transferBeneficiary)
      ];
      setSavedAccounts(updatedAccounts);
      try {
        localStorage.setItem(`shopfair_withdrawal_accs_${activeUsername}`, JSON.stringify(updatedAccounts));
      } catch { }

      onAddAuditLog('WALLET_TRANSFER', result.message, activeUsername);
      alert(`Transfer successfully dispatched! ${result.message}`);
      setTransferAmount('');
      setTransferBeneficiary('');
      setSelectedBankCode('');
      setResolvedName(null);
      onClose();
    } catch (err: unknown) {
      const backendMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(backendMessage ?? 'Transfer failed. Please try again.');
    } finally {
      setSubmitting(false);
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

            <div className="text-center">
              <h3 className="text-lg font-display font-bold text-slate-900">Withdraw to Bank</h3>
              <p className="text-xs font-sans text-slate-500 mt-1">
                Send funds from your wallet to a Nigerian bank account.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-sans font-semibold">
                {error}
              </div>
            )}

            {savedAccounts.length > 0 && !showManualForm && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Select Withdrawal Account
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {savedAccounts.map((acc) => (
                    <button
                      key={acc.accountNumber}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${transferBeneficiary === acc.accountNumber
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900">{acc.accountNumber}</span>
                          {acc.isVerified && (
                            <span className="text-[8px] bg-green-100 text-green-700 font-bold px-1.5 py-0.2 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">{acc.accountName} • {acc.bankName}</span>
                      </div>
                      {transferBeneficiary === acc.accountNumber && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualForm(true);
                    setTransferBeneficiary('');
                    setSelectedBankCode('');
                    setResolvedName(null);
                  }}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer pt-1 block"
                >
                  + Use another bank account
                </button>
              </div>
            )}

            {savedAccounts.length > 0 && showManualForm && (
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
              >
                ← Back to saved accounts
              </button>
            )}

            {(savedAccounts.length === 0 || showManualForm) && (
              <div className="space-y-3 font-sans text-xs">
                <div className="flex flex-col gap-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Account number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={transferBeneficiary}
                    onChange={(e) => setTransferBeneficiary(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 0123456789"
                    disabled={submitting}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl disabled:opacity-60"
                  />
                </div>

                {/* Bank is auto-detected from the account number, same as
                    signup - no manual search needed. If more than one bank
                    matches, the options appear below to pick from. */}
                {bankMatches.length > 1 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      This account number matches more than one bank - select yours
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {bankMatches.map((match) => (
                        <button
                          key={match.bankCode}
                          type="button"
                          onClick={() => handleSelectBankMatch(match)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${selectedBankCode === match.bankCode
                              ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                              : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                            }`}
                        >
                          <span className="font-bold text-xs text-slate-800 block">{match.bankName}</span>
                          <span className="text-[10px] text-slate-500 block">{match.accountName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {resolving && (
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verifying account...
              </div>
            )}

            {resolvedName && (() => {
              const nameMismatch =
                transferBeneficiary !== verifiedAccountNumber &&
                !!accountHolderName &&
                !looksLikeNameMatch(resolvedName, accountHolderName);

              if (nameMismatch) {
                return (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-amber-800 text-[11px] font-semibold">
                    <X className="w-4 h-4 shrink-0" />
                    "{resolvedName}" doesn't look like your registered name — withdrawals to
                    other people's accounts aren't allowed.
                  </div>
                );
              }

              return (
                <div className="p-2.5 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2 text-green-700 text-[11px] font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {resolvedName}
                </div>
              );
            })()}

            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Disbursement Amount (₦)</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="e.g. 2000"
                disabled={submitting}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl disabled:opacity-60"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !resolvedName}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Authorize Disbursal'
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}