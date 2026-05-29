// src/features/payment/screens/PaymentSettingsScreen.tsx

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";

import { PaymentSectionCard } from "../components/PaymentSectionCard";
import { PAYMENT_SECTIONS } from "../constants/payment.constants";

export function PaymentSettingsScreen() {
  const { colors } = useTheme();

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: "#EEF5FC" }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Payment settings
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PAYMENT_SECTIONS.map((section) => (
          <PaymentSectionCard key={section.title} section={section} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});