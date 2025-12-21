import { z } from "zod";

// Schema for selecting a plan (creates order for paid, activates for free)
export const selectPlanSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
});

// Schema for confirming payment after Razorpay checkout
export const confirmPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  subscription_id: z.string().uuid("Invalid subscription ID"),
});