// app/_layout.tsx

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { authEventEmitter } from '../src/services/api';

export default function RootLayout() {
  const { initialize, logout } = useAuthStore();

  // Initialize auth state once on app open
  useEffect(() => {
    initialize();
  }, []);

  // Listen for forced logout events from the API interceptor
  useEffect(() => {
    const unsubscribe = authEventEmitter.on('logout', () => {
      logout();
      router.replace('/(auth)/login');
    });
    return unsubscribe;
  }, [logout]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/otp" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="intro" options={{ headerShown: false }} />
    </Stack>
  );
}