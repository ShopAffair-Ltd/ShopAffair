import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string().uuid()).default([]),
  settings: z.object({
    notification: z.boolean().optional(),
    approveMembers: z.boolean().optional(),
    addMembers: z.boolean().optional()
  }).optional()
});

export const createCommunitySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.object({
    visibility: z.boolean().optional(),
    notification: z.boolean().optional(),
    approveMembers: z.boolean().optional(),
    protectTraders: z.boolean().optional(),
    addMembers: z.boolean().optional(),
    whoCanChat: z.enum(['ALL', 'ADMINS']).optional(),
    whoCanPostTrades: z.enum(['ALL', 'ADMINS']).optional(),
    whoCanViewParticipants: z.enum(['ALL', 'ADMINS']).optional()
  }).optional()
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  attachmentName: z.string().optional()
});

export const postTradeSchema = z.object({
  tradeId: z.string().uuid()
});

export const addParticipantSchema = z.object({
  userId: z.string().uuid()
});

export const blockUserSchema = z.object({
  reason: z.string().max(500).optional()
});

export const createInviteSchema = z.object({
  maxUses: z.number().int().min(1).max(100).optional(),
  expiresAt: z.string().datetime().optional()
});

export const updateGroupSettingsSchema = z.object({
  visibility: z.boolean().optional(),
  notification: z.boolean().optional(),
  approveMembers: z.boolean().optional(),
  protectTraders: z.boolean().optional(),
  addMembers: z.boolean().optional(),
  whoCanChat: z.enum(['ALL', 'ADMINS']).optional(),
  whoCanPostTrades: z.enum(['ALL', 'ADMINS']).optional(),
  whoCanViewParticipants: z.enum(['ALL', 'ADMINS']).optional()
}).strict();