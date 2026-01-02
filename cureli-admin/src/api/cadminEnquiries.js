// frontend/src/api/cadminEnquiries.js
import API from "./axios";

// Get all enquiries with filters
export const getEnquiries = (params) => 
  API.get("/enquiries/admin/list", { params });

// Get enquiry statistics
export const getEnquiryStats = () => 
  API.get("/enquiries/admin/stats");

// Get single enquiry details
export const getEnquiryDetails = (enquiryId) => 
  API.get(`/enquiries/admin/${enquiryId}`);

// Reply to an enquiry
export const replyToEnquiry = (enquiryId, data) => 
  API.post(`/enquiries/admin/${enquiryId}/reply`, data);

// Update enquiry status
export const updateEnquiryStatus = (enquiryId, status) => 
  API.patch(`/enquiries/admin/${enquiryId}/status`, { status });

// Delete an enquiry
export const deleteEnquiry = (enquiryId) => 
  API.delete(`/enquiries/admin/${enquiryId}`);


// import api from "./axios";

// // Get all enquiries with pagination and filters
// export const getEnquiries = async (params = {}) => {
//   const response = await api.get("/enquiries/admin/list", { params });
//   return response.data;
// };

// // Get enquiry statistics
// export const getEnquiryStats = async () => {
//   const response = await api.get("/enquiries/admin/stats");
//   return response.data;
// };

// // Get single enquiry details
// export const getEnquiryDetails = async (enquiryId) => {
//   const response = await api.get(`/enquiries/admin/${enquiryId}`);
//   return response.data;
// };

// // Reply to enquiry
// export const replyToEnquiry = async (enquiryId, data) => {
//   const response = await api.post(`/enquiries/admin/${enquiryId}/reply`, data);
//   return response.data;
// };

// // Update enquiry status
// export const updateEnquiryStatus = async (enquiryId, status) => {
//   const response = await api.patch(`/enquiries/admin/${enquiryId}/status`, { status });
//   return response.data;
// };

// // Delete enquiry
// export const deleteEnquiry = async (enquiryId) => {
//   const response = await api.delete(`/enquiries/admin/${enquiryId}`);
//   return response.data;
// };