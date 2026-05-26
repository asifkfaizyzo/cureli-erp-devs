// src/features/marketplace/components/GradientHeader.tsx
//
// Fixed gradient header that sits above the scroll content.
// Height = HEADER_HEIGHT (content) + insets.top (safe area).
//
// Gradient: #05015A → #BBAEF9, top → bottom.
// Contains: wordmark + location + address | SearchBar + CartButton row.
//
// Presentational — all handlers come from props.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  // Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

import { SearchBar } from "./SearchBar";
import { CartButton } from "./CartButton";

import { DEMO_LOCATION } from "../constants/marketplace.constants";

// ── Constants ─────────────────────────────────────────────────

// Content height below the safe area inset.
// Safe area is added dynamically via useSafeAreaInsets().
export const HEADER_HEIGHT = 180;

// Gradient colours — top (deep navy) → bottom (soft lavender).
const GRADIENT_COLORS: [string, string] = ["#05015A", "#BBAEF9"];

// ── Props ─────────────────────────────────────────────────────

interface GradientHeaderProps {
  onPressAddress?: () => void;
  onPressProfile?: () => void;
  onPressSearch?: () => void;
  onPressCart?: () => void;
}

// ── Component ─────────────────────────────────────────────────

function GradientHeaderBase({
  onPressAddress,
  onPressProfile,
  onPressSearch,
  onPressCart,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.gradient,
        {
          height: HEADER_HEIGHT + insets.top,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* ── Top row: wordmark + location + profile ── */}
      <View style={styles.topRow}>
        {/* Left: brand + location */}
        <View style={styles.left}>
          <Text style={styles.wordmark}>cureli</Text>

          <TouchableOpacity
            style={styles.locationRow}
            onPress={onPressAddress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Delivering near ${DEMO_LOCATION.area}`}
          >
            <Ionicons
              name="location-outline"
              size={13}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.locationPrimary} numberOfLines={1}>
              Delivering in 10 mins
            </Text>
            <Ionicons
              name="chevron-down"
              size={13}
              color="rgba(255,255,255,0.55)"
            />
          </TouchableOpacity>

          <Text style={styles.address} numberOfLines={1}>
            {DEMO_LOCATION.addressLine}
          </Text>
        </View>

        {/* Right: profile avatar */}
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onPressProfile}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Ionicons name="person" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ── Bottom row: search + cart ── */}
      <View style={styles.searchRow}>
        {/* SearchBar takes flex:1, CartButton is fixed width */}
        <View style={styles.searchFlex}>
          <SearchBar onPress={onPressSearch} variant="header" />
        </View>
        <CartButton onPress={onPressCart} />
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    // Distribute children top/bottom inside the content area.
    justifyContent: "space-between",
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  left: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  wordmark: {
    ...Typography.h2,
    color: "#ffffff",
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
    color: "rgba(255,255,255,0.90)",
    flexShrink: 1,
  },
  address: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.55)",
    marginTop: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  searchFlex: {
    flex: 1,
  },
});

export const GradientHeader = React.memo(GradientHeaderBase);