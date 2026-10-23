import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, MessageCircle, Store, Loader2, Check } from 'lucide-react';
import { fetchMyAdminGroups, postTradeToGroup, AdminGroup } from '../../services/communityService';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface ShareToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
}

type ShareTab = 'chats' | 'groups' | 'store';

// A single share target, whatever kind of room it points at - a DM, an
// admin group, or the user's own store wall. The backend only needs a
// chatRoomId, so all three share the same postTradeToGroup() call.
interface ShareTarget {
  id: string;
  label: string;
}

export default function ShareToGroupModal({ isOpen, onClose, tradeId }: ShareToGroupModalProps) {
  const { chatRooms } = useChat();
  const { user } = useAuth();
  const [tab, setTab] = useState<ShareTab>('chats');
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setGroupsLoading(true);
    setError(null);
    setSentId(null);
    fetchMyAdminGroups()
      .then(setGroups)
      .catch(() => setError('Could not load your groups'))
      .finally(() => setGroupsLoading(false));
  }, [isOpen]);

  const handleShare = async (roomId: string) => {
    setPostingId(roomId);
    setError(null);
    try {
      await postTradeToGroup(roomId, tradeId);
      setSentId(roomId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not share this trade here';
      setError(message);
    } finally {
      setPostingId(null);
    }
  };

  const isGroupType = (type?: string) => type === 'GROUP' || type === 'COMMUNITY' || type === 'group' || type === 'community';

  // Individual chat threads, excluding group/community rooms (those have
  // their own tab) and the AI assistant thread.
  const directChats: ShareTarget[] = chatRooms
    .filter((room) => room.participantRole !== 'ai' && !isGroupType(room.type))
    .map((room) => ({ id: room.id, label: room.participantName }));

  // The user's own store wall is just their own community/group room, if
  // they have one - posting a trade there is the "My Store" share option.
  const storeRoom = chatRooms.find(
    (room) => isGroupType(room.type) && room.participantUsername === user?.username
  );

  const renderTarget = (target: ShareTarget) => (
    <button
      key={target.id}
      onClick={() => handleShare(target.id)}
      disabled={postingId === target.id || sentId === target.id}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left disabled:opacity-70"
    >
      <span className="text-xs font-sans font-bold text-slate-700">{target.label}</span>
      {postingId === target.id ? (
        <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
      ) : sentId === target.id ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <span className="text-[10px] font-sans font-bold text-purple-600">Share</span>
      )}
    </button>
  );

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
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-50">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-1" />
              <h3 className="text-base font-display font-bold text-slate-900">Share Trade</h3>
            </div>

            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setTab('chats')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-sans font-bold transition-colors ${tab === 'chats' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
                  }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chats
              </button>
              <button
                onClick={() => setTab('groups')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-sans font-bold transition-colors ${tab === 'groups' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
                  }`}
              >
                <Users className="w-3.5 h-3.5" /> Groups
              </button>
              <button
                onClick={() => setTab('store')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-sans font-bold transition-colors ${tab === 'store' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
                  }`}
              >
                <Store className="w-3.5 h-3.5" /> My Store
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[11px] font-sans font-semibold">
                {error}
              </div>
            )}

            {tab === 'chats' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {directChats.length === 0 ? (
                  <p className="text-xs font-sans text-slate-400 text-center py-4">No chats yet.</p>
                ) : (
                  directChats.map(renderTarget)
                )}
              </div>
            )}

            {tab === 'groups' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {groupsLoading ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-xs font-sans text-slate-400 text-center py-4">
                    You don't admin any approved groups yet.
                  </p>
                ) : (
                  groups.map((group) => renderTarget({ id: group.id, label: group.name ?? 'Group' }))
                )}
              </div>
            )}

            {tab === 'store' && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {storeRoom ? (
                  renderTarget({ id: storeRoom.id, label: 'My Store Wall' })
                ) : (
                  <p className="text-xs font-sans text-slate-400 text-center py-4">
                    You don't have a store wall to post to yet.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}