import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1)
});

export const replySchema = z.object({
  content: z.string().min(1)
});

export const statusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
});