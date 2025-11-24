import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token automatically to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Business Info → update shop basic info
export const updateShopInfo = (data) =>
  API.patch("/shop/setup/info", data);

// GST & Business Type update
export const updateShopGst = (data) =>
  API.patch("/shop/setup/gst", data);
