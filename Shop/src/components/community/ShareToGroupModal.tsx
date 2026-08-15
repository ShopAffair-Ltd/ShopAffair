import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Loader2, Check } from 'lucide-react';
import { fetchMyAdminGroups, postTradeToGroup, AdminGroup } from '../../services/communityService';

interface ShareToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
}

export default function ShareToGroupModal({ isOpen, onClose, tradeId }: ShareToGroupModalProps) {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSentId(null);
    fetchMyAdminGroups()
      .then(setGroups)
      .catch(() => setError('Could not load your groups'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleShare = async (groupId: string) => {
    setPostingId(groupId);
    setError(null);
    try {
      await postTradeToGroup(groupId, tradeId);
      setSentId(groupId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not post trade to this group';
      setError(message);
    } finally {
      setPostingId(null);
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
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-50">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-1" />
              <h3 className="text-base font-display font-bold text-slate-900">Share to a Group</h3>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[11px] font-sans font-semibold">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-xs font-sans text-slate-400 text-center py-4">
                You don't admin any approved groups yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleShare(group.id)}
                    disabled={postingId === group.id || sentId === group.id}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left disabled:opacity-70"
                  >
                    <span className="text-xs font-sans font-bold text-slate-700">{group.name ?? 'Group'}</span>
                    {postingId === group.id ? (
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    ) : sentId === group.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="text-[10px] font-sans font-bold text-purple-600">Share</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}