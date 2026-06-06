// app/checkout/_layout.tsx

import { Stack } from 'expo-router';

export default function CheckoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="payment" />
      <Stack.Screen name="add-card" />
      <Stack.Screen name="add-upi" />
      <Stack.Screen name="netbanking" />
    </Stack>
  );
}