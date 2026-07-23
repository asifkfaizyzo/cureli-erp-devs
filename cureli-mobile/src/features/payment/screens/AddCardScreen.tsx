// src/features/payment/screens/AddCardScreen.tsx
//
// Add credit/debit card form.
// Fields: Card number, Name on card, Expiry, CVV.
// Non-functional — just UI. "Add Card" selects it and goes back.

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDialog } from "../../../components/Dialog/DialogProvider";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { usePaymentStore } from "../../../store/paymentStore";

export function AddCardScreen() {
  const { colors } = useTheme();
  const { alert: showAlert } = useDialog();
  const setSelectedMethod = usePaymentStore((s) => s.setSelectedMethod);

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleAddCard = useCallback(async () => {
    if (
      !cardNumber.trim() ||
      !cardName.trim() ||
      !expiry.trim() ||
      !cvv.trim()
    ) {
      await showAlert({
        title: "Missing Details",
        message: "Please fill in all card details.",
        confirmLabel: "OK",
      });
      return;
    }

    const last4 = cardNumber.replace(/\s/g, "").slice(-4);

    setSelectedMethod({
      id: `card-${last4}`,
      label: `Card ending ${last4}`,
      type: "card",
      icon: "card-outline",
    });

    router.back();
    setTimeout(() => router.back(), 100);
  }, [cardNumber, cardName, expiry, cvv, setSelectedMethod, showAlert]);

  // Format card number with spaces
  const handleCardNumberChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  }, []);

  // Format expiry as MM/YY
  const handleExpiryChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length > 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
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
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Add Card
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card preview */}
        <View style={styles.cardPreview}>
          <View style={styles.cardPreviewTop}>
            <Ionicons name="card" size={28} color="rgba(255,255,255,0.8)" />
            <Text style={styles.cardPreviewType}>Credit / Debit</Text>
          </View>
          <Text style={styles.cardPreviewNumber}>
            {cardNumber || "•••• •••• •••• ••••"}
          </Text>
          <View style={styles.cardPreviewBottom}>
            <Text style={styles.cardPreviewName}>
              {cardName.toUpperCase() || "YOUR NAME"}
            </Text>
            <Text style={styles.cardPreviewExpiry}>{expiry || "MM/YY"}</Text>
          </View>
        </View>

        {/* Form */}
        <View
          style={[styles.formCard, { backgroundColor: colors.background.card }]}
        >
          {/* Card number */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text.muted }]}>
              Card Number
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
              <Ionicons
                name="card-outline"
                size={18}
                color={colors.text.faint}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.text.faint}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>
          </View>

          {/* Name on card */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text.muted }]}>
              Name on Card
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
              <Ionicons
                name="person-outline"
                size={18}
                color={colors.text.faint}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={cardName}
                onChangeText={setCardName}
                placeholder="John Doe"
                placeholderTextColor={colors.text.faint}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Expiry + CVV row */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text.muted }]}>
                Expiry
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
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.text.faint}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text.muted }]}>
                CVV
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
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={colors.text.faint}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••"
                  placeholderTextColor={colors.text.faint}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          {/* Security note */}
          <View style={styles.securityRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={colors.text.faint}
            />
            <Text style={[styles.securityText, { color: colors.text.faint }]}>
              Your card details are encrypted and secure
            </Text>
          </View>
        </View>

        {/* Add button */}
        <TouchableOpacity
          onPress={handleAddCard}
          activeOpacity={0.85}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>Add Card</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Card preview
  cardPreview: {
    height: 180,
    borderRadius: 16,
    backgroundColor: "#05015A",
    padding: 20,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardPreviewType: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.65)",
  },
  cardPreviewNumber: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  cardPreviewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPreviewName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1,
  },
  cardPreviewExpiry: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
  },
  // Form
  formCard: {
    borderRadius: 16,
    padding: 16,
    gap: Spacing.md,
    marginBottom: 16,
  },
  field: {
    gap: Spacing.xs,
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
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  securityText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    height: 50,
    backgroundColor: "#05015A",
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});
