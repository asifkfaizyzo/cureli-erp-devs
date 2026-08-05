//cureli-rider-app\app\(app)\home.tsx
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/theme/ThemeContext";

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.page }]}>
      <View style={styles.container}>
        <Text style={[styles.text, { color: colors.text.primary }]}>
          HomeScreen
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "600",
  },
});