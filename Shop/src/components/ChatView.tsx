import React, { useState, useRef, useEffect } from 'react';
import { ChatRoom } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from './chatSidebar';
import ChatWindow from './chatWindow';
import ChatModals from './chatModals';
import { chatSocket } from '../sockets/chat.socket';

interface ChatViewProps {
  onChatSelect?: (room: ChatRoom | null) => void;
  onChatPartnerName?: (name: string) => void;
}

export default function ChatView({ onChatSelect, onChatPartnerName }: ChatViewProps) {
  const { user } = useAuth();
  const { chatRooms, sendMessage, markAsRead, sendError, clearSendError, loadFullChatHistory } = useChat();
  const navigate = useNavigate();
  const activeProfile = user;

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousRoomIdRef = useRef<string | null>(null);

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

  const selectedRoomLive = React.useMemo(() => {
    if (!selectedRoom) return null;
    return allRooms.find((r) => r.id === selectedRoom.id) ?? selectedRoom;
  }, [allRooms, selectedRoom]);

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

    sendMessage(selectedRoom.id, messageText.trim());
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

  const handleVoiceCall = () => {
    if (!selectedRoom) return;
    if (selectedRoom.participantRole === 'ai') {
      setCallToast("Micha AI doesn't support voice calls. Ask me anything here!");
      return;
    }
    setCallToast(`Calling ${selectedRoom.participantName}...`);
  };

  const handleVisitStoreFromChat = () => {
    if (!selectedRoom) return;
    navigate(`/store/${selectedRoom.participantUsername}`);
    setStoreIconShake(false);
  };

  const handleViewProfileFromChat = () => {
    if (!selectedRoom) return;
    navigate(`/store/${selectedRoom.participantUsername}`);
  };

  const isSellerChat = selectedRoom?.participantRole === 'seller' && selectedRoom?.participantUsername !== activeProfile?.username;
  const isAIChat = selectedRoom?.participantRole === 'ai';

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
        />
      </div>

      {selectedRoomLive && (
        <>
          {sendError && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white text-xs font-sans font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              {sendError}
              <button onClick={clearSendError} className="font-bold">×</button>
            </div>
          )}
          <ChatWindow
            selectedRoom={selectedRoomLive}
            activeUsername={activeProfile.username}
            messageText={messageText}
            setMessageText={setMessageText}
            onSend={handleSend}
            onBack={() => setSelectedRoom(null)}
            onVoiceCall={handleVoiceCall}
            onVisitStore={handleVisitStoreFromChat}
            onViewProfile={handleViewProfileFromChat}
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
        onInviteUser={() => {}}
        onNewGroup={() => {}}
        onNewCommunity={() => {}}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}