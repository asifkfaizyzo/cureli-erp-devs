// app/checkout/index.tsx
//
// Entry point for /checkout — renders CheckoutScreen.
// Replaces the old app/checkout.tsx.

import { CheckoutScreen } from "../../src/features/cart/screens/CheckoutScreen";

export default function CheckoutRoute() {
  return <CheckoutScreen />;
}