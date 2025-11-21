import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const signupUser = (data) =>
  API.post("/pending/signup/start", data);

export const requestEmailOtp = (pending_id) =>
  API.post("/pending/signup/email-otp", { pending_id });

export const verifyEmailOtp = (pending_id, otp) =>
  API.post("/pending/signup/verify-email", { pending_id, otp });
