import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';

export const createTicket = async (userId: string, subject: string, message: string) => {
  return prisma.supportTicket.create({
    data: { userId, subject, message }
  });
};

export const listMyTickets = async (userId: string) => {
  return prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { replies: { orderBy: { createdAt: 'asc' } } }
  });
};

export const listAllTickets = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { username: true, name: true } },
        replies: { orderBy: { createdAt: 'asc' }, include: { author: { select: { username: true } } } }
      }
    }),
    prisma.supportTicket.count()
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const replyToTicket = async (ticketId: string, authorId: string, content: string, isAdminReply: boolean) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  const reply = await prisma.supportTicketReply.create({
    data: { ticketId, authorId, content, isAdminReply }
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: isAdminReply ? 'IN_PROGRESS' : ticket.status, updatedAt: new Date() }
  });

  if (isAdminReply) {
    await notify({ userId: ticket.userId, title: 'Support replied', message: 'Support replied to your ticket.', type: 'INFO' });
  }

  return reply;
};

export const updateTicketStatus = async (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  return prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
};