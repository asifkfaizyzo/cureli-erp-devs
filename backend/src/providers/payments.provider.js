// Future Razorpay/Stripe integration goes here.
export function createPaymentOrder() {
  return { requires_payment: false };
}

export function verifyPaymentSignature() {
  return { verified: true };
}
