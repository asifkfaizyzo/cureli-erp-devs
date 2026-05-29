// src/features/marketplace/components/CategoryScreenHeader.tsx
//
// Header for the categories tab screen.
// Back button | Category title | Search + Cart

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { useCartStore } from "../../../store/cartStore";

interface CategoryScreenHeaderProps {
  title: string;
  onPressBack: () => void;
  onPressSearch: () => void;
  onPressCart: () => void;
}

function CategoryScreenHeaderBase({
  title,
  onPressBack,
  onPressSearch,
  onPressCart,
}: CategoryScreenHeaderProps) {
  const { colors } = useTheme();
  const cartCount = useCartStore((state) => state.cartCount);
  const displayCount = cartCount > 99 ? "99+" : String(cartCount);
  const showBadge = cartCount > 0;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.page,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      {/* Back */}
      <TouchableOpacity
        onPress={onPressBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.iconBtn}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
      </TouchableOpacity>

      {/* Title */}
      <Text
        style={[styles.title, { color: colors.text.primary }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Right actions */}
      <View style={styles.rightActions}>
        {/* Search */}
        <TouchableOpacity
          onPress={onPressSearch}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={styles.iconBtn}
        >
          <Ionicons name="search" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Cart */}
        <TouchableOpacity
          onPress={onPressCart}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Cart, ${cartCount} items`}
          style={styles.iconBtn}
        >
          <Ionicons name="bag-outline" size={20} color={colors.text.primary} />

          {showBadge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{displayCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  title: {
    ...Typography.h4,
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  badgeText: {
    ...Typography.smallBold,
    fontSize: 9,
    lineHeight: 12,
    color: "#ffffff",
  },
});

export const CategoryScreenHeader = React.memo(CategoryScreenHeaderBase);