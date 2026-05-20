// app/index.tsx
//
// Root route — decides where to send the user on app open.
//
// Routing priority:
//   1. Fonts/auth still loading     → show spinner
//   2. Authenticated                → animated splash → home
//   3. Not authenticated            → animated splash → login or intro
//
// The splash screen handles the intro/login decision itself
// based on StorageService.isIntroSeen().

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { status } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    if (status === 'unknown' || status === 'checking') return;

    // Always go through the animated splash first.
    // Splash reads auth status from the store and routes accordingly.
    router.replace('/splash');
  }, [status, navigationState?.key]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#05015A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05015A',
  },
});