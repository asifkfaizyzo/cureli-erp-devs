// cureli-mobile/src/features/marketplace/components/shop/MedicineRow.tsx
//
// Individual medicine row on the mobile shop page.
// Supports branch-closed states.

import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import { RemoteImage } from "../../../../components/RemoteImage";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { EnrichedBranchMedicine } from "../../hooks/useShopMedicines";

export interface MedicineRowProps {
  item: EnrichedBranchMedicine;
  onAdd: (item: EnrichedBranchMedicine) => void;
  onIncrement: (item: EnrichedBranchMedicine) => void;
  onDecrement: (item: EnrichedBranchMedicine) => void;
  cartQuantity: number;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  isBranchClosed?: boolean; // ◄◄ Explicitly declared optional prop
}

export function MedicineRow({
  item,
  onAdd,
  onIncrement,
  onDecrement,
  cartQuantity,
  colors,
  isDark,
  isBranchClosed = false,
}: MedicineRowProps) {
  const handleAdd = useCallback(() => {
    if (!isBranchClosed) onAdd(item);
  }, [onAdd, item, isBranchClosed]);

  const handleIncrement = useCallback(() => {
    if (!isBranchClosed) onIncrement(item);
  }, [onIncrement, item, isBranchClosed]);

  const handleDecrement = useCallback(() => {
    if (!isBranchClosed) onDecrement(item);
  }, [onDecrement, item, isBranchClosed]);

  const inCart = cartQuantity > 0;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.background.card,
          borderBottomColor: colors.border.subtle,
          // Visually dim item card if branch is offline
          opacity: isBranchClosed ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.leftCol}>
        <RemoteImage
          uri={item.image ?? null}
          style={[styles.thumbnail, { backgroundColor: colors.background.tint }]}
          resizeMode="cover"
          mode="medicine"
          fallbackIcon="medical"
          fallbackIconSize={24}
          fallbackIconColor={colors.text.brand}
        />
      </View>

      <View style={styles.midCol}>
        <Text
          style={[styles.name, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {item.brand ? (
          <Text style={[styles.brand, { color: colors.text.secondary }]}>
            {item.brand}
          </Text>
        ) : null}

        {item.packSize ? (
          <Text style={[styles.pack, { color: colors.text.muted }]}>
            {item.packSize}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.text.primary }]}>
            ₹{item.listingPrice ?? item.marketplace.startsAt}
          </Text>
          {/* {item.requiresPrescription ? (
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
      </View>

      <View style={styles.rightCol}>
        {isBranchClosed ? (
          <View
            style={[
              styles.closedTag,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Text style={[styles.closedTagText, { color: colors.text.muted }]}>
              CLOSED
            </Text>
          </View>
        ) : inCart ? (
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
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="remove" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              style={[styles.stepperCount, { color: colors.brand.primary }]}
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
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.8}
            style={[styles.addBtn, { borderColor: colors.brand.primary }]}
          >
            <Text style={[styles.addBtnText, { color: colors.brand.primary }]}>
              ADD
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  leftCol: {
    justifyContent: "flex-start",
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  midCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...Typography.bodyMedium,
    lineHeight: 19,
  },
  brand: {
    ...Typography.caption,
  },
  pack: {
    ...Typography.small,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  price: {
    ...Typography.bodySemiBold,
  },
  rxBadge: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rxText: {
    ...Typography.caption,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  rightCol: {
    justifyContent: "center",
    alignItems: "flex-end",
    minWidth: 80,
  },
  addBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  addBtnText: {
    ...Typography.smallMedium,
    letterSpacing: 0.8,
  },
  closedTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  closedTagText: {
    ...Typography.smallMedium,
    letterSpacing: 0.8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    overflow: "hidden",
    minWidth: 84,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCount: {
    flex: 1,
    textAlign: "center",
    ...Typography.bodyMedium,
    fontSize: 12,
  },
});