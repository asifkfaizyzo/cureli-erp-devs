import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import { getPlaceholder } from "../../../../utils/placeholderImage";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { EnrichedBranchMedicine } from "../../hooks/useShopMedicines";

interface MedicineRowProps {
  item: EnrichedBranchMedicine;
  cartQuantity: number;
  onAdd: (item: EnrichedBranchMedicine) => void;
  onIncrement: (item: EnrichedBranchMedicine) => void;
  onDecrement: (item: EnrichedBranchMedicine) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}

export function MedicineRow({
  item,
  cartQuantity,
  onAdd,
  onIncrement,
  onDecrement,
  colors,
  isDark,
}: MedicineRowProps) {
  const scale = useSharedValue(1);
  const placeholder = getPlaceholder(isDark);

  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
  }, [item.image]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 80 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 100 });
  }, [scale]);

  const handlePressCard = useCallback(() => {
    router.push(`/product/${item.skuId}` as any);
  }, [item.skuId]);

  const handleAdd = useCallback(() => onAdd(item), [onAdd, item]);
  const handleIncrement = useCallback(
    () => onIncrement(item),
    [onIncrement, item],
  );
  const handleDecrement = useCallback(
    () => onDecrement(item),
    [onDecrement, item],
  );

  const displayPrice = item.listingPrice ?? item.marketplace.startsAt;
  const hasRealPrice = item.listingPrice != null;
  const inCart = cartQuantity > 0;

  const showPlaceholder = !item.image || !imageReady || imageError;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePressCard}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.row,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        {/* ── Image ── */}
        <View
          style={[
            styles.imageWrap,
            {
              backgroundColor: colors.background.elevated,
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {/* Placeholder only while loading / on error / no image */}
          {showPlaceholder ? (
            <Image
              source={placeholder}
              style={styles.image}
              resizeMode="contain"
            />
          ) : null}

          {/* Real image */}
          {item.image && !imageError ? (
            <Image
              source={{ uri: item.image }}
              style={[
                styles.image,
                styles.realImageOverlay,
                { opacity: imageReady ? 1 : 0 },
              ]}
              resizeMode="contain"
              onLoad={() => setImageReady(true)}
              onError={() => setImageError(true)}
            />
          ) : null}
        </View>

        {/* ── Details ── */}
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.prescriptionRequired ? (
              <View
                style={[
                  styles.rxBadge,
                  {
                    backgroundColor: colors.status.warningBg,
                    borderColor: colors.status.warning,
                  },
                ]}
              >
                <Text
                  style={[styles.rxText, { color: colors.status.warning }]}
                >
                  Rx
                </Text>
              </View>
            ) : null}
          </View>

          {item.manufacturer ? (
            <Text
              style={[styles.mfr, { color: colors.text.faint }]}
              numberOfLines={1}
            >
              {item.manufacturer}
            </Text>
          ) : null}

          {item.packSize ? (
            <Text
              style={[styles.pack, { color: colors.text.muted }]}
              numberOfLines={1}
            >
              {item.packSize}
            </Text>
          ) : null}

          <View style={styles.bottom}>
            <View>
              <Text
                style={[styles.priceLabel, { color: colors.text.faint }]}
              >
                {hasRealPrice ? "Price" : "Approx."}
              </Text>
              <Text style={[styles.price, { color: colors.text.primary }]}>
                ₹{displayPrice}
              </Text>
            </View>

            {inCart ? (
              <View
                style={[styles.stepper, { borderColor: colors.brand.primary }]}
              >
                <TouchableOpacity
                  onPress={handleDecrement}
                  activeOpacity={0.7}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: colors.brand.primary },
                  ]}
                  accessibilityLabel="Decrease quantity"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name="remove"
                    size={14}
                    color={colors.brand.primaryText}
                  />
                </TouchableOpacity>

                <Text
                  style={[
                    styles.stepperCount,
                    { color: colors.brand.primary },
                  ]}
                >
                  {cartQuantity}
                </Text>

                <TouchableOpacity
                  onPress={handleIncrement}
                  activeOpacity={0.7}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: colors.brand.primary },
                  ]}
                  accessibilityLabel="Increase quantity"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={colors.brand.primaryText}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.8}
                style={[
                  styles.addBtn,
                  {
                    borderColor: colors.brand.primary,
                    backgroundColor: colors.background.card,
                  },
                ]}
                accessibilityLabel={`Add ${item.name} to cart`}
              >
                <Text
                  style={[styles.addBtnText, { color: colors.brand.primary }]}
                >
                  ADD
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
    ...Typography.bodyMedium,
    flex: 1,
    lineHeight: 20,
  },
  rxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: 2,
    flexShrink: 0,
  },
  rxText: {
    ...Typography.smallBold,
    fontSize: 10,
  },
  mfr: {
    ...Typography.caption,
  },
  pack: {
    ...Typography.caption,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  priceLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  price: {
    ...Typography.h4,
  },
  addBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  addBtnText: {
    ...Typography.smallMedium,
    letterSpacing: 0.8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    overflow: "hidden",
    minWidth: 96,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCount: {
    flex: 1,
    textAlign: "center",
    ...Typography.bodyMedium,
    fontSize: 14,
  },
});