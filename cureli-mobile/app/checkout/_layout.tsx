// app/checkout/_layout.tsx
//
// Stack navigator for all checkout sub-screens.
// Every screen manages its own header — native headers all hidden.

import { Stack } from "expo-router";

export default function CheckoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="add-card" />
      <Stack.Screen name="add-upi" />
      <Stack.Screen name="netbanking" />
    </Stack>
  );
}