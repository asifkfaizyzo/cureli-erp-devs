// src/features/marketplace/components/HomeHeader.tsx
//
// Top safe-area header for the marketplace home.
// Left:  brand wordmark + location ("Medicines near Kakkanad" + address line).
// Right: notification + profile avatar buttons.
//
// Healthcare-first, NOT grocery-first: the location line emphasises WHERE
// medicines come from, not a delivery countdown. Presentational only — all
// handlers come from props.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { DEMO_LOCATION } from "../constants/marketplace.constants";

interface HomeHeaderProps {
  onPressProfile?: () => void;
  onPressNotifications?: () => void;
  onPressLocation?: () => void;
}

function HomeHeaderBase({
  onPressProfile,
  onPressNotifications,
  onPressLocation,
}: HomeHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Left: brand + location */}
      <View style={styles.left}>
        <Text style={[styles.wordmark, { color: colors.text.primary }]}>
          cureli
        </Text>

        <TouchableOpacity
          style={styles.locationRow}
          onPress={onPressLocation}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Medicines near ${DEMO_LOCATION.area}`}
        >
          <Ionicons
            name="location-outline"
            size={14}
            color={colors.text.brand}
          />
          <Text
            style={[styles.locationPrimary, { color: colors.text.secondary }]}
            numberOfLines={1}
          >
            Medicines near {DEMO_LOCATION.area}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.text.muted}
          />
        </TouchableOpacity>

        <Text
          style={[styles.locationAddress, { color: colors.text.faint }]}
          numberOfLines={1}
        >
          {DEMO_LOCATION.addressLine}
        </Text>
      </View>

      {/* Right: actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
          onPress={onPressNotifications}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.avatarButton,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.brand,
            },
          ]}
          onPress={onPressProfile}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Ionicons name="person" size={18} color={colors.text.brand} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  left: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  wordmark: {
    ...Typography.h2,
    letterSpacing: -0.5,
    textTransform: "lowercase",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationPrimary: {
    ...Typography.bodySemiBold,
    flexShrink: 1,
  },
  locationAddress: {
    ...Typography.caption,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});

export const HomeHeader = React.memo(HomeHeaderBase);