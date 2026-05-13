import API from "./axios";

export const uploadShopFile = (formData) =>
  API.post("/shop/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
