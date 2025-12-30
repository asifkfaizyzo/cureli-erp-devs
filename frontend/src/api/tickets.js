// frontend/src/api/tickets.js

import api from "./axios";

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

  return api.get(`/tickets?${queryParams.toString()}`);
};

/**
 * ============================================
 * GET TICKET STATISTICS
 * ============================================
 */
export const getTicketStats = async () => {
  return api.get("/tickets/stats");
};

/**
 * ============================================
 * GET SINGLE TICKET BY ID
 * ============================================
 */
export const getTicketById = async (ticket_id) => {
  return api.get(`/tickets/${ticket_id}`);
};

/**
 * ============================================
 * CREATE NEW TICKET (with file attachments)
 * ============================================
 */
export const createTicket = async (ticketData) => {
  // ✅ Check if there are file attachments
  const hasFiles = ticketData.attachments && ticketData.attachments.length > 0;

  if (hasFiles) {
    // ✅ Create FormData for multipart/form-data
    const formData = new FormData();
    
    // Add text fields
    if (ticketData.branch_id) {
      formData.append("branch_id", ticketData.branch_id);
    }
    formData.append("category", ticketData.category);
    
    if (ticketData.other_category_text) {
      formData.append("other_category_text", ticketData.other_category_text);
    }
    
    formData.append("subject", ticketData.subject);
    formData.append("description", ticketData.description);
    formData.append("contact_number", ticketData.contact_number);
    formData.append("preferred_slot", ticketData.preferred_slot);
    
    // ✅ Add files with field name "attachments"
    ticketData.attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    // Send as multipart/form-data
    return api.post("/tickets", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } else {
    // ✅ No files - send as JSON
    return api.post("/tickets", ticketData);
  }
};

/**
 * ============================================
 * CANCEL TICKET
 * ============================================
 */
export const cancelTicket = async (ticket_id, reason) => {
  return api.post(`/tickets/${ticket_id}/cancel`, { reason });
};


export const reopenTicket = (ticket_id, data) =>
  api.post(`/tickets/${ticket_id}/reopen`, data);



// // frontend/src/api/tickets.js

// import api from "./axios";

// /**
//  * ============================================
//  * GET TICKETS (with filters & pagination)
//  * ============================================
//  */
// export const getTickets = async (params = {}) => {
//   const {
//     status,
//     category,
//     branch_id,
//     search,
//     date_from,
//     date_to,
//     page = 1,
//     limit = 20,
//     sort_by = "created_at",
//     sort_order = "desc",
//   } = params;

//   const queryParams = new URLSearchParams();
  
//   if (status) queryParams.append("status", status);
//   if (category) queryParams.append("category", category);
//   if (branch_id) queryParams.append("branch_id", branch_id);
//   if (search) queryParams.append("search", search);
//   if (date_from) queryParams.append("date_from", date_from);
//   if (date_to) queryParams.append("date_to", date_to);
//   queryParams.append("page", page);
//   queryParams.append("limit", limit);
//   queryParams.append("sort_by", sort_by);
//   queryParams.append("sort_order", sort_order);

//   return api.get(`/tickets?${queryParams.toString()}`);
// };

// /**
//  * ============================================
//  * GET TICKET STATISTICS
//  * ============================================
//  */
// export const getTicketStats = async () => {
//   return api.get("/tickets/stats");
// };

// /**
//  * ============================================
//  * GET SINGLE TICKET BY ID
//  * ============================================
//  */
// export const getTicketById = async (ticket_id) => {
//   return api.get(`/tickets/${ticket_id}`);
// };

// /**
//  * ============================================
//  * CREATE NEW TICKET
//  * ============================================
//  */
// export const createTicket = async (ticketData) => {
//   return api.post("/tickets", ticketData);
// };

// /**
//  * ============================================
//  * CANCEL TICKET
//  * ============================================
//  */
// export const cancelTicket = async (ticket_id, reason) => {
//   return api.post(`/tickets/${ticket_id}/cancel`, { reason });
// };

// /**
//  * ============================================
//  * REOPEN TICKET
//  * ============================================
//  */
// export const reopenTicket = async (ticket_id, reason) => {
//   return api.post(`/tickets/${ticket_id}/reopen`, { reason });
// };

// /**
//  * ============================================
//  * UPLOAD TICKET ATTACHMENT (Phase 3)
//  * ============================================
//  */
// export const uploadTicketAttachment = async (file) => {
//   const formData = new FormData();
//   formData.append("file", file);

//   return api.post("/tickets/attachments/upload", formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },
//   });
// };

// /**
//  * ============================================
//  * DELETE TICKET ATTACHMENT (Phase 3)
//  * ============================================
//  */
// export const deleteTicketAttachment = async (attachment_id) => {
//   return api.delete(`/tickets/attachments/${attachment_id}`);
// };
