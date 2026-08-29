import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Image as ImageIcon, AlertCircle, Store, Share, Users, Check } from 'lucide-react';
import { TradeItem, EscrowStatus, TradeType } from '../types';
import { useCommunities } from '../context/CommunityContext';
import CreateGroupModal from './community/CreateGroupModal';

type FilterOption = 'All' | 'Drafts' | 'Offers' | 'Pending';

interface TradeListViewProps {
  trades: TradeItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onSelectTrade: (id: string) => void;
  onCreateNew: () => void;
  onShareTrade: (trade: TradeItem) => void;
}

export default function TradeListView({
  trades,
  loading,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onSelectTrade,
  onCreateNew,
  onShareTrade
}: TradeListViewProps) {
  const { communities, isLoading: communitiesLoading, discover, join } = useCommunities();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [justJoinedId, setJustJoinedId] = useState<string | null>(null);

  useEffect(() => {
    discover();
  }, [discover]);

  const handleJoin = async (communityId: string) => {
    setJoiningId(communityId);
    try {
      await join(communityId);
      setJustJoinedId(communityId);
    } catch (err) {
      console.error(err);
    } finally {
      setJoiningId(null);
    }
  };

  const filteredTrades = trades.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Drafts') return matchesSearch && t.status === EscrowStatus.DRAFT;
    if (activeFilter === 'Pending') return matchesSearch && t.status === EscrowStatus.PENDING;
    if (activeFilter === 'Offers') return matchesSearch && (t.status === EscrowStatus.FUNDED || t.status === EscrowStatus.DELIVERED);
    return matchesSearch;
  });

  const showCommunities = activeFilter === 'All' && searchQuery === '';

  return (
    <>
      <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-slate-50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-display font-bold text-slate-900">Trades</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateNew}
            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-100 cursor-pointer"
          >
            <Plus className="w-5.5 h-5.5 stroke-[2.5]" />
          </motion.button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trades, communities..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-sans text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 focus:bg-white transition-all"
          />
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
          {(['All', 'Drafts', 'Offers', 'Pending'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-2 rounded-lg text-xs font-sans font-bold whitespace-nowrap transition-all border ${
                activeFilter === filter
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar space-y-4"
      >
        {showCommunities && (
          <div className="mb-4">
            <h3 className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Store className="w-3.5 h-3.5" />
              Store Communities
            </h3>

            {communitiesLoading ? (
              <div className="p-4 text-center text-xs font-sans text-slate-400">Loading communities...</div>
            ) : communities.length > 0 ? (
              <div className="space-y-2">
                {communities.map((community) => {
                  const isJoining = joiningId === community.id;
                  const justJoined = justJoinedId === community.id;

                  return (
                    <div
                      key={community.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 font-sans font-bold text-base flex items-center justify-center shrink-0 border-2 border-purple-200">
                          {community.avatarLetter}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-sans font-bold text-sm text-slate-800 truncate">{community.name}</span>
                          </div>
                          <p className="text-xs font-sans text-slate-400 truncate">{community.lastMessage}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" /> {community.memberCount} members
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!justJoined) handleJoin(community.id);
                        }}
                        disabled={isJoining || justJoined}
                        className={`shrink-0 ml-2 px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all flex items-center gap-1 ${
                          justJoined
                            ? 'bg-green-50 text-green-600 cursor-default'
                            : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
                        }`}
                      >
                        {justJoined ? (
                          <>
                            <Check className="w-3 h-3" /> Joined
                          </>
                        ) : isJoining ? (
                          'Joining...'
                        ) : (
                          'Join'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-[11px] font-sans text-slate-400">No communities to discover right now.</p>
              </div>
            )}
          </div>
        )}

        {showCommunities && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Trade Groups
              </h3>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="text-[10px] font-sans font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Create Group
              </button>
            </div>
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
              <p className="text-[11px] font-sans text-slate-400">
                Sellers can create trade groups for their community. Every group is reviewed before it goes live.
              </p>
            </div>
          </div>
        )}

        <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />

        {loading ? (
          <div className="text-center py-20 px-6">
            <p className="text-sm font-sans text-slate-400 font-medium">Loading trades...</p>
          </div>
        ) : filteredTrades.length > 0 ? (
          filteredTrades.map((trade) => (
            <motion.div
              key={trade.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2 }}
              onClick={() => onSelectTrade(trade.id)}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex items-start gap-3.5 relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                {trade.image ? (
                  <img src={trade.image} alt={trade.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`text-[9px] font-sans font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      trade.type === TradeType.SUPPLY
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-sky-50 text-sky-600 border border-sky-100'
                    }`}
                  >
                    {trade.type === TradeType.SUPPLY ? 'Supply Order' : 'Demand Order'}
                  </span>
                </div>
                <h3 className="text-sm font-sans font-extrabold text-slate-800 truncate">{trade.title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-sans text-slate-500">
                  <span>@{trade.creatorUsername}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-amber-600 font-bold">★ {trade.creatorRating} ({trade.reviewsCount})</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-sans font-black text-purple-600">₦{trade.amount.toLocaleString()}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareTrade(trade);
                    }}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Share this trade"
                  >
                    <Share className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="absolute top-4 right-4 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    trade.status === EscrowStatus.FUNDED
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : trade.status === EscrowStatus.DELIVERED
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : trade.status === EscrowStatus.COMPLETED
                      ? 'bg-green-50 text-green-600 border border-green-100'
                      : trade.status === EscrowStatus.DISPUTED
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-slate-50 text-slate-500 border border-slate-200/50'
                  }`}
                >
                  {trade.status}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 px-6">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-sans text-slate-500 font-medium">No active escrow trades found.</p>
          </div>
        )}
      </motion.div>
    </>
  );
}