import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

export function CouponCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: "#89B9FF",
        },
      ]}
    >
      {/* Upper section */}
      <View style={styles.upper}>
        <View style={styles.topRow}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.status.success}
          />
          <Text style={[styles.freeText, { color: colors.status.success }]}>
            You got FREE Delivery
          </Text>
        </View>
        <Text style={[styles.sub, { color: colors.text.muted }]}>
          No coupon needed
        </Text>
      </View>

      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

      {/* Lower section */}
      <TouchableOpacity
        style={[
          styles.lower,
          { backgroundColor: colors.background.page },
        ]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="See all coupons"
      >
        <Text style={[styles.seeAll, { color: colors.text.brand }]}>
          See all coupons →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 16,
    marginTop: 16,
  },
  upper: {
    padding: 16,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  freeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
  },
  lower: {
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});