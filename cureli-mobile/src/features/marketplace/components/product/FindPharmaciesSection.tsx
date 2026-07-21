// src/features/marketplace/components/product/FindPharmaciesSection.tsx

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
  isError: boolean;
  onPress: () => void;
  onRetry: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

const OPENING_FEEDBACK_MS = 800;

export function FindPharmaciesSection({
  shopCount,
  isLoading,
  isError,
  onPress,
  onRetry,
  colors,
}: FindPharmaciesSectionProps) {
  const [isOpening, setIsOpening] = useState(false);
  const openingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openingTimerRef.current) clearTimeout(openingTimerRef.current);
    };
  }, []);

  const handlePress = useCallback(() => {
    if (isOpening) return;
    setIsOpening(true);
    onPress();
    if (openingTimerRef.current) clearTimeout(openingTimerRef.current);
    openingTimerRef.current = setTimeout(() => {
      setIsOpening(false);
    }, OPENING_FEEDBACK_MS);
  }, [isOpening, onPress]);

  // ── Error state ───────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.section}>
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.status.errorBg,
              borderColor: colors.status.error,
            },
          ]}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={22}
            color={colors.status.error}
          />
          <View style={styles.stateText}>
            <Text style={[styles.stateTitle, { color: colors.status.error }]}>
              Couldn't load pharmacies
            </Text>
            <Text style={[styles.stateSub, { color: colors.status.error }]}>
              Check your connection and try again
            </Text>
          </View>
          <TouchableOpacity
            onPress={onRetry}
            activeOpacity={0.75}
            style={[
              styles.retryBtn,
              { borderColor: colors.status.error },
            ]}
          >
            <Text style={[styles.retryText, { color: colors.status.error }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Empty state — loaded but zero shops ───────────────────
  if (!isLoading && shopCount === 0) {
    return (
      <View style={styles.section}>
        <View
          style={[
            styles.stateCard,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={colors.text.faint}
            />
          </View>
          <View style={styles.stateText}>
            <Text
              style={[styles.stateTitle, { color: colors.text.secondary }]}
            >
              No pharmacies nearby
            </Text>
            <Text style={[styles.stateSub, { color: colors.text.muted }]}>
              This medicine isn't listed at any pharmacy near your location
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Normal CTA (loading or has shops) ────────────────────
  const subtitle = isLoading
    ? "Finding nearby pharmacies…"
    : `${shopCount} ${shopCount === 1 ? "pharmacy" : "pharmacies"} near you`;

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

  // ── Shared state card (error + empty) ──
  stateCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stateText: {
    flex: 1,
    gap: 3,
  },
  stateTitle: {
    ...Typography.bodyMedium,
  },
  stateSub: {
    ...Typography.small,
    lineHeight: 17,
  },
  retryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  retryText: {
    ...Typography.smallMedium,
  },

  // ── Normal CTA card ──
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