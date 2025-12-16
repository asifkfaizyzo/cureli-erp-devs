// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\frontend\src\api\subscription.js

import API from "./axios";

// Get all active plans for selection
export const getPlans = () => API.get("/plans");

// Get single plan by ID
export const getPlanById = (planId) => API.get(`/plans/${planId}`);

// Select a plan (future: triggers payment flow)
export const selectPlan = (data) => API.post("/subscriptions/select", data);

// Confirm payment after Razorpay (future)
export const confirmPayment = (data) => API.post("/subscriptions/confirm", data);

export const getMySubscription = () =>
  API.get("/subscriptions/my");
