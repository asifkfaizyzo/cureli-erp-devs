// src/features/marketplace/components/GradientHeader.tsx

import React, { useState, useEffect, useRef } from "react";
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
import { AddressDropdown } from "./AddressDropdown";
import { useDeliveryLocation } from "../../../hooks/useDeliveryLocation";
import { useAddresses } from "../../profile/hooks/useAddresses";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";
import type { DeliveryLocation } from "../../../store/deliveryLocationStore";

// ── Constants ─────────────────────────────────────────────────

export const HEADER_HEIGHT = 180;
const GRADIENT_COLORS: [string, string] = ["#05015A", "#BBAEF9"];

// ── Props ─────────────────────────────────────────────────────

interface GradientHeaderProps {
  onPressProfile?: () => void;
  onPressSearch?: () => void;
  onPressCart?: () => void;
}

// ── Component ─────────────────────────────────────────────────

function GradientHeaderBase({
  onPressProfile,
  onPressSearch,
  onPressCart,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const { location, isResolving } = useDeliveryLocation();
  const { addresses } = useAddresses();
  const { selectAddress } = useDeliveryLocationStore();

  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ── Track newly added address ─────────────────────────────
  const prevAddressCountRef = useRef(addresses.length);

  useEffect(() => {
    const prevCount = prevAddressCountRef.current;
    const currentCount = addresses.length;

    if (currentCount > prevCount && prevCount > 0) {
      // A new address was added — find it (most recent by created_at)
      const sorted = [...addresses].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const newest = sorted[0];

      if (newest) {
        const newLocation: DeliveryLocation = {
          source: 'saved',
          area: newest.city ?? newest.label ?? 'Saved Address',
          addressLine: [
            newest.address_line_1,
            newest.city,
            newest.pincode,
          ]
            .filter(Boolean)
            .join(', '),
          latitude: newest.latitude ? Number(newest.latitude) : null,
          longitude: newest.longitude ? Number(newest.longitude) : null,
          addressId: newest.id,
        };

        selectAddress(newLocation);
      }
    }

    prevAddressCountRef.current = currentCount;
  }, [addresses, selectAddress]);

  // ── Derived state ─────────────────────────────────────────

  const hasLocation = location.source === 'gps' || location.source === 'saved';

  const locationIcon =
    location.source === 'gps'
      ? 'navigate'
      : location.source === 'saved'
        ? 'location'
        : 'location-outline';

  const iconColor =
    location.source === 'gps'
      ? '#4ade80'
      : location.source === 'saved'
        ? '#facc15'
        : 'rgba(255,255,255,0.75)';

  // ── Handlers ──────────────────────────────────────────────

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const closeDropdown = () => {
    setDropdownVisible(false);
  };

  return (
    <>
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
              onPress={toggleDropdown}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                hasLocation
                  ? `Delivering to ${location.area}. Tap to change.`
                  : 'Set delivery location'
              }
            >
              {isResolving ? (
                <ActivityIndicator size={12} color="rgba(255,255,255,0.75)" />
              ) : (
                <Ionicons name={locationIcon} size={13} color={iconColor} />
              )}

              <Text style={styles.areaName} numberOfLines={1}>
                {isResolving
                  ? 'Detecting location...'
                  : hasLocation
                    ? location.area
                    : 'Set delivery location'}
              </Text>

              <Ionicons
                name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
                size={13}
                color="rgba(255,255,255,0.55)"
              />
            </TouchableOpacity>

            {/* Address line */}
            <Text style={styles.address} numberOfLines={1}>
              {isResolving
                ? 'Please wait...'
                : hasLocation
                  ? location.addressLine
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

      {/* ── Address dropdown (renders outside gradient, overlays content) ── */}
      <AddressDropdown
        visible={dropdownVisible}
        onClose={closeDropdown}
      />
    </>
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
  areaName: {
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