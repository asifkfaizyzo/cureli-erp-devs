import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach Authorization header automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const uploadShopFile = (formData) =>
  API.post("/shop/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
