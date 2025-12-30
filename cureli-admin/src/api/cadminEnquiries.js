import api from "./axios";

// Get all enquiries with pagination and filters
export const getEnquiries = async (params = {}) => {
  const response = await api.get("/enquiries/admin/list", { params });
  return response.data;
};

// Get enquiry statistics
export const getEnquiryStats = async () => {
  const response = await api.get("/enquiries/admin/stats");
  return response.data;
};

// Get single enquiry details
export const getEnquiryDetails = async (enquiryId) => {
  const response = await api.get(`/enquiries/admin/${enquiryId}`);
  return response.data;
};

// Reply to enquiry
export const replyToEnquiry = async (enquiryId, data) => {
  const response = await api.post(`/enquiries/admin/${enquiryId}/reply`, data);
  return response.data;
};

// Update enquiry status
export const updateEnquiryStatus = async (enquiryId, status) => {
  const response = await api.patch(`/enquiries/admin/${enquiryId}/status`, { status });
  return response.data;
};

// Delete enquiry
export const deleteEnquiry = async (enquiryId) => {
  const response = await api.delete(`/enquiries/admin/${enquiryId}`);
  return response.data;
};