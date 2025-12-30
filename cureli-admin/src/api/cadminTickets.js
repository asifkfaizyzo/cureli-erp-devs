// cureli-admin/src/api/cadminTickets.js

import apiClient from "./axios";

/**
 * Get all tickets (Super Admin view)
 */
export const getAllTickets = (params = {}) => {
  return apiClient.get("/tickets", { params }); // ✅ Removed /cadmin prefix
};

/**
 * Get ticket by ID
 */
export const getTicketById = (ticketId) => {
  return apiClient.get(`/tickets/${ticketId}`); // ✅ Removed /cadmin prefix
};

/**
 * Update ticket status
 */
export const updateTicketStatus = (ticketId, data) => {
  return apiClient.patch(`/tickets/${ticketId}/status`, data); // ✅ Removed /cadmin prefix
};

/**
 * Add admin note to ticket
 */
export const addTicketNote = (ticketId, data) => {
  return apiClient.post(`/tickets/${ticketId}/notes`, data); // ✅ Removed /cadmin prefix
};

/**
 * Get ticket statistics
 */
export const getTicketStats = () => {
  return apiClient.get("/tickets/stats"); // ✅ Removed /cadmin prefix
};
