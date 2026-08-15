import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { createTicketSchema, replySchema, statusSchema } from './support.validation';
import { createTicket, listMyTickets, listAllTickets, replyToTicket, updateTicketStatus } from './support.service';

const requireUser = (req: Request) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated');
  return req.user;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { subject, message } = createTicketSchema.parse(req.body);
  const ticket = await createTicket(user.id, subject, message);
  res.status(201).json({ ticket });
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const tickets = await listMyTickets(user.id);
  res.status(200).json({ tickets });
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAllTickets(page, limit);
  res.status(200).json(result);
});

export const reply = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const ticketId = req.params.ticketId as string;
  const { content } = replySchema.parse(req.body);
  const isAdminReply = user.role === 'admin';
  const ticketReply = await replyToTicket(ticketId, user.id, content, isAdminReply);
  res.status(201).json({ reply: ticketReply });
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const ticketId = req.params.ticketId as string;
  const { status } = statusSchema.parse(req.body);
  const ticket = await updateTicketStatus(ticketId, status);
  res.status(200).json({ ticket });
});