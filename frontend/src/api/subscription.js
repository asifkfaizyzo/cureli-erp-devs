import API from "./axios";

// Get all active plans for selection
export const getPlans = () => API.get("/plans");

// Get single plan by ID
export const getPlanById = (planId) => API.get(`/plans/${planId}`);

// Get user details for Razorpay prefill
export const getUserDetails = () => API.get("/subscriptions/user-details");

// Select a plan (creates Razorpay order for paid, activates for free)
export const selectPlan = (data) => API.post("/subscriptions/select", data);

// Confirm payment after Razorpay checkout
export const confirmPayment = (data) => API.post("/subscriptions/confirm", data);

// Get current subscription
export const getMySubscription = () => API.get("/subscriptions/my");

// Get subscription status
export const getSubscriptionStatus = () => API.get("/subscriptions/status");

// Get subscription history
export const getSubscriptionHistory = () => API.get("/subscriptions/history");