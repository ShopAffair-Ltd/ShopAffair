import React, { useState, useRef, useEffect } from 'react';
import { ChatRoom } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ChatSidebar from './chatSidebar';
import ChatWindow from './chatWindow';
import ChatModals from './chatModals';
import { chatSocket } from '../sockets/chat.socket';
import { api } from '../services/api';
import { reviewService, Review } from '../services/reviewService';
import { PhoneCall, PhoneOff, Star, ShieldCheck, Store, X } from 'lucide-react';

interface ChatViewProps {
  onChatSelect?: (room: ChatRoom | null) => void;
  onChatPartnerName?: (name: string) => void;
}

export default function ChatView({ onChatSelect, onChatPartnerName }: ChatViewProps) {
  const { user } = useAuth();
  const { chatRooms, sendMessage, markAsRead, sendError, clearSendError, loadFullChatHistory, togglePinChat, clearChatRoom, blockChatUser } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const enquiryTrade = (location.state as { enquiryTrade?: any } | null)?.enquiryTrade;

  const { roomUsername } = useParams<{ roomUsername?: string }>();
  const activeProfile = user;

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Chats' | 'Unread' | 'Stores' | 'Groups'>('All');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [callToast, setCallToast] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [storeIconShake, setStoreIconShake] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{
    chatRoomId: string;
    callerId: string;
    callerName: string;
    callerUsername: string;
  } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [partnerReviews, setPartnerReviews] = useState<Review[]>([]);
  const [loadingPartnerProfile, setLoadingPartnerProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousRoomIdRef = useRef<string | null>(null);

  const selectedRoom = React.useMemo(() => {
    if (!roomUsername) return null;
    return chatRooms.find((r) => r.id === roomUsername || r.participantUsername === roomUsername) ?? null;
  }, [chatRooms, roomUsername]);

  const setSelectedRoom = (room: ChatRoom | null) => {
    if (room) {
      const target = room.type === 'GROUP' || room.type === 'COMMUNITY' ? room.id : room.participantUsername;
      navigate(`/chat/${target}`);
    } else {
      navigate('/chat');
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      if (previousRoomIdRef.current !== selectedRoom.id) {
        previousRoomIdRef.current = selectedRoom.id;
        chatSocket.joinChat(selectedRoom.id);
        markAsRead(selectedRoom.id);
        loadFullChatHistory(selectedRoom.id);
      }
      if (onChatSelect) onChatSelect(selectedRoom);
      if (onChatPartnerName) onChatPartnerName(selectedRoom.participantName);
    } else {
      previousRoomIdRef.current = null;
      if (onChatSelect) onChatSelect(null);
      if (onChatPartnerName) onChatPartnerName('');
    }

    return () => {
      if (selectedRoom) {
        chatSocket.leaveChat(selectedRoom.id);
      }
    };
  }, [selectedRoom, markAsRead, onChatSelect, onChatPartnerName, loadFullChatHistory]);

  const allRooms = React.useMemo(() => {
    return chatRooms;
  }, [chatRooms]);

  useEffect(() => {
    if (!callToast) return;
    const t = setTimeout(() => setCallToast(null), 2000);
    return () => clearTimeout(t);
  }, [callToast]);

  useEffect(() => {
    if (selectedRoom) {
      setStoreIconShake(true);
      const timer = setTimeout(() => setStoreIconShake(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [selectedRoom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !messageText.trim()) return;

    let tradeIdToShare: string | undefined = undefined;
    if (enquiryTrade?.id) {
      const cleanId = String(enquiryTrade.id).replace(/^trade:/, '');
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId)) {
        tradeIdToShare = cleanId;
      }
    }

    sendMessage(selectedRoom.id, messageText.trim(), { sharedTradeId: tradeIdToShare });
    setMessageText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    sendMessage(selectedRoom.id, `📎 ${file.name}`);
    e.target.value = '';
  };

  const handleTypingStart = () => {
    if (selectedRoom) {
      chatSocket.startTyping(selectedRoom.id);
    }
  };

  const handleTypingStop = () => {
    if (selectedRoom) {
      chatSocket.stopTyping(selectedRoom.id);
    }
  };

  useEffect(() => {
    const handleIncoming = (data: {
      chatRoomId: string;
      callerId: string;
      callerName: string;
      callerUsername: string;
    }) => {
      setIncomingCall(data);
    };
    const handleEnded = () => {
      setIncomingCall(null);
    };
    chatSocket.on('onIncomingCall', handleIncoming);
    chatSocket.on('onCallEnded', handleEnded);
    return () => {
      chatSocket.off('onIncomingCall', handleIncoming);
      chatSocket.off('onCallEnded', handleEnded);
    };
  }, []);

  const handleVoiceCall = () => {
    if (!selectedRoom || !activeProfile) return;
    if (selectedRoom.participantRole === 'ai') {
      setCallToast("Micha AI doesn't support voice calls. Ask me anything here!");
      return;
    }
    const other = (selectedRoom.participants || []).find(
      (p: any) => (p.user?.username || p.username) !== activeProfile.username
    );
    const targetUserId = other?.userId || other?.user?.id || other?.id;
    if (targetUserId) {
      chatSocket.callUser({
        chatRoomId: selectedRoom.id,
        targetUserId,
        callerName: activeProfile.name,
        callerUsername: activeProfile.username
      });
    }
    setCallToast(`Ringing ${selectedRoom.participantName}...`);
  };

  const handleVisitStoreFromChat = () => {
    if (!selectedRoom) return;
    navigate(`/store/${selectedRoom.participantUsername}`);
    setStoreIconShake(false);
  };

  const handleViewProfileFromChat = async () => {
    if (!selectedRoom || selectedRoom.type === 'GROUP' || selectedRoom.type === 'COMMUNITY') return;
    setProfileModalOpen(true);
    setLoadingPartnerProfile(true);
    setPartnerProfile(null);
    setPartnerReviews([]);
    try {
      const [userRes, reviewsRes] = await Promise.all([
        api.get(`/users/username/${selectedRoom.participantUsername}`),
        reviewService
          .getSellerReviews(selectedRoom.participantUsername)
          .then((r) => r.data)
          .catch(() => ({
            reviews: [],
            stats: { averageRating: 0, totalReviews: 0 }
          }))
      ]);
      setPartnerProfile(userRes.data.user);
      setPartnerReviews(reviewsRes.reviews || []);
    } catch {
      // keep modal open with fallback room info
    } finally {
      setLoadingPartnerProfile(false);
    }
  };

  const isSellerChat = selectedRoom?.participantRole === 'seller' && selectedRoom?.participantUsername !== activeProfile?.username;
  const isAIChat = selectedRoom?.participantRole === 'ai';

  const getOtherParticipantId = (room: ChatRoom): string | null => {
    const other = room.participants?.find(
      (p: any) => p.user?.username !== activeProfile?.username && p.username !== activeProfile?.username
    );
    return other?.user?.id || other?.userId || other?.id || null;
  };

  const showToast = (msg: string) => {
    setCallToast(msg);
    setTimeout(() => setCallToast(null), 2800);
  };

  const handleTogglePin = async (room: ChatRoom) => {
    try {
      await togglePinChat(room.id);
      showToast(room.isPinned ? `Unpinned ${room.participantName}` : `Pinned ${room.participantName}`);
    } catch {
      showToast('Failed to update pin status');
    }
  };

  const handleClearChat = async (room: ChatRoom) => {
    if (!window.confirm(`Clear all messages in chat with ${room.participantName}?`)) return;
    try {
      await clearChatRoom(room.id);
      showToast(`Cleared chat with ${room.participantName}`);
    } catch {
      showToast('Failed to clear chat');
    }
  };

  const handleBlockUser = async (room: ChatRoom) => {
    const targetId = getOtherParticipantId(room);
    if (!targetId) {
      showToast('Cannot block this chat');
      return;
    }
    if (!window.confirm(`Block ${room.participantName}? You will no longer receive messages from them.`)) return;
    try {
      await blockChatUser(targetId);
      if (selectedRoom?.id === room.id) {
        setSelectedRoom(null);
      }
      showToast(`Blocked ${room.participantName}`);
    } catch {
      showToast('Failed to block account');
    }
  };

  const handleChatCreated = (username: string) => {
    const room = chatRooms.find(r => r.participantUsername === username);
    if (room) {
      setSelectedRoom(room);
    }
  };

  if (!activeProfile) return null;

  return (
    <div className="flex-1 flex bg-[#F8F9FC] h-full overflow-hidden pb-24">
      <div className={`w-full flex-col h-full ${selectedRoom ? 'hidden' : 'flex'}`}>
        <ChatSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          allRooms={allRooms}
          selectedRoomId={selectedRoom?.id ?? null}
          onSelectRoom={setSelectedRoom}
          onShowNewChat={() => setShowNewChat(true)}
          showOverflowMenu={showOverflowMenu}
          setShowOverflowMenu={setShowOverflowMenu}
          onShowNewGroup={() => setShowNewGroup(true)}
          onShowNewCommunity={() => setShowNewCommunity(true)}
          onTogglePin={handleTogglePin}
          onClearChat={handleClearChat}
          onBlockUser={handleBlockUser}
        />
      </div>

      {selectedRoom && (
        <>
          {sendError && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white text-xs font-sans font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              {sendError}
              <button onClick={clearSendError} className="font-bold">×</button>
            </div>
          )}
          <ChatWindow
            selectedRoom={selectedRoom}
            activeUsername={activeProfile.username}
            messageText={messageText}
            setMessageText={setMessageText}
            onSend={handleSend}
            onBack={() => setSelectedRoom(null)}
            onVoiceCall={handleVoiceCall}
            onVisitStore={handleVisitStoreFromChat}
            onViewProfile={handleViewProfileFromChat}
            onTogglePin={() => handleTogglePin(selectedRoom)}
            onClearChat={() => handleClearChat(selectedRoom)}
            onBlockUser={() => handleBlockUser(selectedRoom)}
            callToast={callToast}
            showChatMenu={showChatMenu}
            setShowChatMenu={setShowChatMenu}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            storeIconShake={storeIconShake}
            isAIChat={isAIChat}
            isSellerChat={isSellerChat}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            enquiryTrade={enquiryTrade}
          />
        </>
      )}

      <ChatModals
        showNewChat={showNewChat}
        setShowNewChat={setShowNewChat}
        showNewGroup={showNewGroup}
        setShowNewGroup={setShowNewGroup}
        showNewCommunity={showNewCommunity}
        setShowNewCommunity={setShowNewCommunity}
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        onInviteUser={() => { }}
        onNewGroup={() => { }}
        onNewCommunity={() => { }}
        onChatCreated={handleChatCreated}
      />

      {incomingCall && (
        <div className="fixed inset-x-4 top-20 z-[120] max-w-sm mx-auto bg-white border border-purple-200 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center animate-pulse shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-sans font-bold text-slate-900 truncate">{incomingCall.callerName}</p>
              <p className="text-[11px] font-sans text-purple-600">Incoming voice call...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                chatSocket.endCall({ targetUserId: incomingCall.callerId, chatRoomId: incomingCall.chatRoomId });
                setIncomingCall(null);
              }}
              className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
              aria-label="Decline call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {profileModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-slate-900">User Profile</h3>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingPartnerProfile ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 font-bold text-lg flex items-center justify-center overflow-hidden shrink-0">
                    {partnerProfile?.profilePicture ? (
                      <img src={partnerProfile.profilePicture} alt={partnerProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      (partnerProfile?.name || selectedRoom.participantName).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-sans font-bold text-slate-900 truncate">
                        {partnerProfile?.name || selectedRoom.participantName}
                      </p>
                      {partnerProfile?.verificationStatus === 'VERIFIED' && (
                        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 truncate">
                      @{partnerProfile?.username || selectedRoom.participantUsername}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                      <span className="flex items-center gap-0.5 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {(partnerProfile?.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-slate-400">({partnerReviews.length} reviews)</span>
                    </div>
                  </div>
                </div>

                {partnerProfile?.role === 'seller' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalOpen(false);
                      navigate(`/store/${partnerProfile.id || partnerProfile.username}`);
                    }}
                    className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-sans font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" /> Visit Seller Store
                  </button>
                )}

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Past Trade Reviews
                  </p>
                  {partnerReviews.length === 0 ? (
                    <p className="text-xs font-sans text-slate-400 py-3 text-center">No trade reviews yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {partnerReviews.map((rev) => (
                        <div key={rev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{rev.reviewerName}</span>
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {rev.rating}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug">{rev.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}