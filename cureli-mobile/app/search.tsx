// app/search.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SEARCH SCREEN — Root Stack Screen (NOT a tab)
//
// Why this lives outside (tabs)/:
//   If this were inside (tabs)/, it would appear as a permanent tab button.
//   Instead, it's a Root Stack screen that gets PUSHED on top of the tab
//   navigator when the FAB is tapped. The tab bar is fully hidden while
//   this screen is active.
//
// Back navigation:
//   router.back() pops this screen off the Root Stack.
//   The tab navigator resurfaces showing whatever tab was last active.
//   The OS back button (Android) / swipe-back (iOS) do this automatically.
//   We add an explicit back button too for clarity.
//
// useLocalSearchParams() — if we needed URL params here, this is the hook.
// For search, we don't need params on entry — the query is local state.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header row with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#05015A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        {/* Spacer to center the title */}
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.screenLabel}>ROOT STACK SCREEN</Text>
        <Text style={styles.screenName}>Search</Text>
        <Text style={styles.routeHint}>Route: /search → app/search.tsx</Text>
        <Text style={styles.note}>
          Tab bar is hidden ↑{'\n'}
          This screen covers the tab navigator
        </Text>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Test Navigation →</Text>

        {/* Navigate deeper into the stack from search */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/product/SEARCH-RESULT-001')}
        >
          <Text style={styles.buttonText}>Go to Product from Search</Text>
        </TouchableOpacity>

        {/* Explicit back button — also works via swipe or Android back */}
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonTextSecondary}>← Back to Previous Tab</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#05015A',
  },
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
  note: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
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
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#05015A',
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  buttonTextSecondary: { color: '#05015A', fontSize: 14, fontWeight: '600' },
});