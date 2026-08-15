import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    memberIds: z.array(z.string().uuid()).min(1)
  })
});

export const createCommunitySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    settings: z.object({
      visibility: z.boolean().optional(),
      notification: z.boolean().optional(),
      approveMembers: z.boolean().optional(),
      protectTraders: z.boolean().optional(),
      addMembers: z.boolean().optional()
    }).optional()
  })
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    attachmentName: z.string().optional()
  })
});

export const addParticipantSchema = z.object({
  body: z.object({
    userId: z.string().uuid()
  })
});

export const blockUserSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional()
  })
});

export const createInviteSchema = z.object({
  body: z.object({
    maxUses: z.number().int().min(1).max(100).optional(),
    expiresAt: z.string().datetime().optional()
  })
});