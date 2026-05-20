// app/checkout.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#05015A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.container}>
        <Text style={styles.screenLabel}>ROOT STACK SCREEN</Text>
        <Text style={styles.screenName}>Checkout</Text>
        <Text style={styles.routeHint}>Route: /checkout → app/checkout.tsx</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#05015A' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  screenLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#94a3b8' },
  screenName: { fontSize: 32, fontWeight: '800', color: '#05015A' },
  routeHint: { fontSize: 12, color: '#94a3b8' },
  button: {
    width: '100%', paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: '#05015A', borderRadius: 12, alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});