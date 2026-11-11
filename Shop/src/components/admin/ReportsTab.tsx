import React, { useState } from 'react';
import {
  fetchAllTransactions,
  fetchAllWithdrawals,
  fetchAllOrders,
  fetchVendors
} from '../../services/adminService';

type ReportKey = 'transactions' | 'withdrawals' | 'orders' | 'vendors';

function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function downloadCsvFile(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ReportsTab: React.FC = () => {
  const [downloading, setDownloading] = useState<ReportKey | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async (key: ReportKey) => {
    setDownloading(key);
    setFeedback(null);
    const stamp = new Date().toISOString().slice(0, 10);

    try {
      if (key === 'transactions') {
        const res = await fetchAllTransactions(1, 500);
        const filename = `shopaffair_transactions_${stamp}.csv`;
        downloadCsvFile(
          filename,
          ['ID', 'Username', 'Type', 'Provider', 'Amount', 'Status', 'Reference', 'Created At'],
          res.items.map((tx) => [
            tx.id,
            tx.user?.username ?? '',
            tx.type,
            tx.provider,
            tx.amount,
            tx.status,
            tx.reference ?? '',
            tx.createdAt
          ])
        );
        setFeedback({ type: 'success', text: `Exported ${res.items.length} transaction rows to ${filename}.` });
      } else if (key === 'withdrawals') {
        const res = await fetchAllWithdrawals(1, 500);
        const filename = `shopaffair_withdrawals_${stamp}.csv`;
        downloadCsvFile(
          filename,
          ['ID', 'Username', 'Name', 'Amount', 'Status', 'Bank', 'Account Number', 'Account Name', 'Reference', 'Created At'],
          res.items.map((w) => [
            w.id,
            w.user?.username ?? '',
            w.user?.name ?? '',
            w.amount,
            w.status,
            w.user?.withdrawalBankName ?? '',
            w.user?.withdrawalAccountNumber ?? '',
            w.user?.withdrawalAccountName ?? '',
            w.reference ?? '',
            w.createdAt
          ])
        );
        setFeedback({ type: 'success', text: `Exported ${res.items.length} withdrawal rows to ${filename}.` });
      } else if (key === 'orders') {
        const res = await fetchAllOrders(1, 500);
        const filename = `shopaffair_orders_${stamp}.csv`;
        downloadCsvFile(
          filename,
          ['ID', 'Order Ref', 'Product', 'Buyer', 'Seller', 'Price', 'Status', 'Created At'],
          res.items.map((o) => [
            o.id,
            o.orderRef,
            o.product?.title ?? '',
            o.buyer?.username ?? '',
            o.seller?.username ?? '',
            o.price,
            o.status,
            o.createdAt
          ])
        );
        setFeedback({ type: 'success', text: `Exported ${res.items.length} order rows to ${filename}.` });
      } else {
        const res = await fetchVendors(1, 500);
        const filename = `shopaffair_vendors_${stamp}.csv`;
        downloadCsvFile(
          filename,
          ['ID', 'Username', 'Name', 'Email', 'Verification', 'Pro', 'Rating', 'Total Sales', 'Frozen', 'Created At'],
          res.items.map((v) => [
            v.id,
            v.username,
            v.name,
            v.email,
            v.verificationStatus,
            v.isPro ? 'YES' : 'NO',
            v.rating,
            v.totalSales,
            v.isFrozen ? 'YES' : 'NO',
            v.createdAt
          ])
        );
        setFeedback({ type: 'success', text: `Exported ${res.items.length} vendor rows to ${filename}.` });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Could not export report data right now.' });
    } finally {
      setDownloading(null);
    }
  };

  const reports: { key: ReportKey; title: string; subtitle: string }[] = [
    {
      key: 'transactions',
      title: 'Wallet & Escrow Transactions Ledger (.csv)',
      subtitle: 'Live export of all wallet funding, escrow locks, releases, fees, and transfers'
    },
    {
      key: 'withdrawals',
      title: 'Bank Withdrawal Settlement Audit (.csv)',
      subtitle: 'Live export of user bank payouts, references, and destination accounts'
    },
    {
      key: 'orders',
      title: 'Marketplace Orders Ledger (.csv)',
      subtitle: 'Live export of product orders, buyers, sellers, and fulfillment statuses'
    },
    {
      key: 'vendors',
      title: 'Verified Sellers & Store Registry (.csv)',
      subtitle: 'Live export of vendor KYC statuses, sales totals, and Pro plans'
    }
  ];

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Live Compliance CSV Exporter</h3>
        <span className="text-[10px] text-slate-400">Up to 500 latest rows per export</span>
      </div>

      {feedback && (
        <div
          className={`px-3 py-2 rounded-xl text-[11px] font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="space-y-3 text-xs text-left">
        {reports.map((report) => (
          <div key={report.key} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <strong className="text-slate-200 block truncate">{report.title}</strong>
              <span className="text-[10px] text-slate-500 font-mono block">{report.subtitle}</span>
            </div>
            <button
              onClick={() => handleExport(report.key)}
              disabled={downloading !== null}
              className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 px-3 py-1.5 rounded cursor-pointer transition-colors text-slate-200 shrink-0"
            >
              {downloading === report.key ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
