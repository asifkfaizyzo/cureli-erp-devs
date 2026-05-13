// app/intro.tsx — stub only
import { View, Text, StyleSheet } from 'react-native';
export default function IntroScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Intro</Text>
      <Text style={styles.s}>Stub — not wired into nav flow yet</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0280' },
  t: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  s: { fontSize: 12, color: '#ffffff80', marginTop: 8 },
});