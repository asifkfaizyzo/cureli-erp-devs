import React, { useCallback, useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../theme/ThemeContext";
import { Typography } from "../../theme/typography";
import { Spacing } from "../../theme/spacing";
import { useCartStore } from "../../store/cartStore";
import { useLayoutStore } from "../../store/layoutStore";
import { useCartBarVisibility } from "../../hooks/useCartBarVisibility";
import { useIsBottomTabRoute } from "../../hooks/useIsBottomTabRoute";
import {
  DEFAULT_BOTTOM_TAB_BAR_HEIGHT,
  GLOBAL_CART_BAR_BOTTOM_OFFSET,
} from "./cartBar.constants";

const BAR_HEIGHT = 55;
const THUMB_SIZE = 34;
const THUMB_OVERLAP = 10;
const MAX_THUMBS = 3;

export function GlobalCartBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isVisible } = useCartBarVisibility();
  const isBottomTabRoute = useIsBottomTabRoute();

  const cartCount = useCartStore((s) => s.cartCount);
  const cartItems = useCartStore((s) => s.items);
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  // Last 3 items (most recently added = last in array), reversed so
  // the newest item renders on top (leftmost in the visual stack).
  const thumbItems = useMemo(() => {
    const lastThree = cartItems.slice(-MAX_THUMBS);
    return lastThree.reverse();
  }, [cartItems]);

  // Width of the overlapping thumbnail stack so the text can sit
  // correctly beside it. First thumb = full width, each subsequent
  // thumb adds (THUMB_SIZE - THUMB_OVERLAP).
  const stackWidth = useMemo(() => {
    if (thumbItems.length === 0) return 0;
    return THUMB_SIZE + (thumbItems.length - 1) * (THUMB_SIZE - THUMB_OVERLAP);
  }, [thumbItems.length]);

  const effectiveTabHeight =
    bottomTabBarHeight > 0 ? bottomTabBarHeight : DEFAULT_BOTTOM_TAB_BAR_HEIGHT;

  const bottomOffset = isBottomTabRoute
    ? effectiveTabHeight + GLOBAL_CART_BAR_BOTTOM_OFFSET
    : insets.bottom + GLOBAL_CART_BAR_BOTTOM_OFFSET;

  const handlePress = useCallback(() => {
    router.push("/cart" as any);
  }, []);

  if (!isVisible) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View cart. ${cartCount} items.`}
      style={[
        styles.bar,
        {
          backgroundColor: colors.brand.primary,
          bottom: bottomOffset,
        },
      ]}
    >
      {/* Overlapping thumbnail stack */}
      <View style={[styles.thumbStack, { width: stackWidth }]}>
        {thumbItems.map((item, index) => (
          <View
            key={item.variantId}
            style={[
              styles.thumbWrap,
              {
                left: index * (THUMB_SIZE - THUMB_OVERLAP),
                zIndex: MAX_THUMBS - index,
              },
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.thumbPlaceholder,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
              >
                <Ionicons
                  name="medkit-outline"
                  size={14}
                  color="rgba(255,255,255,0.7)"
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Label + count */}
      <Text style={styles.label}>View Cart</Text>

      {/* Count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{cartCount}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={14}
        color="rgba(255,255,255,0.6)"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: Spacing["5xl"],
    right: Spacing["5xl"],
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.md,
    gap: Spacing.sm,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 5,
  },

  // ── Thumbnail stack ─────────────────────────────────────
  thumbStack: {
    height: THUMB_SIZE,
    position: "relative",
  },
  thumbWrap: {
    position: "absolute",
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Label ───────────────────────────────────────────────
  label: {
    flex: 1,
    color: "#ffffff",
    ...Typography.smallBold,
    fontSize: 13,
    textAlign: "center",
  },

  // ── Count badge ─────────────────────────────────────────
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
});