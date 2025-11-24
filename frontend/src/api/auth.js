import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // 🔥 ADD THIS LINE
});

//INITIALISE START UP
export const signupUser = (data) =>
  API.post("/pending/signup/start", data);

//LOGIN USER
export const loginUser = (data) =>
  API.post("/auth/login", data);

export const verifyLoginOtp = (data) =>
  API.post("/auth/verify-login-otp", data);

//USERNAME CREATION
export const saveUsername = (data) =>
  API.post("/pending/signup/username", data);

//USER TABLE IMPLEMENT
export const completeSignup = (data) =>
  API.post("/pending/signup/complete", data);


// FORGOT PASSWORD
export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);

export const resetPassword = (data) =>
  API.post("/auth/reset-password", data);