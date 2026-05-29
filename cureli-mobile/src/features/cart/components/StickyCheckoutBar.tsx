import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { useCartStore } from "../../../store/cartStore";
import { usePaymentStore } from "../../../store/paymentStore";

const HANDLING_CHARGE = 10;
const HIGH_DEMAND_CHARGE = 5;

interface StickyCheckoutBarProps {
  onPlaceOrder: () => void;
}

export function StickyCheckoutBar({ onPlaceOrder }: StickyCheckoutBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const selectedMethod = usePaymentStore((s) => s.selectedMethod);

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.pricePerUnit * item.quantity,
    0,
  );
  const grandTotal = itemsTotal + HANDLING_CHARGE + HIGH_DEMAND_CHARGE;

  const handlePaymentPress = useCallback(() => {
    router.push("/checkout/payment" as any);
  }, []);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background.card,
          borderTopColor: "#DDDDDD",
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* Delivery location row */}
      <View style={styles.locationRow}>
        <Ionicons
          name="location-outline"
          size={16}
          color={colors.text.brand}
        />
        <View style={styles.locationText}>
          <Text style={[styles.locationLabel, { color: colors.text.muted }]}>
            Delivering to
          </Text>
          <Text
            style={[styles.locationValue, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            Office — Kakkanad, Kochi
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Change delivery address"
        >
          <Text style={[styles.changeText, { color: colors.text.brand }]}>
            Change
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment + place order row */}
      <View style={styles.paymentRow}>
        {/* Left: selected payment method — tappable */}
        <TouchableOpacity
          onPress={handlePaymentPress}
          activeOpacity={0.75}
          style={styles.paymentLeft}
          accessibilityRole="button"
          accessibilityLabel="Change payment method"
        >
          <Ionicons
            name={selectedMethod.icon as any}
            size={16}
            color={colors.text.brand}
          />
          <Text
            style={[styles.paymentLabel, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {selectedMethod.label}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={colors.text.faint}
          />
        </TouchableOpacity>

        {/* Right: place order button */}
        <TouchableOpacity
          onPress={onPlaceOrder}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Place order for ₹${grandTotal.toFixed(2)}`}
          style={styles.placeOrderBtn}
        >
          <View style={styles.placeOrderLeft}>
            <Text style={styles.placeOrderPrice}>
              ₹{grandTotal.toFixed(2)}
            </Text>
            <Text style={styles.placeOrderSub}>TOTAL</Text>
          </View>
          <View style={styles.placeOrderRight}>
            <Text style={styles.placeOrderText}>Place Order</Text>
            <Ionicons name="arrow-forward" size={14} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  locationRow: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: Spacing.sm,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  locationValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  changeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  paymentRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  paymentLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  placeOrderBtn: {
    width: 170,
    height: 46,
    backgroundColor: "#05015A",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  placeOrderLeft: {
    alignItems: "flex-start",
  },
  placeOrderPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  placeOrderSub: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.5,
  },
  placeOrderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeOrderText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
});