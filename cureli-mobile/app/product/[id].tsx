// app/product/[id].tsx
// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT DETAIL — Root Stack Screen with Dynamic Route Param
//
// [id] is a dynamic segment — works exactly like React Router's :id.
// The filename [id].tsx tells Expo Router this route accepts any value
// in that position.
//
// URLs that match this file:
//   /product/MED-001
//   /product/CAT-VITAMINS
//   /product/SEARCH-RESULT-001
//   /product/anything
//
// How to read the param:
//   useLocalSearchParams() → { id: 'MED-001' }
//   Web equivalent: useParams() in React Router
//
// router.back() — pops this screen.
//   If navigated from Home tab → goes back to Home tab
//   If navigated from Search → goes back to Search
//   If navigated from Categories → goes back to Categories
//   The stack remembers the full history.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailScreen() {
  //
  // useLocalSearchParams() reads the dynamic [id] segment from the URL.
  // When you called router.push('/product/MED-001'), Expo Router parsed
  // 'MED-001' out and made it available as params.id.
  //
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#05015A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.screenLabel}>ROOT STACK SCREEN</Text>
        <Text style={styles.screenName}>Product</Text>
        <Text style={styles.routeHint}>
          Route: /product/[id] → app/product/[id].tsx
        </Text>

        {/* Show the dynamic param — proves routing is working */}
        <View style={styles.paramCard}>
          <Text style={styles.paramLabel}>Dynamic Param Received:</Text>
          <Text style={styles.paramValue}>id = "{id}"</Text>
        </View>

        <Text style={styles.note}>
          This param was passed via router.push('/product/{id}'){'\n'}
          Read with useLocalSearchParams()
        </Text>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonTextSecondary}>← Go Back</Text>
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
  paramCard: {
    width: '100%',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    gap: 4,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
  },
  paramValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#05015A',
    fontFamily: 'monospace',
  },
  note: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
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