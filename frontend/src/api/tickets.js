// frontend/src/api/tickets.js

import apiClient from "./apiClient";

/**
 * ============================================
 * GET TICKETS (with filters & pagination)
 * ============================================
 */
export const getTickets = async (params = {}) => {
  const {
    status,
    category,
    branch_id,
    search,
    date_from,
    date_to,
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  const queryParams = new URLSearchParams();
  
  if (status) queryParams.append("status", status);
  if (category) queryParams.append("category", category);
  if (branch_id) queryParams.append("branch_id", branch_id);
  if (search) queryParams.append("search", search);
  if (date_from) queryParams.append("date_from", date_from);
  if (date_to) queryParams.append("date_to", date_to);
  queryParams.append("page", page);
  queryParams.append("limit", limit);
  queryParams.append("sort_by", sort_by);
  queryParams.append("sort_order", sort_order);

  return apiClient.get(`/tickets?${queryParams.toString()}`);
};

/**
 * ============================================
 * GET TICKET STATISTICS
 * ============================================
 */
export const getTicketStats = async () => {
  return apiClient.get("/tickets/stats");
};

/**
 * ============================================
 * GET SINGLE TICKET BY ID
 * ============================================
 */
export const getTicketById = async (ticket_id) => {
  return apiClient.get(`/tickets/${ticket_id}`);
};

/**
 * ============================================
 * CREATE NEW TICKET
 * ============================================
 */
export const createTicket = async (ticketData) => {
  return apiClient.post("/tickets", ticketData);
};

/**
 * ============================================
 * CANCEL TICKET
 * ============================================
 */
export const cancelTicket = async (ticket_id, reason) => {
  return apiClient.post(`/tickets/${ticket_id}/cancel`, { reason });
};

/**
 * ============================================
 * REOPEN TICKET
 * ============================================
 */
export const reopenTicket = async (ticket_id, reason) => {
  return apiClient.post(`/tickets/${ticket_id}/reopen`, { reason });
};

/**
 * ============================================
 * UPLOAD TICKET ATTACHMENT (Phase 3)
 * ============================================
 */
export const uploadTicketAttachment = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post("/tickets/attachments/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * ============================================
 * DELETE TICKET ATTACHMENT (Phase 3)
 * ============================================
 */
export const deleteTicketAttachment = async (attachment_id) => {
  return apiClient.delete(`/tickets/attachments/${attachment_id}`);
};
