import API from "./axios";

// export const submitEnquiry = async (data) => {
//     console.log(data);
//   const response = await axios.post(`${API_URL}/enquiries`, data);
//   return response.data;
// };

export const submitEnquiry = (data) => API.post("/enquiries", data);