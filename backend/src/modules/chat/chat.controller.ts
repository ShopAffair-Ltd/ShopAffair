import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import * as chatService from './chat.service.js';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const getOrCreateDirectChat = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const userId = req.params.userId as string;

  const chatRoom = await chatService.getOrCreateDirectChat(user.id, userId);
  res.status(200).json({ chatRoom });
});

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { name, description, memberIds } = req.body;

  const chatRoom = await chatService.createGroup(user.id, { name, description, memberIds });
  res.status(201).json({ chatRoom });
});

export const createCommunity = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { name, description, settings } = req.body;

  const chatRoom = await chatService.createCommunity(user.id, { name, description, settings });
  res.status(201).json({ chatRoom });
});

export const getUserChats = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);

  const chats = await chatService.getUserChats(user.id);
  res.status(200).json({ chats });
});

export const getChatRoom = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  const chatRoom = await chatService.getChatRoom(chatRoomId, user.id);
  res.status(200).json({ chatRoom });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const { content, attachmentName } = req.body;

  const message = await chatService.sendMessage(chatRoomId, user.id, content, attachmentName);
  res.status(201).json({ message });
});

export const postTrade = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const { tradeId } = req.body;

  const message = await chatService.postTradeToGroup(chatRoomId, user.id, tradeId);
  res.status(201).json({ message });
});

export const markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  await chatService.markMessagesAsRead(chatRoomId, user.id);
  res.status(200).json({ message: 'Messages marked as read' });
});

export const togglePinChat = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  const result = await chatService.togglePinChat(chatRoomId, user.id);
  res.status(200).json({ result });
});

export const clearChat = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;

  await chatService.clearChat(chatRoomId, user.id);
  res.status(200).json({ message: 'Chat cleared successfully' });
});

export const addParticipant = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const { userId } = req.body;

  const result = await chatService.addParticipant(chatRoomId, userId, user.id);
  res.status(200).json({ result });
});

export const removeParticipant = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const userId = req.params.userId as string;

  await chatService.removeParticipant(chatRoomId, userId, user.id);
  res.status(200).json({ message: 'Participant removed successfully' });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const userId = req.params.userId as string;
  const { reason } = req.body;

  const result = await chatService.blockUser(user.id, userId, reason);
  res.status(200).json({ result });
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const userId = req.params.userId as string;

  await chatService.unblockUser(user.id, userId);
  res.status(200).json({ message: 'User unblocked successfully' });
});

export const getBlockedUsers = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);

  const blockedUsers = await chatService.getBlockedUsers(user.id);
  res.status(200).json({ blockedUsers });
});

export const createInvite = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const { maxUses, expiresAt } = req.body;

  const invite = await chatService.createInvite(chatRoomId, user.id, maxUses, expiresAt);
  res.status(201).json({ invite });
});

export const useInvite = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const code = req.params.code as string;

  const chatRoom = await chatService.useInvite(code, user.id);
  res.status(200).json({ chatRoom });
});