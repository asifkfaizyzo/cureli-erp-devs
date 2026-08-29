// src/features/marketplace/components/MedicineCard.tsx

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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
import { getPlaceholder } from "../../../utils/placeholderImage";
import type { EnrichedMedicine } from "../types/marketplace.types";

interface MedicineCardProps {
  medicine: EnrichedMedicine;
  onPress: (medicine: EnrichedMedicine) => void;
}

function compositionSummary(med: EnrichedMedicine): string {
  if (Array.isArray(med.composition) && med.composition.length > 0) {
    return med.composition
      .map((c) => (c.strength ? `${c.name} ${c.strength}` : c.name))
      .join(" + ");
  }
  return med.strength || med.genericName || "—";
}

function MedicineCardBase({ medicine, onPress }: MedicineCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const placeholder = getPlaceholder(isDark);

  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [medicine.image]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
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

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageReady || imageError;

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
        {/* LEFT — image box */}
        <View
          style={[
            styles.imageBox,
            {
              backgroundColor: colors.background.elevated,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {showPlaceholder ? (
            <Animated.Image
              source={placeholder}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}

          {medicine.image && !imageError ? (
            <Animated.Image
              source={{ uri: medicine.image }}
              style={[styles.image, styles.realImageOverlay, realImageAnimatedStyle]}
              resizeMode="contain"
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : null}
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
            {/* {medicine.prescriptionRequired ? (
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
            ) : null} */}
          </View>

          {/* Composition */}
          <Text
            style={[styles.composition, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {compositionSummary(medicine)}
          </Text>

          {/* Manufacturer — real field from backend */}
          {medicine.manufacturer ? (
            <Text
              style={[styles.manufacturer, { color: colors.text.faint }]}
              numberOfLines={1}
            >
              {medicine.manufacturer}
            </Text>
          ) : null}

          {/* Form pill — real field from backend */}
          {medicine.form ? (
            <View
              style={[
                styles.formPill,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.brand,
                },
              ]}
            >
              <Text style={[styles.formPillText, { color: colors.text.brand }]}>
                {medicine.form}
              </Text>
            </View>
          ) : null}

          {/* Footer — check availability CTA, no fake numbers */}
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border.subtle },
            ]}
          >
            <Text style={[styles.checkText, { color: colors.text.muted }]}>
              Tap to check availability &amp; price
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.text.faint}
            />
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
  realImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 3,
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
  },
  manufacturer: {
    ...Typography.caption,
  },
  formPill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 2,
  },
  formPillText: {
    ...Typography.caption,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  checkText: {
    ...Typography.caption,
    flex: 1,
  },
});

export const MedicineCard = React.memo(
  MedicineCardBase,
  (prev: MedicineCardProps, next: MedicineCardProps) =>
    prev.medicine.variantId === next.medicine.variantId &&
    prev.onPress === next.onPress,
);