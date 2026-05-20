// app/(tabs)/categories.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES TAB — Placeholder
// Tests: navigating to a product from a non-home tab.
// Proves the stack works from ANY tab, not just Home.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.screenLabel}>SCREEN</Text>
        <Text style={styles.screenName}>Categories</Text>
        <Text style={styles.routeHint}>
          Route: /categories → (tabs)/categories.tsx
        </Text>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Test Navigation →</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/product/CAT-VITAMINS')}
        >
          <Text style={styles.buttonText}>Go to Product (CAT-VITAMINS)</Text>
        </TouchableOpacity>
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
    padding: 24,
    gap: 12,
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
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#05015A',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});