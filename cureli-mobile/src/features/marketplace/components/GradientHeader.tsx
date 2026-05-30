// src/features/marketplace/components/GradientHeader.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

import { SearchBar } from "./SearchBar";
import { CartButton } from "./CartButton";
import { useDeliveryLocation } from "../../../hooks/useDeliveryLocation";

// ── Constants ─────────────────────────────────────────────────

export const HEADER_HEIGHT = 180;
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
  const { location, isResolving } = useDeliveryLocation();

  // Has a real location been resolved (GPS or saved)?
  const hasLocation = location.source === 'gps' || location.source === 'saved';

  // Icon based on location source
  const locationIcon =
    location.source === 'gps'
      ? 'navigate'
      : location.source === 'saved'
        ? 'location'
        : 'location-outline';

  // Icon color
  const iconColor =
    location.source === 'gps'
      ? '#4ade80'
      : location.source === 'saved'
        ? '#facc15'
        : 'rgba(255,255,255,0.75)';

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
        <View style={styles.left}>
          <Text style={styles.wordmark}>cureli</Text>

          <TouchableOpacity
            style={styles.locationRow}
            onPress={onPressAddress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              hasLocation
                ? `Delivering in 10 mins to ${location.area}`
                : 'Set delivery location'
            }
          >
            {isResolving ? (
              <ActivityIndicator size={12} color="rgba(255,255,255,0.75)" />
            ) : (
              <Ionicons name={locationIcon} size={13} color={iconColor} />
            )}

            <Text style={styles.locationPrimary} numberOfLines={1}>
              {isResolving
                ? 'Detecting location...'
                : hasLocation
                  ? 'Delivering in 10 mins'
                  : 'Set delivery location'}
            </Text>

            <Ionicons
              name="chevron-down"
              size={13}
              color="rgba(255,255,255,0.55)"
            />
          </TouchableOpacity>

          {/* Address line — shows area + address when resolved */}
          <Text style={styles.address} numberOfLines={1}>
            {isResolving
              ? 'Please wait...'
              : hasLocation
                ? `${location.area} · ${location.addressLine}`
                : 'Tap here to set your address'}
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