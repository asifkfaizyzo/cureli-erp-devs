import API from "./axios";

// START SIGNUP
export const signupUser = (data) =>
  API.post("/pending/signup/start", data);

// LOGIN
export const loginUser = (data) =>
  API.post("/auth/login", data);

export const verifyLoginOtp = (data) =>
  API.post("/auth/verify-login-otp", data);

// USERNAME SELECTION
export const saveUsername = (data) =>
  API.post("/pending/signup/username", data);

// Check username availability
export const checkUsernameAvailability = (username) =>
  API.post("/pending/signup/check-username", { username });

// FINALIZE SUPERADMIN SIGNUP
export const completeSignup = (data) =>
  API.post("/pending/signup/complete", data);

// FORGOT PASSWORD
export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);

export const resetPassword = (data) =>
  API.post("/auth/reset-password", data);

export const googleSignup = (data) =>
  API.post("/pending/signup/google", data);

export const googleSetPassword = (data) =>
  API.post("/pending/signup/google/set-password", data);

export const completeOnboarding = () =>
  API.post("/auth/complete-onboarding");

// Update onboarding step progress
export const updateOnboardingStep = (step) =>
  API.post("/auth/onboarding-step", { step });

// Get current user's onboarding status (for page refresh)
export const getOnboardingStatus = () =>
  API.get("/auth/onboarding-status");