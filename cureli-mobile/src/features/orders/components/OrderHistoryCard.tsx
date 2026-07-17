// src/features/orders/components/OrderHistoryCard.tsx

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { RemoteImage } from "../../../components/RemoteImage";
import {
  getStatusLabel,
  getStatusColorKey,
  getStatusIcon,
  getRejectionLabel,
  formatDeliveryDate,
  type StatusColorKey,
} from "../constants/orders.constants";
import type { MobileOrderSummary, MobileOrderItem } from "../../../types/order";

const MAX_VISIBLE_ITEMS = 3;

interface OrderHistoryCardProps {
  order: MobileOrderSummary;
  onOpen: () => void;
  onReorder: () => void;
}

function resolveStatusColors(
  colorKey: StatusColorKey,
  colors: any,
): { fg: string; bg: string } {
  switch (colorKey) {
    case "success":
      return { fg: colors.status.success, bg: colors.status.successBg };
    case "warning":
      return { fg: colors.status.warning, bg: colors.status.warningBg };
    case "error":
      return { fg: colors.status.error, bg: colors.status.errorBg };
    default:
      return { fg: colors.brand.primary, bg: colors.background.tint };
  }
}

function ItemRow({
  item,
  isLast,
  colors,
}: {
  item: MobileOrderItem;
  isLast: boolean;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.itemRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      {/*
        Medicine thumbnail.
        mode="medicine" → branded placeholder bottle image.
        Transparent PNG edges show background.elevated, not the placeholder.
      */}
      <RemoteImage
        uri={item.image_url ?? null}
        style={[
          styles.itemThumb,
          {
            backgroundColor: colors.background.elevated,
            borderColor: colors.border.subtle,
          },
        ]}
        resizeMode="contain"
        mode="medicine"
      />

      <View style={styles.itemDetails}>
        <Text
          style={[
            styles.itemName,
            { color: colors.text.primary, fontFamily: "Inter_600SemiBold" },
          ]}
          numberOfLines={1}
        >
          {item.medicine_name}
        </Text>
        {item.brand || item.pack_size ? (
          <Text
            style={[
              styles.itemSub,
              { color: colors.text.faint, fontFamily: "Inter_400Regular" },
            ]}
            numberOfLines={1}
          >
            {[item.brand, item.pack_size].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>

      <View style={styles.itemPriceCol}>
        <Text
          style={[
            styles.itemPrice,
            { color: colors.text.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          ₹{item.line_total.toFixed(0)}
        </Text>
        <Text
          style={[
            styles.itemQty,
            { color: colors.text.faint, fontFamily: "Inter_400Regular" },
          ]}
        >
          qty {item.quantity}
        </Text>
      </View>
    </View>
  );
}

export function OrderHistoryCard({
  order,
  onOpen,
  onReorder,
}: OrderHistoryCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const colorKey = getStatusColorKey(order.status);
  const { fg, bg } = resolveStatusColors(colorKey, colors);
  const iconName = getStatusIcon(order.status) as any;
  const statusLabel = getStatusLabel(order.status);

  const visibleItems = order.items.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = order.items.length - visibleItems.length;

  const displayDate =
    order.completed_at ??
    order.cancelled_at ??
    order.rejected_at ??
    order.placed_at;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
      onPress={onOpen}
      activeOpacity={0.95}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Ionicons name={iconName} size={13} color={fg} />
            <Text
              style={[
                styles.statusText,
                { color: fg, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
          <Text
            style={[
              styles.dateText,
              { color: colors.text.faint, fontFamily: "Inter_400Regular" },
            ]}
          >
            {formatDeliveryDate(displayDate)}
          </Text>
        </View>

        <View style={styles.centre}>
          <Text
            style={[
              styles.totalAmount,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            ₹{order.total_amount.toFixed(0)}
          </Text>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

      {/* Item rows */}
      <View style={styles.itemList}>
        {visibleItems.map((item, index) => (
          <ItemRow
            key={item.item_id}
            item={item}
            isLast={index === visibleItems.length - 1 && hiddenCount === 0}
            colors={colors}
          />
        ))}

        {hiddenCount > 0 && (
          <View
            style={[styles.moreRow, { borderTopColor: colors.border.subtle }]}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={14}
              color={colors.text.faint}
            />
            <Text
              style={[
                styles.moreText,
                { color: colors.text.faint, fontFamily: "Inter_400Regular" },
              ]}
            >
              +{hiddenCount} more item{hiddenCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Rejection reason */}
      {order.status === "REJECTED" && order.rejection_reason ? (
        <>
          <View
            style={[styles.divider, { backgroundColor: colors.border.subtle }]}
          />
          <View
            style={[
              styles.rejectionBanner,
              { backgroundColor: colors.status.errorBg },
            ]}
          >
            <Ionicons
              name="close-circle-outline"
              size={13}
              color={colors.status.error}
            />
            <Text
              style={[
                styles.rejectionText,
                { color: colors.status.error, fontFamily: "Inter_400Regular" },
              ]}
            >
              {getRejectionLabel(order.rejection_reason)}
            </Text>
          </View>
        </>
      ) : null}

      {/* Footer */}
      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />
      <View style={styles.footer}>
        <Text
          style={[
            styles.orderNumber,
            { color: colors.text.disabled, fontFamily: "Inter_400Regular" },
          ]}
        >
          {order.order_number}
        </Text>

        {order.shop_name ? (
          <Text
            style={[
              styles.shopName,
              { color: colors.text.faint, fontFamily: "Inter_400Regular" },
            ]}
            numberOfLines={1}
          >
            {order.shop_name}
          </Text>
        ) : null}

        {order.status === "COMPLETED" ? (
          <TouchableOpacity
            style={styles.reorderBtn}
            onPress={onReorder}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={13} color={brandColor} />
            <Text
              style={[
                styles.reorderText,
                { color: brandColor, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              Reorder
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  topLeft: { flex: 1, gap: 4 },
  centre: { alignItems: "center", justifyContent: "center", gap: 6 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12 },
  dateText: { fontSize: 11 },
  totalAmount: { fontSize: 17 },
  divider: { height: 1 },
  itemList: { paddingHorizontal: 14, paddingVertical: 4 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  // RemoteImage receives this as its style prop — controls size/shape
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 0,
  },
  itemDetails: { flex: 1, gap: 3 },
  itemName: { fontSize: 13, lineHeight: 18 },
  itemSub: { fontSize: 11 },
  itemPriceCol: { alignItems: "flex-end", gap: 2, flexShrink: 0 },
  itemPrice: { fontSize: 13 },
  itemQty: { fontSize: 11 },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  moreText: { fontSize: 12 },
  rejectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rejectionText: { fontSize: 12, flex: 1 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  orderNumber: { fontSize: 11 },
  shopName: { fontSize: 11, flex: 1, textAlign: "center" },
  reorderBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  reorderText: { fontSize: 12 },
});