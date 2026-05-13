//pharmacy-web\src\api\enquiries.js
import API from "./axios";

export const submitEnquiry = (data) => API.post("/enquiries", data);
