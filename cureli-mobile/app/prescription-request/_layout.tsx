// app/prescription-request/_layout.tsx

import { Stack } from 'expo-router';

export default function PrescriptionRequestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pharmacies" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}