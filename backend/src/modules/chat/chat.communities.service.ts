import { ChatRoomType, ParticipantRole } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';

// Lists COMMUNITY chat rooms the user has NOT already joined, for a
// "discover communities" browse screen. Only communities with
// settings.visibility !== false are shown (mirrors the visibility toggle
// already present in createCommunity's default settings).
export const discoverCommunities = async (userId: string, search?: string) => {
  const joinedRoomIds = (
    await prisma.chatRoomParticipant.findMany({
      where: { userId, leftAt: null },
      select: { chatRoomId: true }
    })
  ).map((p) => p.chatRoomId);

  const communities = await prisma.chatRoom.findMany({
    where: {
      type: ChatRoomType.COMMUNITY,
      approvalStatus: 'APPROVED',
      id: { notIn: joinedRoomIds },
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {})
    },
    include: {
      _count: { select: { participants: true, messages: true } },
      creator: { select: { id: true, username: true, name: true, avatarColor: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // Filter out communities explicitly marked private via settings.
  return communities.filter((c) => {
    const settings = c.settings as Record<string, unknown> | null;
    return settings?.visibility !== false;
  });
};

// Self-service join: no inviter required, unlike addParticipant. Respects
// approveMembers the same way addParticipant does for groups — a community
// with approveMembers on cannot be joined instantly and requires an invite
// or (future) an approval flow instead.
export const joinCommunity = async (chatRoomId: string, userId: string) => {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { participants: true }
  });

  if (!chatRoom) {
    throw new ApiError(404, 'Community not found');
  }
  if (chatRoom.type !== ChatRoomType.COMMUNITY) {
    throw new ApiError(400, 'This chat room is not a community');
  }

  const existing = chatRoom.participants.find((p) => p.userId === userId);
  if (existing) {
    throw new ApiError(400, 'You are already a member of this community');
  }

  const settings = chatRoom.settings as Record<string, unknown> | null;
  if (settings?.approveMembers === true) {
    throw new ApiError(403, 'This community requires an invite to join');
  }

  return prisma.chatRoomParticipant.create({
    data: {
      chatRoomId,
      userId,
      role: ParticipantRole.MEMBER
    },
    include: {
      chatRoom: true,
      user: { select: { id: true, username: true, name: true, avatarColor: true } }
    }
  });
};

export const leaveCommunity = async (chatRoomId: string, userId: string) => {
  const participant = await prisma.chatRoomParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId } }
  });

  if (!participant) {
    throw new ApiError(404, 'You are not a member of this community');
  }

  return prisma.chatRoomParticipant.update({
    where: { chatRoomId_userId: { chatRoomId, userId } },
    data: { leftAt: new Date() }
  });
};
/**
 * Promotes an existing member to ADMIN. Only current admins of the group
 * can do this - enforced by the caller checking the requester's own role
 * before calling (see chat.communities.controller.ts).
 */
/**
 * Fetches a single participant's membership record for a chat room, used
 * by controller-level authorization checks (e.g. "is this requester an
 * admin of this group?") before allowing admin-only actions.
 */
export const getParticipant = async (chatRoomId: string, userId: string) => {
  return prisma.chatRoomParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId } }
  });
};

export const promoteToAdmin = async (chatRoomId: string, targetUserId: string) => {
  const participant = await prisma.chatRoomParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId: targetUserId } }
  });

  if (!participant || participant.leftAt) {
    throw new ApiError(404, 'This user is not a member of the group');
  }
  if (participant.role === ParticipantRole.ADMIN) {
    throw new ApiError(400, 'This user is already an admin');
  }

  return prisma.chatRoomParticipant.update({
    where: { chatRoomId_userId: { chatRoomId, userId: targetUserId } },
    data: { role: ParticipantRole.ADMIN }
  });
};

/**
 * Reads a group's permission settings and checks whether a given member's
 * role satisfies the requirement. Shared by the chat-send, trade-post, and
 * view-participants gates so all three toggles behave consistently:
 * 'ADMINS' means only ParticipantRole.ADMIN passes, anything else ('ALL',
 * missing, or unrecognized) allows any member.
 */
export const checkGroupPermission = async (
  chatRoomId: string,
  userId: string,
  settingKey: 'whoCanChat' | 'whoCanPostTrades' | 'whoCanViewParticipants'
): Promise<boolean> => {
  const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!chatRoom) return false;

  // Permission gating only applies to COMMUNITY/GROUP rooms - a DIRECT
  // (1:1) chat has no concept of admin-only settings.
  if (chatRoom.type === ChatRoomType.DIRECT) return true;

  const settings = chatRoom.settings as Record<string, unknown> | null;
  const requirement = settings?.[settingKey];
  if (requirement !== 'ADMINS') return true;

  const participant = await prisma.chatRoomParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId } }
  });

  return participant?.role === ParticipantRole.ADMIN;
};

/**
 * Updates a group's permission/visibility settings. Only callable by group
 * admins (enforced by the controller). Merges into existing settings rather
 * than replacing wholesale, so a partial update (e.g. just whoCanChat)
 * doesn't wipe out other unrelated toggles.
 */
export const updateGroupSettings = async (chatRoomId: string, updates: Record<string, unknown>) => {
  const chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!chatRoom) {
    throw new ApiError(404, 'Group not found');
  }

  const currentSettings = (chatRoom.settings as Record<string, unknown> | null) ?? {};

  return prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: { settings: { ...currentSettings, ...updates } as Prisma.InputJsonValue }
  });
};

export const listAdminGroups = async (userId: string) => {
  const memberships = await prisma.chatRoomParticipant.findMany({
    where: { userId, role: ParticipantRole.ADMIN, leftAt: null },
    include: {
      chatRoom: { select: { id: true, name: true, avatar: true, type: true, approvalStatus: true } }
    }
  });

  return memberships
    .map((m) => m.chatRoom)
    .filter((room) => room.type === ChatRoomType.COMMUNITY && room.approvalStatus === 'APPROVED');
};