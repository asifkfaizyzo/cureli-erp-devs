import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", 
});

// SEND EMAIL OTP
export const sendSignupOtp = ({ pending_id }) =>
  API.post("/pending/signup/email-otp", { pending_id });

// VERIFY EMAIL OTP
export const verifySignupOtp = ({ pending_id, otp }) =>
  API.post("/pending/signup/verify-email", { pending_id, otp });
