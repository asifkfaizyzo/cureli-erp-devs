// app/splash.tsx — stub only, not wired into flow
import { View, Text, StyleSheet } from 'react-native';
export default function SplashScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Splash</Text>
      <Text style={styles.s}>Stub — not wired into nav flow yet</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#05015A' },
  t: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  s: { fontSize: 12, color: '#ffffff80', marginTop: 8 },
});