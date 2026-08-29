import { prisma } from '../../config/db.js';
import { ChatRoomType, ParticipantRole } from '../../generated/prisma/enums.js';
import { ApiError } from '../../utils/ApiError.js';

const isUUID = (str: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const getOrCreateDirectChat = async (userId: string, otherUserIdOrUsername: string) => {
  let otherUserId = otherUserIdOrUsername;
  
  if (!isUUID(otherUserIdOrUsername)) {
    const user = await prisma.user.findUnique({
      where: { username: otherUserIdOrUsername }
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    otherUserId = user.id;
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId }
      ]
    }
  });

  if (block) {
    throw new ApiError(403, 'You cannot start a conversation with this user');
  }

  if (userId !== otherUserId) {
    const alreadyConnectedByTrade = await prisma.trade.findFirst({
      where: {
        OR: [
          { creatorId: userId, buyerId: otherUserId },
          { creatorId: otherUserId, buyerId: userId }
        ]
      },
      select: { id: true }
    });

    const otherUserHasActiveListing = await prisma.trade.findFirst({
      where: {
        creatorId: otherUserId,
        type: 'SUPPLY',
        status: { in: ['PENDING', 'FUNDED'] }
      },
      select: { id: true }
    });

    if (!alreadyConnectedByTrade && !otherUserHasActiveListing) {
      throw new ApiError(
        403,
        'You can only message users you have an active trade with, or sellers with an active listing'
      );
    }
  }

  let chatRoom = await prisma.chatRoom.findFirst({
    where: {
      type: ChatRoomType.DIRECT,
      OR: [
        { initiatorId: userId, participantId: otherUserId },
        { initiatorId: otherUserId, participantId: userId }
      ]
    },
    include: {
      participants: {
        include: { user: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
              avatarColor: true,
              profilePicture: true
            }
          }
        }
      }
    }
  });

  if (chatRoom) return chatRoom;

  chatRoom = await prisma.chatRoom.create({
    data: {
      type: ChatRoomType.DIRECT,
      creatorId: userId,
      initiatorId: userId,
      participantId: otherUserId,
      participants: {
        create: [
          { userId, role: ParticipantRole.MEMBER },
          { userId: otherUserId, role: ParticipantRole.MEMBER }
        ]
      }
    },
    include: {
      participants: {
        include: { user: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
              avatarColor: true,
              profilePicture: true
            }
          }
        }
      }
    }
  });

  return chatRoom;
};

export const createGroup = async (userId: string, data: {
  name: string;
  description?: string;
  memberIds: string[];
  settings?: { notification?: boolean; approveMembers?: boolean; addMembers?: boolean };
}) => {
  if (data.memberIds.length > 0) {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: { in: data.memberIds } },
          { blockerId: { in: data.memberIds }, blockedId: userId }
        ]
      }
    });

    if (blocks.length > 0) {
      throw new ApiError(403, 'You cannot add a user you have blocked, or who has blocked you, to this group');
    }
  }

  const chatRoom = await prisma.chatRoom.create({
    data: {
      type: ChatRoomType.GROUP,
      name: data.name,
      description: data.description,
      creatorId: userId,
      participants: {
        create: [
          { userId, role: ParticipantRole.ADMIN },
          ...data.memberIds.map((id: string) => ({
            userId: id,
            role: ParticipantRole.MEMBER
          }))
        ]
      },
      settings: {
        notification: data.settings?.notification ?? true,
        approveMembers: data.settings?.approveMembers ?? true,
        addMembers: data.settings?.addMembers ?? true,
        whoCanChat: 'ALL',
        whoCanPostTrades: 'ALL',
        whoCanViewParticipants: 'ALL'
      }
    },
    include: {
      participants: {
        include: { user: true }
      }
    }
  });

  return chatRoom;
};

/**
 * Creates a COMMUNITY chat room ("group" in product terms). Gated to
 * sellers with an active Seller Pro subscription (checked via User.isPro -
 * see payments.service.subscribeToSellerPro for how that's earned). Every
 * new community starts PENDING and is invisible to discoverCommunities
 * until a platform admin approves it - self-serve group creation is
 * deliberately not allowed.
 */
