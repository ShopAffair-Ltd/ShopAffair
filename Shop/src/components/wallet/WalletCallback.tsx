import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { verifyFunding } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { fetchWalletBalance } from '../../services/paymentService';

// Paystack redirects here after checkout completes (success or failure),
// appending ?reference=... to the URL. This page confirms the payment with
// our backend (which re-verifies against Paystack itself, never trusting
// the redirect alone) and refreshes the locally-cached wallet balance.
export default function WalletCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Confirming your payment...');

  useEffect(() => {
    const reference = searchParams.get('reference') ?? searchParams.get('trxref');

    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found.');
      return;
    }

    verifyFunding(reference)
      .then(async () => {
        setStatus('success');
        setMessage('Your wallet has been credited.');

        if (user) {
          try {
            const balance = await fetchWalletBalance();
            updateUser({ ...user, walletBalance: Number(balance.walletBalance) });
          } catch {
            // Non-fatal: balance will still refresh next time it's fetched.
          }
        }
      })
      .catch((err: unknown) => {
        const backendMessage =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setStatus('error');
        setMessage(backendMessage ?? 'We could not confirm this payment.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-xl text-center space-y-4">
        {status === 'checking' && <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />}
        {status === 'error' && <XCircle className="w-12 h-12 mx-auto text-red-600" />}

        <h2 className="text-lg font-display font-bold text-slate-900">
          {status === 'checking' && 'Confirming payment'}
          {status === 'success' && 'Wallet funded'}
          {status === 'error' && 'Payment not confirmed'}
        </h2>
        <p className="text-sm font-sans text-slate-500">{message}</p>

        {status !== 'checking' && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}