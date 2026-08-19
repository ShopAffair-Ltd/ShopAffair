import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TradeItem } from '../types';
import { useTrades } from '../context/TradeContext';
import { useAuth } from '../context/AuthContext';
import TradeListView from './TradeListView';
import TradeCreateView from './TradeCreateView';
import TradeDetailView from './TradeDetailView';

type ViewMode = 'list' | 'create' | 'detail';
type FilterOption = 'All' | 'Drafts' | 'Offers' | 'Pending';

export default function TradeView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: activeProfile } = useAuth();
  const {
    trades,
    loading: tradesLoading,
    createTrade,
    fundTrade,
    verifyPickupCode,
    updateTradeStatus
  } = useTrades();

  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && trades.some((t) => t.id === openId)) {
      setSelectedTradeId(openId);
      setCurrentView('detail');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('open');
        return next;
      }, { replace: true });
    }
  }, [searchParams, trades, setSearchParams]);

  const selectedTrade = selectedTradeId ? trades.find((t) => t.id === selectedTradeId) || null : null;

  const isSeller = (trade: TradeItem) => !!activeProfile && activeProfile.username === trade.creatorUsername;
  const isBuyer = (trade: TradeItem) => !!trade.buyerUsername && !!activeProfile && activeProfile.username === trade.buyerUsername;

  const handleShareTrade = (trade: TradeItem) => {
    const url = window.location.href;
    const shareData = {
      title: `Trade: ${trade.title}`,
      text: `Check out this trade on ShopAffair: ${trade.title} - ₦${trade.amount.toLocaleString()}`,
      url
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Trade link copied to clipboard! Share it with your friends.');
      });
    }
  };

  if (!activeProfile) return null;

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden pb-24">
      {currentView === 'list' && (
        <TradeListView
          trades={trades}
          loading={tradesLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSelectTrade={(id) => {
            setSelectedTradeId(id);
            setCurrentView('detail');
          }}
          onCreateNew={() => setCurrentView('create')}
          onShareTrade={handleShareTrade}
        />
      )}

      {currentView === 'create' && (
        <TradeCreateView
          onCancel={() => setCurrentView('list')}
          onSubmit={async (payload) => {
            await createTrade(payload);
          }}
          onDone={() => setCurrentView('list')}
        />
      )}

      {currentView === 'detail' && selectedTrade && (
        <TradeDetailView
          trade={selectedTrade}
          isSeller={isSeller(selectedTrade)}
          isBuyer={isBuyer(selectedTrade)}
          onBack={() => {
            setSelectedTradeId(null);
            setCurrentView('list');
          }}
          onFundTrade={async (id) => {
            await fundTrade(id);
          }}
          onVerifyPickupCode={async (id, code) => {
            await verifyPickupCode(id, code);
          }}
          onUpdateStatus={async (id, status) => {
            await updateTradeStatus(id, status);
          }}
        />
      )}
    </div>
  );
}