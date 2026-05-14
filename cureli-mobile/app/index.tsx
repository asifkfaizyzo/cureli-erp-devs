// app/index.tsx
//
// Root index route — immediately redirects based on auth status.
// This file exists solely to give Expo Router a valid screen at "/"
// so it does not show "unmatched route" while the auth check runs.

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { status } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    if (status === 'unknown' || status === 'checking') return;

    if (status === 'unauthenticated') {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated') {
      router.replace('/(tabs)/home');
    }
  }, [status, navigationState?.key]);

  // Always show spinner — this screen should never be visible for more
  // than a fraction of a second before redirecting
  return (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
    }}>
      <ActivityIndicator size="large" color="#05015A" />
    </View>
  );
}