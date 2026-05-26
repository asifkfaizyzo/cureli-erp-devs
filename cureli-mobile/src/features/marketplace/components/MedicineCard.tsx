// src/features/marketplace/components/MedicineCard.tsx
//
// THE core marketplace listing card. This component carries the "real
// marketplace" feel, so its details are deliberate.
//
// Layout:
//   LEFT  — clean white image container; branded placeholder when no image.
//   RIGHT — name (max 2 lines) + Rx badge, composition/manufacturer,
//           the CRITICAL "Available at N nearby pharmacies" line,
//           and a bottom row: "Starts at ₹X"  •  "ETA mins • distance km".
//
// Receives an EnrichedMedicine (real catalog data + deterministic fake
// marketplace data) — see useMedicineFeed. Purely presentational + memoized.
// Subtle Reanimated scale-on-press; no other animation.

import React, { useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { EnrichedMedicine } from "../types/marketplace.types";

interface MedicineCardProps {
  medicine: EnrichedMedicine;
  onPress: (medicine: EnrichedMedicine) => void;
}

// Build a one-line composition summary from the composition array.
function compositionSummary(med: EnrichedMedicine): string {
  if (Array.isArray(med.composition) && med.composition.length > 0) {
    return med.composition
      .map((c) => (c.strength ? `${c.name} ${c.strength}` : c.name))
      .join(" + ");
  }
  // Fall back to strength or generic name if composition is empty.
  return med.strength || med.genericName || "—";
}

function MedicineCardBase({ medicine, onPress }: MedicineCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(medicine);
  }, [onPress, medicine]);

  const { marketplace } = medicine;

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={medicine.name}
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        {/* LEFT — image / placeholder */}
        <View
          style={[
            styles.imageBox,
            {
              backgroundColor: "#ffffff",
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {medicine.image ? (
            <Image
              source={{ uri: medicine.image }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons
                name="medical-outline"
                size={28}
                color={colors.text.brand}
              />
            </View>
          )}
        </View>

        {/* RIGHT — details */}
        <View style={styles.details}>
          {/* Name + Rx */}
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {medicine.name}
            </Text>
            {medicine.prescriptionRequired ? (
              <View
                style={[
                  styles.rxBadge,
                  {
                    backgroundColor: colors.status.warningBg,
                    borderColor: colors.status.warning,
                  },
                ]}
              >
                <Text style={[styles.rxText, { color: colors.status.warning }]}>
                  Rx
                </Text>
              </View>
            ) : null}
          </View>

          {/* Composition */}
          <Text
            style={[styles.composition, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {compositionSummary(medicine)}
          </Text>

          {/* Manufacturer */}
          {medicine.manufacturer ? (
            <Text
              style={[styles.manufacturer, { color: colors.text.faint }]}
              numberOfLines={1}
            >
              {medicine.manufacturer}
            </Text>
          ) : null}

          {/* CRITICAL — nearby pharmacies */}
          <View style={styles.pharmacyRow}>
            <Ionicons
              name="storefront-outline"
              size={13}
              color={colors.text.brand}
            />
            <Text style={[styles.pharmacyText, { color: colors.text.brand }]}>
              Available at {marketplace.pharmacyCount} nearby{" "}
              {marketplace.pharmacyCount === 1 ? "pharmacy" : "pharmacies"}
            </Text>
          </View>

          {/* Bottom row — price + ETA/distance */}
          <View
            style={[styles.bottomRow, { borderTopColor: colors.border.subtle }]}
          >
            <View>
              <Text style={[styles.priceLabel, { color: colors.text.faint }]}>
                Starts at
              </Text>
              <Text style={[styles.price, { color: colors.text.primary }]}>
                ₹{marketplace.startsAt}
              </Text>
            </View>

            <View style={styles.metaRight}>
              {marketplace.inStock ? (
                <View style={styles.stockRow}>
                  <View
                    style={[
                      styles.stockDot,
                      { backgroundColor: colors.status.success },
                    ]}
                  />
                  <Text
                    style={[styles.stockText, { color: colors.status.success }]}
                  >
                    {marketplace.stockLabel}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.stockText, { color: colors.status.warning }]}
                >
                  {marketplace.stockLabel}
                </Text>
              )}
              <Text style={[styles.eta, { color: colors.text.muted }]}>
                {marketplace.etaMins} mins • {marketplace.distanceKm} km
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    // Lightweight shadow (premium, not heavy).
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageBox: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  name: {
    ...Typography.bodySemiBold,
    flex: 1,
    lineHeight: 20,
  },
  rxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: 1,
  },
  rxText: {
    ...Typography.smallBold,
    fontSize: 10,
    lineHeight: 14,
  },
  composition: {
    ...Typography.small,
    marginTop: 3,
  },
  manufacturer: {
    ...Typography.caption,
    marginTop: 1,
  },
  pharmacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  pharmacyText: {
    ...Typography.smallMedium,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  priceLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  price: {
    ...Typography.h4,
  },
  metaRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    ...Typography.smallMedium,
    fontSize: 11,
  },
  eta: {
    ...Typography.caption,
  },
});

// Memoise on medicine identity + handler. The enriched object is stable
// (memoised in the hook), so this prevents re-renders during scroll.
export const MedicineCard = React.memo(
  MedicineCardBase,
  (prev: MedicineCardProps, next: MedicineCardProps) =>
    prev.medicine.variantId === next.medicine.variantId &&
    prev.onPress === next.onPress,
);