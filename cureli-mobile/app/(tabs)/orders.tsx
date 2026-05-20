// app/(tabs)/orders.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ORDERS TAB — Placeholder
// No navigation buttons needed yet. Pure stub.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.screenLabel}>SCREEN</Text>
        <Text style={styles.screenName}>Orders</Text>
        <Text style={styles.routeHint}>Route: /orders → (tabs)/orders.tsx</Text>
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
  routeHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
});