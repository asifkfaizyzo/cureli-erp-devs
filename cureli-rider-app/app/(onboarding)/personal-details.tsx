import { View, Text, StyleSheet } from 'react-native';

export default function PersonalDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Personal Details — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  text:      { color: '#fff', fontSize: 16 },
});