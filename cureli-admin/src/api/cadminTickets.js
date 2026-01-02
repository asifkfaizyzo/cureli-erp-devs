// cureli-admin/src/api/cadminTickets.js

import CAdminAPI from "./axios";

/**
 * Get all tickets with filters and pagination
 */
export const getAllTickets = (params = {}) => {
  return CAdminAPI.get("/tickets", { params });
};

/**
 * Get ticket by ID
 */
export const getTicketById = (ticketId) => {
  return CAdminAPI.get(`/tickets/${ticketId}`);
};

/**
 * Update ticket status
 */
export const updateTicketStatus = (ticketId, data) => {
  return CAdminAPI.patch(`/tickets/${ticketId}/status`, data);
};

/**
 * Get ticket statistics
 */
export const getTicketStats = () => {
  return CAdminAPI.get("/tickets/stats");
};