import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Search, UserPlus, Copy, Users2, UsersIcon,
  ChevronRight, ExternalLink, X, Camera, Bell, ShieldCheck,
  Eye, Asterisk, Clock
} from 'lucide-react';
import { INVITE_LINK } from './chatConstants';
import SettingRow from './chatSettingRow';
import { userService, User } from '../services/userService';
import { chatService } from '../services/chatService';
import { getApiErrorMessage } from '../services/authService';
import { useChat } from '../context/ChatContext';

interface ChatModalsProps {
  showNewChat: boolean;
  setShowNewChat: (show: boolean) => void;
  showNewGroup: boolean;
  setShowNewGroup: (show: boolean) => void;
  showNewCommunity: boolean;
  setShowNewCommunity: (show: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  onInviteUser: () => void;
  onNewGroup: () => void;
  onNewCommunity: () => void;
  onChatCreated?: (username: string) => void;
}

export default function ChatModals({
  showNewChat,
  setShowNewChat,
  showNewGroup,
  setShowNewGroup,
  showNewCommunity,
  setShowNewCommunity,
  showInviteModal,
  setShowInviteModal,
  onInviteUser,
  onNewGroup,
  onNewCommunity,
  onChatCreated,
}: ChatModalsProps) {
  const { refreshChats, chatRooms } = useChat();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [startChatError, setStartChatError] = useState<string | null>(null);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [createCommunityError, setCreateCommunityError] = useState<string | null>(null);
  const [showCommunityPendingModal, setShowCommunityPendingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupNotification, setGroupNotification] = useState(true);
  const [groupApproveMembers, setGroupApproveMembers] = useState(true);
  const [groupAddMembers, setGroupAddMembers] = useState(true);

  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [communityVisibility, setCommunityVisibility] = useState(true);
  const [communityNotification, setCommunityNotification] = useState(true);
  const [communityApproveMembers, setCommunityApproveMembers] = useState(true);
  const [communityProtectTraders, setCommunityProtectTraders] = useState(true);
  const [communityAddMembers, setCommunityAddMembers] = useState(true);

  useEffect(() => {
    if (showNewChat) {
      fetchUsers();
    }
  }, [showNewChat]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await userService.getAllUsers();
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.canChat &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.storeName && user.storeName.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const resetGroupForm = () => {
    setGroupName('');
    setGroupDescription('');
    setGroupNotification(true);
    setGroupApproveMembers(true);
    setGroupAddMembers(true);
    setCreateGroupError(null);
  };

  const resetCommunityForm = () => {
    setCommunityName('');
    setCommunityDescription('');
    setCommunityVisibility(true);
    setCommunityNotification(true);
    setCommunityApproveMembers(true);
    setCommunityProtectTraders(true);
    setCommunityAddMembers(true);
    setCreateCommunityError(null);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(INVITE_LINK);
  };

  const handleStartChat = async (username: string) => {
    setStartChatError(null);
    try {
      await chatService.getOrCreateDirectChat(username);
      await refreshChats();
      setShowNewChat(false);
      
      if (onChatCreated) {
        onChatCreated(username);
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      setStartChatError(getApiErrorMessage(error));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupDescription.trim()) return;
    setCreateGroupError(null);
    try {
      await chatService.createGroup({
        name: groupName,
        description: groupDescription,
        memberIds: [],
        settings: {
          notification: groupNotification,
          approveMembers: groupApproveMembers,
          addMembers: groupAddMembers
        }
      });
      await refreshChats();
      setShowNewGroup(false);
      resetGroupForm();
    } catch (error) {
      console.error('Failed to create group:', error);
      setCreateGroupError(getApiErrorMessage(error));
    }
  };

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || !communityDescription.trim()) return;
    setCreateCommunityError(null);
    try {
      await chatService.createCommunity({
        name: communityName,
        description: communityDescription,
        settings: {
          visibility: communityVisibility,
          notification: communityNotification,
          approveMembers: communityApproveMembers,
          protectTraders: communityProtectTraders,
          addMembers: communityAddMembers
        }
      });
      await refreshChats();
      setShowNewCommunity(false);
      resetCommunityForm();
      setShowCommunityPendingModal(true);
    } catch (error) {
      console.error('Failed to create community:', error);
      setCreateCommunityError(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <AnimatePresence>
        {showNewChat && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-display font-bold text-slate-900">New Chat</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search name, business, or store"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all"
                />
                <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
              </div>

              {startChatError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-sans font-semibold">
                  {startChatError}
                </div>
              )}

              <div className="space-y-1 mb-4">
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setShowInviteModal(true);
                  }}
                  className="w-full py-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl px-1 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4.5 h-4.5 text-slate-500" />
                    </div>
                    <span className="font-sans font-semibold text-sm text-slate-700">Invite User</span>
                  </div>
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setShowNewGroup(true);
                  }}
                  className="w-full py-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Users2 className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <span className="font-sans font-semibold text-sm text-slate-700">New Group</span>
                </button>

                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setShowNewCommunity(true);
                  }}
                  className="w-full py-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <UsersIcon className="w-4.5 h-4.5 text-slate-500" />
                  </div>
                  <span className="font-sans font-semibold text-sm text-slate-700">New Community</span>
                </button>
              </div>

              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-3">ALL USERS</span>

              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-400 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleStartChat(user.username)}
                      className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between transition-all border border-slate-100/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 font-sans font-bold text-lg flex items-center justify-center shrink-0 border-2 border-purple-200 relative">
                          {user.name.charAt(0)}
                          {user.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <span className="block font-sans font-bold text-sm text-slate-800">
                            {user.name}
                          </span>
                          <span className="text-xs font-sans text-slate-400">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative w-full bg-white rounded-t-3xl p-5 pb-8"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-xl font-display font-bold text-slate-900 mb-1">Invite New User</h2>
              <p className="text-xs font-sans text-slate-500 mb-4">
                Copy and share the link below to invite users
              </p>

              <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-3">
                <ExternalLink className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="flex-1 text-xs font-sans text-slate-600 truncate">
                  {INVITE_LINK.length > 34 ? `${INVITE_LINK.slice(0, 34)}...` : INVITE_LINK}
                </span>
                <button
                  onClick={handleCopyInviteLink}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-sans font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewGroup && (
          <div className="fixed inset-0 z-50 bg-[#F8F9FC] flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 bg-[#F8F9FC] z-10 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  resetGroupForm();
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-display font-bold text-slate-900">New Group</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users2 className="w-9 h-9 text-slate-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center border-2 border-[#F8F9FC]">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <label className="block mb-4">
                <span className="text-sm font-sans font-semibold text-slate-700">
                  Group Name <span className="text-purple-500">*</span>
                </span>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all"
                />
              </label>

              <label className="block mb-6">
                <span className="text-sm font-sans font-semibold text-slate-700">
                  Group Description <span className="text-purple-500">*</span>
                </span>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe the purpose of the group"
                  rows={4}
                  className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all resize-none"
                />
              </label>

              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-3">GROUP SETTINGS</span>

              <div className="space-y-1">
                <SettingRow
                  icon={<Bell className="w-4.5 h-4.5 text-slate-500" />}
                  title="Notification"
                  subtitle="Allow public trade alerts"
                  checked={groupNotification}
                  onChange={setGroupNotification}
                />
                <SettingRow
                  icon={<ShieldCheck className="w-4.5 h-4.5 text-slate-500" />}
                  title="Approve new members"
                  subtitle="Manually approve every invite"
                  checked={groupApproveMembers}
                  onChange={setGroupApproveMembers}
                />
                <SettingRow
                  icon={<UserPlus className="w-4.5 h-4.5 text-slate-500" />}
                  title="Add new members"
                  subtitle="Only admins can add new members"
                  checked={groupAddMembers}
                  onChange={setGroupAddMembers}
                />
              </div>
            </div>

            <div className="p-5 pt-2">
              {createGroupError && (
                <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-sans font-semibold">
                  {createGroupError}
                </div>
              )}
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || !groupDescription.trim()}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-sans font-bold text-sm rounded-full shadow-md transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewCommunity && (
          <div className="fixed inset-0 z-50 bg-[#F8F9FC] flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 bg-[#F8F9FC] z-10 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowNewCommunity(false);
                  resetCommunityForm();
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-display font-bold text-slate-900">New Community</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                    <UsersIcon className="w-9 h-9 text-slate-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center border-2 border-[#F8F9FC]">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <label className="block mb-4">
                <span className="text-sm font-sans font-semibold text-slate-700">
                  Community Name <span className="text-purple-500">*</span>
                </span>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Enter community name"
                  className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all"
                />
              </label>

              <label className="block mb-6">
                <span className="text-sm font-sans font-semibold text-slate-700">
                  Community Description <span className="text-purple-500">*</span>
                </span>
                <textarea
                  value={communityDescription}
                  onChange={(e) => setCommunityDescription(e.target.value)}
                  placeholder="Describe the purpose of the community"
                  rows={4}
                  className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all resize-none"
                />
              </label>

              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-3">COMMUNITY SETTINGS</span>

              <div className="space-y-1">
                <SettingRow
                  icon={<Eye className="w-4.5 h-4.5 text-slate-500" />}
                  title="Community Visibility"
                  subtitle="Make the community visible to everyone"
                  checked={communityVisibility}
                  onChange={setCommunityVisibility}
                />
                <SettingRow
                  icon={<Bell className="w-4.5 h-4.5 text-slate-500" />}
                  title="Notification"
                  subtitle="Allow public trade alerts"
                  checked={communityNotification}
                  onChange={setCommunityNotification}
                />
                <SettingRow
                  icon={<ShieldCheck className="w-4.5 h-4.5 text-slate-500" />}
                  title="Approve new members"
                  subtitle="Manually approve every invite"
                  checked={communityApproveMembers}
                  onChange={setCommunityApproveMembers}
                />
                <SettingRow
                  icon={<Asterisk className="w-4.5 h-4.5 text-slate-500" />}
                  title="Protect Traders"
                  subtitle="Redact buyers information"
                  checked={communityProtectTraders}
                  onChange={setCommunityProtectTraders}
                />
                <SettingRow
                  icon={<UserPlus className="w-4.5 h-4.5 text-slate-500" />}
                  title="Add new members"
                  subtitle="Only admins can add new members"
                  checked={communityAddMembers}
                  onChange={setCommunityAddMembers}
                />
              </div>
            </div>

            <div className="p-5 pt-2">
              {createCommunityError && (
                <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-xs font-sans font-semibold">
                  {createCommunityError}
                </div>
              )}
              <button
                onClick={handleCreateCommunity}
                disabled={!communityName.trim() || !communityDescription.trim()}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-sans font-bold text-sm rounded-full shadow-md transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        )}

        {showCommunityPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 mb-1">Community Submitted</h3>
              <p className="text-xs font-sans text-slate-500 mb-6">
                Your community is now Pending Approval. We'll notify you once it's reviewed and live.
              </p>
              <button
                type="button"
                onClick={() => setShowCommunityPendingModal(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}