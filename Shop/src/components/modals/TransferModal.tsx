import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchBanks, resolveAccount, Bank } from '../../services/paymentService';

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
}

export default function TransferModal({ isOpen, onClose, onTransfer, onAddAuditLog, activeUsername }: TransferModalProps) {
  const [transferAmount, setTransferAmount] = useState('');
  const [transferBeneficiary, setTransferBeneficiary] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Account resolution state: once the account number reaches 10 digits and
  // a bank is picked, we confirm the real account holder's name with
  // Paystack before allowing the transfer to be authorized.
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchBanks()
      .then(setBanks)
      .catch(() => setBanks([]));
  }, [isOpen]);

  useEffect(() => {
    setResolvedName(null);
    if (transferBeneficiary.length !== 10 || !selectedBankCode) return;

    setResolving(true);
    setError(null);
    resolveAccount(transferBeneficiary, selectedBankCode)
      .then((res) => setResolvedName(res.accountName))
      .catch(() => setError('Could not verify this account. Double-check the number and bank.'))
      .finally(() => setResolving(false));
  }, [transferBeneficiary, selectedBankCode]);

  const selectedBankName = banks.find((b) => b.code === selectedBankCode)?.name ?? '';

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

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account number</label>
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank</label>
                <select
                  value={selectedBankCode}
                  onChange={(e) => setSelectedBankCode(e.target.value)}
                  disabled={submitting}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl disabled:opacity-60"
                >
                  <option value="">Select bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {resolving && (
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying account...
                </div>
              )}

              {resolvedName && (
                <div className="p-2.5 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2 text-green-700 text-[11px] font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {resolvedName}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Disbursement Amount (₦)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  disabled={submitting}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl disabled:opacity-60"
                />
              </div>
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