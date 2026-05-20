// app/(tabs)/home.tsx
// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB — Placeholder
//
// This screen tests two navigation flows:
//   1. Tab → Stack: navigating to /search (covers tab bar)
//   2. Tab → Stack: navigating to /product/123 (covers tab bar)
//
// router.push() — the primary navigation method in Expo Router.
// Equivalent to useNavigate()('/search') in React Router.
// Pushes a new screen onto the Root Stack.
// ─────────────────────────────────────────────────────────────────────────────

import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>

        <Text style={styles.screenLabel}>SCREEN</Text>
        <Text style={styles.screenName}>Home</Text>
        <Text style={styles.routeHint}>Route: /home → (tabs)/home.tsx</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Test Navigation →</Text>

        {/* Push Search on top of Root Stack (covers tab bar) */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.buttonText}>Go to Search Screen</Text>
        </TouchableOpacity>

        {/* Push Product Detail with a dynamic ID param */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/product/MED-001')}
        >
          <Text style={styles.buttonText}>Go to Product (MED-001)</Text>
        </TouchableOpacity>

        {/* Cart — globally accessible from root stack */}
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.buttonTextSecondary}>Go to Cart</Text>
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
  routeHint: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#05015A',
    fontSize: 14,
    fontWeight: '600',
  },
});