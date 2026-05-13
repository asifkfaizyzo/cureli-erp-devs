// app/(tabs)/profile.tsx
// ─────────────────────────────────────────────────────────────────────────────
// PROFILE TAB — Placeholder stub. No navigation needed yet.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.screenLabel}>SCREEN</Text>
        <Text style={styles.screenName}>Profile</Text>
        <Text style={styles.routeHint}>Route: /profile → (tabs)/profile.tsx</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  screenLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#94a3b8',
  },
  screenName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#05015A',
  },
  routeHint: { fontSize: 12, color: '#94a3b8' },
});