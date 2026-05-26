// src/features/marketplace/components/CartButton.tsx
//
// Cart icon button with item-count badge.
// Count comes from useCartStore — never hardcoded in JSX.
// Badge hidden when count is 0.
// Designed to sit next to SearchBar inside GradientHeader.

import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Spacing } from "../../../theme/spacing";
import { Typography } from "../../../theme/typography";
import { useCartStore } from "../../../store/cartStore";

// ── Props ─────────────────────────────────────────────────────

interface CartButtonProps {
  onPress?: () => void;
}

// ── Component ─────────────────────────────────────────────────

function CartButtonBase({ onPress }: CartButtonProps) {
  const cartCount = useCartStore((state) => state.cartCount);

  // Clamp display to "99+" so the badge doesn't overflow.
  const displayCount = cartCount > 99 ? "99+" : String(cartCount);
  const showBadge = cartCount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Cart, ${cartCount} items`}
      style={styles.button}
    >
      <Ionicons name="bag-outline" size={22} color="#ffffff" />

      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    // Badge bleeds outside; allow overflow on iOS.
    overflow: "visible",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    // White border so badge reads on any background.
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  badgeText: {
    ...Typography.smallBold,
    fontSize: 10,
    lineHeight: 13,
    color: "#ffffff",
  },
});

export const CartButton = React.memo(CartButtonBase);