import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Currency from env
export const RAZORPAY_CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature from pharmacy-web
 * @returns {boolean} - Whether signature is valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = orderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
