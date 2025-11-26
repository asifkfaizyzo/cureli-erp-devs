import API from "./axios";

// Update basic business info
export const updateShopInfo = (data) =>
  API.patch("/shop/setup/info", data);

// Update GST details
export const updateShopGst = (data) =>
  API.patch("/shop/setup/gst", data);
