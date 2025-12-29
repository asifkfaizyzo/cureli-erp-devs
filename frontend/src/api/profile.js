// src/api/profile.js

import API from "./axios";

// ============================================
// GET PROFILE
// ============================================
export const getProfile = () => API.get("/profile");

// ============================================
// BUSINESS INFO
// ============================================
export const updateBusiness = (data) => API.put("/profile/business", data);

// ============================================
// PASSWORD
// ============================================
export const changePassword = (data) => API.post("/profile/password", data);

// ============================================
// EMAIL CHANGE
// ============================================
export const initiateEmailChange = (data) => API.post("/profile/email/initiate", data);
export const verifyEmailChange = (data) => API.post("/profile/email/verify", data);

// ============================================
// PHONE CHANGE
// ============================================
export const initiatePhoneVerifyOld = () => API.post("/profile/phone/verify-old");
export const initiatePhoneNew = (data) => API.post("/profile/phone/initiate-new", data);
export const verifyPhoneNew = (data) => API.post("/profile/phone/verify-new", data);

// ============================================
// SESSIONS
// ============================================
export const getSessions = () => API.get("/profile/sessions");
export const logoutSession = (sessionId) => API.delete(`/profile/sessions/${sessionId}`);
export const logoutOtherSessions = () => API.delete("/profile/sessions/others");