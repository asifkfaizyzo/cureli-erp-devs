// app/(auth)/otp.tsx — stub only
import { View, Text, StyleSheet } from 'react-native';
export default function OtpScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>OTP</Text>
      <Text style={styles.s}>Stub — auth not wired yet</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  t: { fontSize: 32, fontWeight: '800', color: '#05015A' },
  s: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
});