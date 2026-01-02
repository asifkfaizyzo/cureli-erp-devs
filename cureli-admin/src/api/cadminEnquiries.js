// frontend/src/api/cadminEnquiries.js
import CAdminAPI from "./axios";

// Get all enquiries with filters and pagination
export const getEnquiries = async (params) => {
  const response = await CAdminAPI.get("/enquiries/admin/list", { params });
  console.log("API getEnquiries response:", response);
  return response;
};

// Get enquiry statistics
export const getEnquiryStats = async () => {
  const response = await CAdminAPI.get("/enquiries/admin/stats");
  console.log("API getEnquiryStats response:", response);
  return response;
};

// Get single enquiry details by ID
export const getEnquiryDetails = async (enquiryId) => {
  const response = await CAdminAPI.get(`/enquiries/admin/${enquiryId}`);
  console.log("API getEnquiryDetails response:", response);
  return response;
};

// Reply to an enquiry
export const replyToEnquiry = async (enquiryId, data) => {
  const response = await CAdminAPI.post(`/enquiries/admin/${enquiryId}/reply`, data);
  return response;
};

// Update enquiry status
export const updateEnquiryStatus = async (enquiryId, status) => {
  const response = await CAdminAPI.patch(`/enquiries/admin/${enquiryId}/status`, { status });
  return response;
};

// Delete an enquiry
export const deleteEnquiry = async (enquiryId) => {
  const response = await CAdminAPI.delete(`/enquiries/admin/${enquiryId}`);
  return response;
};