export const createCommunity = async (userId: string, data: {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.role !== 'seller') {
    throw new ApiError(403, 'Only sellers can create community groups');
  }
  if (!user.isPro) {
    throw new ApiError(403, 'Only Seller Pro subscribers can create community groups. Subscribe to Seller Pro first.');
  }

  const chatRoom = await prisma.chatRoom.create({
    data: {
      type: ChatRoomType.COMMUNITY,
      name: data.name,
      description: data.description,
      creatorId: userId,
      approvalStatus: 'PENDING',
      participants: {
        create: [
          { userId, role: ParticipantRole.ADMIN }
        ]
      },
      settings: {
        visibility: true,
        notification: true,
        approveMembers: true,
        protectTraders: true,
        addMembers: true,
        whoCanChat: 'ALL',
        whoCanPostTrades: 'ALL',
        whoCanViewParticipants: 'ALL',
        ...data.settings
      }
    },
    include: {
      participants: {
        include: { user: true }
      }
    }
  });

  return chatRoom;
};

export const getUserChats = async (userId: string) => {
  const participantRooms = await prisma.chatRoomParticipant.findMany({
    where: { userId, leftAt: null },
    include: {
      chatRoom: {
        include: {
          participants: {
            include: { user: true }
          },
          associatedTrade: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  role: true,
                  avatarColor: true,
                  profilePicture: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      chatRoom: {
        updatedAt: 'desc'
      }
    }
  });

  return participantRooms.map((p) => {
    const chatRoom = p.chatRoom;
    const messages = chatRoom.messages || [];
    return {
      ...chatRoom,
      isPinned: p.isPinned,
      unreadCount: messages.filter((m) => !m.isRead && m.senderId !== userId).length,
      lastMessage: messages[0]?.content || null,
      lastMessageTime: messages[0]?.createdAt || null
    };
  });
};

export const getChatRoom = async (chatRoomId: string, userId: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      participants: {
        include: { user: true }
      },
      associatedTrade: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        where: { isDeleted: false },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
              avatarColor: true,
              profilePicture: true
            }
          },
          sharedTrade: true
        }
      }
    }
  });

  if (!chatRoom) {
    throw new ApiError(404, 'Chat room not found');
  }

  const participant = chatRoom.participants.find((p) => p.userId === userId);
  if (!participant) {
    throw new ApiError(403, 'You are not a participant of this chat');
  }

  // Group/community permission: if participant details are restricted to
  // admins, non-admin members get everything except the participant list
  // (and their own entry, so the UI can still show "you").
  if (chatRoom.type !== ChatRoomType.DIRECT) {
    const settings = chatRoom.settings as Record<string, unknown> | null;
    if (settings?.whoCanViewParticipants === 'ADMINS' && participant.role !== ParticipantRole.ADMIN) {
      return {
        ...chatRoom,
        participants: chatRoom.participants.filter((p) => p.userId === userId)
      };
    }
  }

  return chatRoom;
};

export const sendMessage = async (chatRoomId: string, senderId: string, content: string, attachmentName?: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { participants: true }
  });

  if (!chatRoom) {
    throw new ApiError(404, 'Chat room not found');
  }

  const participant = await prisma.chatRoomParticipant.findUnique({
    where: {
      chatRoomId_userId: {
        chatRoomId,
        userId: senderId
      }
    }
  });

  if (!participant) {
    throw new ApiError(403, 'You are not a participant of this chat');
  }

  // Group/community chat permission: if the room's settings restrict
  // chatting to admins only, non-admin members are blocked from sending.
  if (chatRoom.type !== ChatRoomType.DIRECT) {
    const settings = chatRoom.settings as Record<string, unknown> | null;
    if (settings?.whoCanChat === 'ADMINS' && participant.role !== ParticipantRole.ADMIN) {
      throw new ApiError(403, 'Only group admins can send messages in this group');
    }
  }

  // Block check: only meaningful for direct chats (a blocked member of a
  // group/community shouldn't be silently muted for everyone else in it).
  // Checks both directions — either party blocking the other stops messages.
  if (chatRoom.type === ChatRoomType.DIRECT) {
    const otherParticipantIds = chatRoom.participants
      .map((p) => p.userId)
      .filter((id) => id !== senderId);

    if (otherParticipantIds.length > 0) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: { in: otherParticipantIds } },
            { blockerId: { in: otherParticipantIds }, blockedId: senderId }
          ]
        }
      });

      if (block) {
        throw new ApiError(403, 'You cannot send messages in this conversation');
      }
    }
  }

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      senderId,
      content,
      attachmentName
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          avatarColor: true,
          profilePicture: true
        }
      }
    }
  });

  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: {
      lastMessage: content,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    }
  });

  return message;
};

