// src/features/payment/screens/AddUPIScreen.tsx
//
// Add UPI ID form. Non-functional — selects and goes back.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { usePaymentStore } from "../../../store/paymentStore";

export function AddUPIScreen() {
  const { colors } = useTheme();
  const setSelectedMethod = usePaymentStore((s) => s.setSelectedMethod);

  const [upiId, setUpiId] = useState("");

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleVerify = useCallback(() => {
    const trimmed = upiId.trim();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. name@upi).");
      return;
    }

    setSelectedMethod({
      id: `upi-${trimmed}`,
      label: trimmed,
      type: "upi",
      icon: "qr-code-outline",
    });

    router.back();
    setTimeout(() => router.back(), 100);
  }, [upiId, setSelectedMethod]);

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
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Add UPI ID
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Info card */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.background.card }]}
        >
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons
              name="qr-code-outline"
              size={32}
              color={colors.text.brand}
            />
          </View>

          <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
            Pay using any UPI app
          </Text>
          <Text style={[styles.infoSub, { color: colors.text.muted }]}>
            Enter your UPI ID to make payments directly from your bank account
          </Text>
        </View>

        {/* Input */}
        <View
          style={[styles.formCard, { backgroundColor: colors.background.card }]}
        >
          <Text style={[styles.label, { color: colors.text.muted }]}>
            UPI ID
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                borderColor: colors.border.input,
                backgroundColor: colors.background.input,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="yourname@upi"
              placeholderTextColor={colors.text.faint}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.hintRow}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.text.faint}
            />
            <Text style={[styles.hintText, { color: colors.text.faint }]}>
              e.g. name@okicici, name@ybl, name@paytm
            </Text>
          </View>
        </View>

        {/* Verify button */}
        <TouchableOpacity
          onPress={handleVerify}
          activeOpacity={0.85}
          style={styles.verifyBtn}
        >
          <Text style={styles.verifyBtnText}>Verify & Add</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
  headerSpacer: { width: 36 },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  infoSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    gap: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  verifyBtn: {
    height: 50,
    backgroundColor: "#05015A",
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});