import CAdminAPI from "./axios";

// LOGIN → sends OTP
export function loginCAdmin(data) {
  return CAdminAPI.post("/login", data);
}

// VERIFY OTP → returns access token
export function verifyOtpCAdmin(data) {
  return CAdminAPI.post("/verify-otp", data);
}

// FORGOT PASSWORD
export function forgotPasswordCAdmin(data) {
  return CAdminAPI.post("/forgot-password", data);
}

// RESET PASSWORD
export function resetPasswordCAdmin(data) {
  return CAdminAPI.post("/reset-password", data);
}
