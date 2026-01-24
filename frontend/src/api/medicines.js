// src/api/medicines.js
import api from "./axios";

const medicinesAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get("/medicines", { params: filters });
    return response.data;
  },

  search: async (searchTerm, filters = {}) => {
    const response = await api.get("/medicines", {
      params: { search: searchTerm, limit: 50, ...filters },
    });
    return response.data;
  },

  getById: async (medicineId) => {
    const response = await api.get(`/medicines/${medicineId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/medicines", data);
    return response.data;
  },

  bulkCreate: async (medicines) => {
    const response = await api.post("/medicines/bulk", { medicines });
    return response.data;
  },

  update: async (medicineId, data) => {
    const response = await api.put(`/medicines/${medicineId}`, data);
    return response.data;
  },
};

export default medicinesAPI;