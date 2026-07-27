// app/index.tsx

import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { status } = useAuthStore();
  const navigationState = useRootNavigationState();
  
  // Track whether we have ever been authenticated this session.
  // If we were authenticated and then become unauthenticated,
  // that means the user logged out — skip the splash animation
  // and go straight to login.
  const wasAuthenticated = useRef(false);
  const hasNavigated = useRef(false); // ← prevent double navigation on cold start

  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true;
    }
  }, [status]);

  useEffect(() => {
    // Router not ready yet — wait
    if (!navigationState?.key) return;
    // Auth state still being determined — wait
    if (status === 'unknown' || status === 'checking') return;
    // Already navigated this session — prevent collision with Expo Router
    // initial route resolution on cold start
    if (hasNavigated.current) return;

    hasNavigated.current = true; // ← mark immediately before the timer

    // Small delay to let Expo Router fully settle its initial route
    // before we push the first navigation. Without this, curelimobile:///
    // can collide with router.replace() on cold start and produce
    // "Unmatched Route" even though the route exists.
    const timer = setTimeout(() => {
      if (status === 'unauthenticated' && wasAuthenticated.current) {
        // User just logged out mid-session — go directly to login,
        // no splash animation needed
        router.replace('/(auth)/login');
      } else {
        // Fresh app open — go through animated splash
        // Splash handles the intro/login/home decision
        router.replace('/splash');
      }
    }, 50);

    return () => clearTimeout(timer);

  }, [status, navigationState?.key]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" />
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