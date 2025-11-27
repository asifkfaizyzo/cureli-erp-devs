import API from "./axios";

// Fetch my active subscription
export const getMySubscription = () =>
  API.get("/subscriptions/my");

// Get all visible plans
export const getPlans = () =>
  API.get("/plans");

// Select free or paid plan
export const selectPlan = (data) =>
  API.post("/subscriptions/select", data);

// Future payment confirmation
export const confirmPayment = (data) =>
  API.post("/subscriptions/confirm", data);
