import { api } from '../../../services/api';
import type {
  CustomerTicketSummary,
  CustomerTicketDetail,
  CustomerTicketActivity,
} from '../../../types/support';

interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface TicketsListResponse {
  tickets: CustomerTicketSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const supportApi = {
  createTicket: (formData: FormData) =>
    api.post<ApiSuccessResponse<{ ticket: CustomerTicketSummary }>>(
      '/mobile/support/tickets',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    ),

  getMyTickets: (page = 1, limit = 15) =>
    api.get<ApiSuccessResponse<TicketsListResponse>>('/mobile/support/tickets', {
      params: { page, limit },
    }),

  getTicketDetail: (ticketId: string) =>
    api.get<ApiSuccessResponse<{ ticket: CustomerTicketDetail }>>(
      `/mobile/support/tickets/${ticketId}`
    ),

  replyTicket: (ticketId: string, message: string) =>
    api.post<ApiSuccessResponse<{ activity: CustomerTicketActivity; reopened: boolean }>>(
      `/mobile/support/tickets/${ticketId}/reply`,
      { message }
    ),
};