/**
 * Posts a real, tappable trade card into a group/community chat. Distinct
 * from sendMessage because it enforces a separate permission
 * (whoCanPostTrades) rather than whoCanChat - a group can allow everyone to
 * chat but restrict trade-dropping to admins, or vice versa. `content` is
 * kept as a short caption so clients that don't render rich cards still see
 * something meaningful.
 */
export const postTradeToGroup = async (chatRoomId: string, senderId: string, tradeId: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!chatRoom) {
    throw new ApiError(404, 'Chat room not found');
  }

  const participant = await prisma.chatRoomParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId: senderId } }
  });
  if (!participant) {
    throw new ApiError(403, 'You are not a participant of this chat');
  }

  if (chatRoom.type !== ChatRoomType.DIRECT) {
    const settings = chatRoom.settings as Record<string, unknown> | null;
    if (settings?.whoCanPostTrades === 'ADMINS' && participant.role !== ParticipantRole.ADMIN) {
      throw new ApiError(403, 'Only group admins can post trades in this group');
    }
  }

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) {
    throw new ApiError(404, 'Trade not found');
  }

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      senderId,
      content: `Shared a trade: ${trade.title}`,
      sharedTradeId: tradeId
    },
    include: {
      sender: {
        select: { id: true, name: true, username: true, role: true, avatarColor: true, profilePicture: true }
      },
      sharedTrade: true
    }
  });

  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: {
      lastMessage: `📎 ${trade.title}`,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    }
  });

  return message;
};

export const markMessagesAsRead = async (chatRoomId: string, userId: string) => {
  await prisma.chatMessage.updateMany({
    where: {
      chatRoomId,
      senderId: { not: userId },
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  await prisma.chatRoomParticipant.updateMany({
    where: {
      chatRoomId,
      userId
    },
    data: {
      lastReadAt: new Date()
    }
  });
};

export const togglePinChat = async (chatRoomId: string, userId: string) => {
  const participant = await prisma.chatRoomParticipant.findUnique({
    where: {
      chatRoomId_userId: {
        chatRoomId,
        userId
      }
    }
  });

  if (!participant) {
    throw new ApiError(404, 'Participant not found');
  }

  return await prisma.chatRoomParticipant.update({
    where: {
      chatRoomId_userId: {
        chatRoomId,
        userId
      }
    },
    data: {
      isPinned: !participant.isPinned
    }
  });
};

export const clearChat = async (chatRoomId: string, userId: string) => {
  const participant = await prisma.chatRoomParticipant.findUnique({
    where: {
      chatRoomId_userId: {
        chatRoomId,
        userId
      }
    }
  });

  if (!participant) {
    throw new ApiError(403, 'You are not a participant of this chat');
  }

  return await prisma.chatMessage.updateMany({
    where: {
      chatRoomId
    },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });
};

export const addParticipant = async (chatRoomId: string, userId: string, inviterId: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      participants: true
    }
  });

  if (!chatRoom) {
    throw new ApiError(404, 'Chat room not found');
  }

  if (chatRoom.type === ChatRoomType.DIRECT) {
    throw new ApiError(400, 'Cannot add participants to direct chat');
  }

  const existing = chatRoom.participants.find((p) => p.userId === userId);
  if (existing) {
    throw new ApiError(400, 'User is already a participant');
  }

  const inviterParticipant = chatRoom.participants.find((p) => p.userId === inviterId);
  const settings = chatRoom.settings as Record<string, any> | null;
  if (chatRoom.type === ChatRoomType.GROUP && settings?.approveMembers) {
    if (!inviterParticipant || inviterParticipant.role !== ParticipantRole.ADMIN) {
      throw new ApiError(403, 'Only admins can add new members');
    }
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: inviterId, blockedId: userId },
        { blockerId: userId, blockedId: inviterId }
      ]
    }
  });

  if (block) {
    throw new ApiError(403, 'You cannot add a user you have blocked, or who has blocked you, to this group');
  }

  return await prisma.chatRoomParticipant.create({
    data: {
      chatRoomId,
      userId,
      role: ParticipantRole.MEMBER
    },
    include: {
      user: true
    }
  });
};

export const removeParticipant = async (chatRoomId: string, userId: string, removerId: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      participants: true
    }
  });

  if (!chatRoom) {
    throw new ApiError(404, 'Chat room not found');
  }

  if (chatRoom.type === ChatRoomType.DIRECT) {
    throw new ApiError(400, 'Cannot remove participants from direct chat');
  }

  const removerParticipant = chatRoom.participants.find((p) => p.userId === removerId);
  if (!removerParticipant || removerParticipant.role !== ParticipantRole.ADMIN) {
    throw new ApiError(403, 'Only admins can remove members');
  }

  return await prisma.chatRoomParticipant.update({
    where: {
      chatRoomId_userId: {
        chatRoomId,
        userId
      }
    },
    data: {
      leftAt: new Date()
    }
  });
};

