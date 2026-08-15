import { api } from './api';

export interface TicketReply {
  id: string;
  content: string;
  isAdminReply: boolean;
  createdAt: string;
  author: { username: string } | null;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  user: { username: string; name: string };
  replies: TicketReply[];
}

export const createTicket = async (subject: string, message: string): Promise<SupportTicket> => {
  const { data } = await api.post<{ ticket: SupportTicket }>('/support', { subject, message });
  return data.ticket;
};

export const fetchMyTickets = async (): Promise<SupportTicket[]> => {
  const { data } = await api.get<{ tickets: SupportTicket[] }>('/support/mine');
  return data.tickets;
};

export const fetchAllTickets = async (page = 1, limit = 20) => {
  const { data } = await api.get<{ items: SupportTicket[]; pagination: any }>('/support', { params: { page, limit } });
  return data;
};

export const replyToTicket = async (ticketId: string, content: string): Promise<void> => {
  await api.post(`/support/${ticketId}/reply`, { content });
};

export const setTicketStatus = async (ticketId: string, status: SupportTicket['status']): Promise<void> => {
  await api.patch(`/support/${ticketId}/status`, { status });
};