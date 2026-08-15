import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { fundWallet as fundWalletApi, withdraw as withdrawApi } from '../services/paymentService';

interface WalletContextType {
  depositOpen: boolean;
  transferOpen: boolean;
  openDeposit: () => void;
  closeDeposit: () => void;
  openTransfer: () => void;
  closeTransfer: () => void;
  // Starts a real Paystack checkout for the given amount and redirects the
  // browser there. Unlike the old mock, this does NOT credit the wallet -
  // that only happens after Paystack confirms payment (see WalletCallback).
  deposit: (amount: number) => Promise<void>;
  // Withdraws from the wallet to an external bank account via Paystack
  // Transfers. Returns once the transfer has been initiated (test mode:
  // immediately successful; live mode: pending, confirmed later by webhook).
  transfer: (
    amount: number,
    beneficiaryAccount: string,
    beneficiaryBankCode: string,
    beneficiaryBankName: string
  ) => Promise<{ ok: boolean; message: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const openDeposit = () => setDepositOpen(true);
  const closeDeposit = () => setDepositOpen(false);
  const openTransfer = () => setTransferOpen(true);
  const closeTransfer = () => setTransferOpen(false);

  const deposit = async (amount: number) => {
    if (!user || !amount || amount <= 0) return;
    const { authorizationUrl } = await fundWalletApi(amount);
    // Full browser redirect to Paystack's hosted checkout. It will redirect
    // back to CLIENT_URL once the user completes (or abandons) payment.
    window.location.href = authorizationUrl;
  };

  const transfer = async (
    amount: number,
    beneficiaryAccount: string,
    beneficiaryBankCode: string,
    beneficiaryBankName: string
  ) => {
    if (!user) return { ok: false, message: 'Not signed in' };
    if (!amount || amount <= 0) return { ok: false, message: 'Enter a valid amount' };
    if (user.walletBalance < amount) {
      return { ok: false, message: 'Insufficient balance to disburse this transfer' };
    }

    const result = await withdrawApi({
      amount,
      accountNumber: beneficiaryAccount,
      bankCode: beneficiaryBankCode,
      bankName: beneficiaryBankName
    });

    updateUser({ ...user, walletBalance: user.walletBalance - amount });

    return {
      ok: true,
      message: `₦${amount.toLocaleString()} sent to ${result.accountName} (${beneficiaryBankName})`
    };
  };

  return (
    <WalletContext.Provider
      value={{ depositOpen, transferOpen, openDeposit, closeDeposit, openTransfer, closeTransfer, deposit, transfer }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}