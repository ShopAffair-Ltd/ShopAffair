import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import * as communitiesService from './chat.communities.service.js';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const discover = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const communities = await communitiesService.discoverCommunities(user.id, search);
  res.status(200).json({ communities });
});

export const join = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  const participant = await communitiesService.joinCommunity(chatRoomId, user.id);
  res.status(201).json({ participant });
});

export const leave = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  const participant = await communitiesService.leaveCommunity(chatRoomId, user.id);
  res.status(200).json({ participant });
});

/**
 * Promotes a member to admin. The requester must themselves already be an
 * admin of the group - checked here rather than in the service, since it's
 * an authorization concern specific to this HTTP action.
 */
export const promote = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const targetUserId = req.params.userId as string;

  const requesterParticipant = await communitiesService.getParticipant(chatRoomId, user.id);
  if (!requesterParticipant || requesterParticipant.role !== 'ADMIN') {
    throw new ApiError(403, 'Only group admins can promote other members');
  }

  const participant = await communitiesService.promoteToAdmin(chatRoomId, targetUserId);
  res.status(200).json({ participant });
});

/**
 * Updates a group's permission/visibility settings (whoCanChat,
 * whoCanPostTrades, whoCanViewParticipants, etc). Admin-only.
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  const requesterParticipant = await communitiesService.getParticipant(chatRoomId, user.id);
  if (!requesterParticipant || requesterParticipant.role !== 'ADMIN') {
    throw new ApiError(403, 'Only group admins can change group settings');
  }

  const chatRoom = await communitiesService.updateGroupSettings(chatRoomId, req.body ?? {});
  res.status(200).json({ chatRoom });
});
export const myAdminGroups = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const groups = await communitiesService.listAdminGroups(user.id);
  res.status(200).json({ groups });
});