// app/+not-found.tsx
//
// Catches any unmatched route including curelimobile:///
// which Expo Router fires on cold start before index.tsx
// has had a chance to navigate. Reads auth state and
// redirects to the correct screen exactly like splash does.

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { StorageService } from '../src/services/storage';

export default function NotFound() {
  const { status } = useAuthStore();

  useEffect(() => {
    // Auth state still being determined — wait
    if (status === 'unknown' || status === 'checking') return;

    const introSeen = StorageService.isIntroSeen();

    if (!introSeen) {
      router.replace('/intro');
      return;
    }

    if (status !== 'authenticated') {
      router.replace('/(auth)/login');
      return;
    }

    const user = useAuthStore.getState().user;

    if (!user?.full_name || !user?.date_of_birth || !user?.sex) {
      router.replace('/onboarding/profile' as any);
      return;
    }

    router.replace('/(tabs)/home');
  }, [status]);

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