export const blockUser = async (blockerId: string, blockedId: string, reason?: string) => {
  const existing = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId
      }
    }
  });

  if (existing) {
    throw new ApiError(400, 'User already blocked');
  }

  return await prisma.block.create({
    data: {
      blockerId,
      blockedId,
      reason
    }
  });
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
  const existing = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId
      }
    }
  });

  if (!existing) {
    throw new ApiError(404, 'Block not found');
  }

  return await prisma.block.delete({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId
      }
    }
  });
};

export const getBlockedUsers = async (userId: string) => {
  return await prisma.block.findMany({
    where: { blockerId: userId },
    include: {
      blocked: true
    }
  });
};

export const createInvite = async (chatRoomId: string, createdById: string, maxUses: number = 1, expiresAt?: Date) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { participants: true }
  });

  if (!chatRoom) {
    throw new ApiError(404, 'Chat room not found');
  }

  if (chatRoom.type === ChatRoomType.DIRECT) {
    throw new ApiError(400, 'Cannot create invites for direct chats');
  }

  const requesterParticipant = chatRoom.participants.find((p) => p.userId === createdById);
  if (!requesterParticipant) {
    throw new ApiError(403, 'You are not a participant of this chat');
  }
  if (requesterParticipant.role !== ParticipantRole.ADMIN) {
    throw new ApiError(403, 'Only admins can create invite links');
  }

  const code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

  return await prisma.chatInvite.create({
    data: {
      code,
      chatRoomId,
      createdById,
      maxUses,
      expiresAt
    }
  });
};

export const useInvite = async (code: string, userId: string) => {
  const invite = await prisma.chatInvite.findUnique({
    where: { code },
    include: {
      chatRoom: true
    }
  });

  if (!invite) {
    throw new ApiError(404, 'Invalid invite code');
  }

  if (!invite.isActive) {
    throw new ApiError(400, 'Invite link is inactive');
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new ApiError(400, 'Invite link has expired');
  }

  if (invite.usedCount >= invite.maxUses) {
    throw new ApiError(400, 'Invite link has reached maximum uses');
  }

  const existing = await prisma.chatRoomParticipant.findUnique({
    where: {
      chatRoomId_userId: {
        chatRoomId: invite.chatRoomId,
        userId
      }
    }
  });

  if (existing) {
    throw new ApiError(400, 'You are already a participant');
  }

  await prisma.$transaction([
    prisma.chatInvite.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } }
    }),
    prisma.chatRoomParticipant.create({
      data: {
        chatRoomId: invite.chatRoomId,
        userId,
        role: ParticipantRole.MEMBER
      }
    })
  ]);

  return invite.chatRoom;
};

/**
 * Ensures a DIRECT chat room exists between a trade's creator and buyer,
 * linked via ChatRoom.associatedTradeId (unique per trade). Called the
 * moment a trade is funded, since that's the first point two real
 * participants exist. Idempotent: if a chat room already exists for this
 * trade, it's reused rather than duplicated.
 */
export const getOrCreateTradeChat = async (tradeId: string, creatorId: string, buyerId: string) => {
  const existing = await prisma.chatRoom.findUnique({ where: { associatedTradeId: tradeId } });
  if (existing) return existing;

  return prisma.chatRoom.create({
    data: {
      type: ChatRoomType.DIRECT,
      creatorId,
      initiatorId: buyerId,
      participantId: creatorId,
      associatedTradeId: tradeId,
      participants: {
        create: [
          { userId: creatorId, role: ParticipantRole.MEMBER },
          { userId: buyerId, role: ParticipantRole.MEMBER }
        ]
      }
    }
  });
};


export const postTradeSystemMessage = async (tradeId: string, content: string) => {
  try {
    const chatRoom = await prisma.chatRoom.findUnique({ where: { associatedTradeId: tradeId } });
    if (!chatRoom) return null;

    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: chatRoom.id,
        senderId: null,
        isSystem: true,
        content
      }
    });

    await prisma.chatRoom.update({
      where: { id: chatRoom.id },
      data: { lastMessage: content, lastMessageAt: new Date(), updatedAt: new Date() }
    });

    return message;
  } catch (err) {
    console.error('Failed to post trade system message:', err);
    return null;
  }
};