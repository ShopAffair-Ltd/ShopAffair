import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TradeItem } from '../types';
import { useTrades } from '../context/TradeContext';
import { useAuth } from '../context/AuthContext';
import TradeListView from './TradeListView';
import TradeCreateView from './TradeCreateView';
import TradeDetailView from './TradeDetailView';

type FilterOption = 'All' | 'Drafts' | 'Offers' | 'Pending';

export default function TradeView() {
  const navigate = useNavigate();
  const params = useParams<{ tradeId?: string; mode?: string }>();
  const [searchParams] = useSearchParams();
  const { user: activeProfile } = useAuth();
  const {
    trades,
    loading: tradesLoading,
    createTrade,
    editTrade,
    cancelTrade,
    fundTrade,
    verifyPickupCode,
    updateTradeStatus
  } = useTrades();

  const [activeFilter, setActiveFilter] = React.useState<FilterOption>('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  // URL is the single source of truth for which sub-view is showing:
  //   /trade                 -> list
  //   /trade/new              -> create
  //   /trade/:tradeId         -> detail
  //   /trade/:tradeId/edit     -> edit
  // Refresh on any of these reloads the same screen instead of bouncing to
  // the landing page, and the phone/browser back button walks the real
  // history stack instead of always returning to list.
  const isNew = params.tradeId === 'new';
  const isEdit = params.mode === 'edit';
  const selectedTradeId = !isNew ? params.tradeId ?? null : null;
  const selectedTrade = selectedTradeId ? trades.find((t) => t.id === selectedTradeId) || null : null;

  // Legacy deep-link support: /trade?open=<id>
  React.useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && trades.some((t) => t.id === openId)) {
      navigate(`/trade/${openId}`, { replace: true });
    }
  }, [searchParams, trades, navigate]);

  const isSeller = (trade: TradeItem) => !!activeProfile && activeProfile.username === trade.creatorUsername;
  const isBuyer = (trade: TradeItem) => !!trade.buyerUsername && !!activeProfile && activeProfile.username === trade.buyerUsername;

  const handleShareTrade = (trade: TradeItem) => {
    const ownerName = trade.creatorUsername || activeProfile?.username || 'user';
    const url = `${window.location.origin}/trade/${trade.id}?owner=${encodeURIComponent(ownerName)}`;
    const shareData = {
      title: `${ownerName}'s Trade: ${trade.title}`,
      text: `Check out ${ownerName}'s trade on ShopAffair: ${trade.title} - ₦${trade.amount.toLocaleString()}`,
      url
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => { });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Trade link copied to clipboard! Share it with your friends.');
      });
    }
  };

  if (!activeProfile) return null;

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden pb-24">
      {!selectedTradeId && !isNew && (
        <TradeListView
          trades={trades}
          loading={tradesLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSelectTrade={(id) => navigate(`/trade/${id}`)}
          onCreateNew={() => navigate('/trade/new')}
          onShareTrade={handleShareTrade}
        />
      )}

      {isNew && (
        <TradeCreateView
          onCancel={() => navigate('/trade')}
          onSubmit={async (payload) => {
            await createTrade(payload);
          }}
          onDone={() => navigate('/trade')}
        />
      )}

      {selectedTrade && isEdit && (
        <TradeCreateView
          initialTrade={selectedTrade}
          onCancel={() => navigate(`/trade/${selectedTrade.id}`)}
          onSubmit={async () => { }}
          onEditSubmit={async (id, updates) => {
            await editTrade(id, updates);
          }}
          onDone={() => navigate(`/trade/${selectedTrade.id}`)}
        />
      )}

      {selectedTrade && !isEdit && (
        <TradeDetailView
          trade={selectedTrade}
          isSeller={isSeller(selectedTrade)}
          isBuyer={isBuyer(selectedTrade)}
          onBack={() => navigate(-1)}
          onFundTrade={async (id) => {
            await fundTrade(id);
          }}
          onVerifyPickupCode={async (id, code) => {
            await verifyPickupCode(id, code);
          }}
          onUpdateStatus={async (id, status) => {
            await updateTradeStatus(id, status);
          }}
          onEditTrade={(id) => navigate(`/trade/${id}/edit`)}
          onCancelTrade={async (id) => {
            await cancelTrade(id);
            navigate('/trade');
          }}
        />
      )}

      {selectedTradeId && !selectedTrade && !tradesLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-sans font-bold text-slate-800">Trade not found</p>
          <p className="text-xs font-sans text-slate-400">It may have been removed or the link is invalid.</p>
          <button
            onClick={() => navigate('/trade')}
            className="mt-2 px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-sans font-bold"
          >
            Back to Trades
          </button>
        </div>
      )}
    </div>
  );
}