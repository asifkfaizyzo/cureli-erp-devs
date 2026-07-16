// src/features/marketplace/components/product/FindPharmaciesSection.tsx
//
// CTA card that opens the ShopsBottomSheet.
// No longer navigates away — the sheet slides up in-place.
// The onPress handler is provided by the parent screen.
//
// UX improvements:
//   - whole card is tappable, not just the small button
//   - immediate "Opening" feedback after tap
//   - loading spinner shown while opening
//   - chevron points forward instead of up

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";

interface FindPharmaciesSectionProps {
  shopCount: number;
  isLoading: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

const OPENING_FEEDBACK_MS = 800;

export function FindPharmaciesSection({
  shopCount,
  isLoading,
  onPress,
  colors,
}: FindPharmaciesSectionProps) {
  const [isOpening, setIsOpening] = useState(false);
  const openingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openingTimerRef.current) {
        clearTimeout(openingTimerRef.current);
      }
    };
  }, []);

  const subtitle = isLoading
    ? "Finding nearby pharmacies…"
    : shopCount > 0
      ? `${shopCount} ${shopCount === 1 ? "pharmacy" : "pharmacies"} near you`
      : "Tap to check availability";

  const handlePress = useCallback(() => {
    if (isOpening) return;

    setIsOpening(true);
    onPress();

    if (openingTimerRef.current) {
      clearTimeout(openingTimerRef.current);
    }

    // Short optimistic feedback so the tap feels immediate.
    // The sheet/backdrop will take over visually right after.
    openingTimerRef.current = setTimeout(() => {
      setIsOpening(false);
    }, OPENING_FEEDBACK_MS);
  }, [isOpening, onPress]);

  const buttonLabel = isOpening ? "Opening" : "See all";

  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`Order from a pharmacy. ${subtitle}. ${buttonLabel}.`}
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.brand} />
            ) : (
              <Ionicons
                name="storefront-outline"
                size={20}
                color={colors.text.brand}
              />
            )}
          </View>

          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Order from a pharmacy
            </Text>
            <Text style={[styles.cardSub, { color: colors.text.muted }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.btn,
            {
              backgroundColor: isOpening
                ? colors.background.tint
                : colors.brand.primary,
              borderColor: isOpening
                ? colors.border.brand
                : colors.brand.primary,
            },
          ]}
        >
          {isOpening ? (
            <ActivityIndicator size="small" color={colors.text.brand} />
          ) : null}

          <Text
            style={[
              styles.btnText,
              {
                color: isOpening ? colors.text.brand : colors.text.inverse,
              },
            ]}
          >
            {buttonLabel}
          </Text>

          {!isOpening ? (
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.text.inverse}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.base,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
  },
  cardText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cardTitle: {
    ...Typography.bodyMedium,
  },
  cardSub: {
    ...Typography.small,
    lineHeight: 17,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    flexShrink: 0,
    minWidth: 92,
    justifyContent: "center",
    borderWidth: 1,
  },
  btnText: {
    ...Typography.smallMedium,
  },
});