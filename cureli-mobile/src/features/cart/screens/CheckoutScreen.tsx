// src/features/cart/screens/CheckoutScreen.tsx
//
// Full checkout: address + payment summary + order summary + place order.
// On "place order" → clears cart → shows inline success state.

import React, { useCallback, useEffect, useState } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { useCartStore } from "../../../store/cartStore";
import { usePaymentStore } from "../../../store/paymentStore";

const HANDLING_CHARGE = 10;
const HIGH_DEMAND_CHARGE = 5;

// ─────────────────────────────────────────────
// Success state — shown inline after place order
// ─────────────────────────────────────────────

interface OrderSuccessProps {
  onGoHome: () => void;
}

function OrderSuccess({ onGoHome }: OrderSuccessProps) {
  const { colors } = useTheme();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.successRoot,
        { backgroundColor: colors.background.page },
      ]}
    >
      <Animated.View style={badgeStyle}>
        <View
          style={[
            styles.successBadge,
            { backgroundColor: colors.status.successBg },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={colors.status.success}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.successBody, contentStyle]}>
        <Text style={[styles.successTitle, { color: colors.text.primary }]}>
          Order Placed!
        </Text>

        <Text style={[styles.successSub, { color: colors.text.muted }]}>
          Your medicines will be delivered in 10–12 minutes.{"\n"}
          You'll receive updates on your phone.
        </Text>

        <TouchableOpacity
          onPress={onGoHome}
          activeOpacity={0.85}
          style={styles.homeBtn}
        >
          <Ionicons name="home-outline" size={16} color="#ffffff" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main CheckoutScreen
// ─────────────────────────────────────────────

export function CheckoutScreen() {
  const { colors } = useTheme();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const selectedMethod = usePaymentStore((s) => s.selectedMethod);

  const [isSuccess, setIsSuccess] = useState(false);

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.pricePerUnit * item.quantity,
    0,
  );
  const grandTotal = itemsTotal + HANDLING_CHARGE + HIGH_DEMAND_CHARGE;

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleChangePayment = useCallback(() => {
    router.push("/checkout/payment" as any);
  }, []);

  const handleChangeAddress = useCallback(() => {
    router.push("/profile/addresses" as any);
  }, []);

  const handlePlaceOrder = useCallback(() => {
    clearCart();
    setIsSuccess(true);
  }, [clearCart]);

  const handleGoHome = useCallback(() => {
    router.replace("/(tabs)" as any);
  }, []);

  // ── Success state ──────────────────────────
  if (isSuccess) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <OrderSuccess onGoHome={handleGoHome} />
      </SafeAreaView>
    );
  }

  // ── Normal checkout ────────────────────────
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
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Checkout
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Delivery Address ── */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colors.text.brand}
            />
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Delivery Address
            </Text>
          </View>

          <View style={styles.addressContent}>
            <View style={styles.addressLeft}>
              <Text
                style={[styles.addressType, { color: colors.text.primary }]}
              >
                Office
              </Text>
              <Text
                style={[styles.addressLine, { color: colors.text.muted }]}
                numberOfLines={2}
              >
                Kakkanad, Kochi, Kerala 682030
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleChangeAddress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Change delivery address"
            >
              <Text style={[styles.changeText, { color: colors.text.brand }]}>
                Change
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Payment Method ── */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="card-outline"
              size={18}
              color={colors.text.brand}
            />
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Payment Method
            </Text>
          </View>

          <View style={styles.paymentContent}>
            <View style={styles.paymentLeft}>
              <View
                style={[
                  styles.paymentIconWrap,
                  { backgroundColor: colors.background.tint },
                ]}
              >
                <Ionicons
                  name={selectedMethod.icon as any}
                  size={18}
                  color={colors.text.brand}
                />
              </View>
              <Text
                style={[styles.paymentLabel, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {selectedMethod.label}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleChangePayment}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Change payment method"
            >
              <Text style={[styles.changeText, { color: colors.text.brand }]}>
                Change
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Order Summary ── */}
        <View style={[styles.card, { backgroundColor: colors.background.card }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="receipt-outline"
              size={18}
              color={colors.text.brand}
            />
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Order Summary
            </Text>
          </View>

          {/* Line items */}
          {items.map((item) => (
            <View key={item.variantId} style={styles.summaryRow}>
              <Text
                style={[styles.summaryName, { color: colors.text.secondary }]}
                numberOfLines={1}
              >
                {item.name} × {item.quantity}
              </Text>
              <Text
                style={[styles.summaryPrice, { color: colors.text.primary }]}
              >
                ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View
            style={[styles.divider, { backgroundColor: colors.border.subtle }]}
          />

          {/* Charges */}
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.text.secondary }]}
            >
              Items total
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.text.primary }]}>
              ₹{itemsTotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.text.secondary }]}
            >
              Handling charge
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.text.primary }]}>
              ₹{HANDLING_CHARGE.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.text.secondary }]}
            >
              High demand charge
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.text.primary }]}>
              ₹{HIGH_DEMAND_CHARGE.toFixed(2)}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.border.default }]}
          />

          {/* Grand total */}
          <View style={styles.summaryRow}>
            <Text style={[styles.grandLabel, { color: colors.text.primary }]}>
              Grand Total
            </Text>
            <Text style={[styles.grandValue, { color: colors.text.primary }]}>
              ₹{grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom: Place Order ── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <View style={styles.bottomLeft}>
          <Text style={[styles.bottomTotal, { color: colors.text.primary }]}>
            ₹{grandTotal.toFixed(2)}
          </Text>
          <Text style={[styles.bottomSub, { color: colors.text.muted }]}>
            Total amount
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          activeOpacity={0.85}
          style={styles.placeBtn}
          accessibilityRole="button"
          accessibilityLabel={`Place order for ₹${grandTotal.toFixed(2)}`}
        >
          <Text style={styles.placeBtnText}>Place Order</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  // Header
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

  // Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },

  // Card shell
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  // Address
  addressContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  addressLeft: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.md,
  },
  addressType: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  addressLine: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  changeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  // Payment
  paymentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  paymentIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  // Summary rows
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    paddingRight: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  summaryPrice: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  grandLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  grandValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  bottomLeft: {
    gap: 2,
  },
  bottomTotal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  bottomSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  placeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#05015A",
    paddingHorizontal: 20,
    height: 50,
    borderRadius: Radius.md,
  },
  placeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },

  // Success
  successRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 32,
  },
  successBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  successBody: {
    alignItems: "center",
    gap: Spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#05015A",
    paddingHorizontal: 24,
    height: 50,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  homeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});