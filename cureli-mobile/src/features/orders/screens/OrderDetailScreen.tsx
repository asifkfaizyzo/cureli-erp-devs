// src/features/orders/screens/OrderDetailScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { RatingBanner } from "../components/RatingBanner";
import { PriceRow } from "../components/PriceRow";
import { ordersApi } from "../../marketplace/api/orders.api";

interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ordersApi.getOrderDetail(orderId);
      setOrder(res.data.data);
    } catch (err) {
      console.error("[OrderDetailScreen] fetchDetail error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleCancel = useCallback(() => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await ordersApi.cancelOrder(orderId);
            fetchDetail(); // refresh after cancel
          } catch (err: any) {
            Alert.alert(
              "Cancel Failed",
              err.response?.data?.message || "Could not cancel order.",
            );
          }
        },
      },
    ]);
  }, [orderId, fetchDetail]);

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (!order) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <Text
            style={[
              styles.notFoundText,
              { color: colors.text.primary, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Order not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              style={{ color: brandColor, fontFamily: "Inter_600SemiBold" }}
            >
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header ─────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          Order Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Order Summary ───────────────────────── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.status.successBg },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.status.success}
              />
              <Text
                style={[
                  styles.summaryTitle,
                  {
                    color: colors.status.success,
                    fontFamily: "Inter_700Bold",
                  },
                ]}
              >
                {order.status}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryMeta,
                { color: colors.text.faint, fontFamily: "Inter_400Regular" },
              ]}
            >
              {order.order_number} · {order.items?.length ?? 0} item
              {(order.items?.length ?? 0) > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Item list */}
          {order.items?.map((item: any, index: number) => (
            <View key={item.variant_id ?? index}>
              {index > 0 && (
                <View
                  style={[
                    styles.itemDivider,
                    { backgroundColor: colors.border.subtle },
                  ]}
                />
              )}
              <View style={styles.itemRow}>
                <View
                  style={[
                    styles.itemImageWrap,
                    {
                      backgroundColor: colors.background.elevated,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.itemImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name="medkit-outline"
                      size={24}
                      color={colors.text.faint}
                    />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color: colors.text.primary,
                        fontFamily: "Inter_600SemiBold",
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.product_name}
                  </Text>
                  <Text
                    style={[
                      styles.itemBrand,
                      {
                        color: colors.text.faint,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                  >
                    {item.variant_name}
                  </Text>
                  <Text
                    style={[
                      styles.itemQty,
                      {
                        color: colors.text.muted,
                        fontFamily: "Inter_400Regular",
                      },
                    ]}
                  >
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.itemPrice,
                    {
                      color: colors.text.primary,
                      fontFamily: "Inter_700Bold",
                    },
                  ]}
                >
                  ₹{(item.unit_price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Rating Banner ───────────────────────── */}
        <RatingBanner submitted={false} ratingValue={null} onEdit={() => {}} />

        {/* ── Bill Details ────────────────────────── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            Bill Details
          </Text>

          <View style={styles.priceRows}>
            <PriceRow
              label="Items Total"
              value={`₹${order.total_amount?.toFixed(2) ?? "0.00"}`}
            />
            <View
              style={[
                styles.totalDivider,
                { borderTopColor: colors.border.default },
              ]}
            >
              <PriceRow
                label="Grand Total"
                value={`₹${order.total_amount?.toFixed(2) ?? "0.00"}`}
                isTotal
              />
            </View>
          </View>
        </View>

        {/* ── Order Metadata ──────────────────────── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            Order Details
          </Text>

          {[
            {
              icon: "receipt-outline",
              label: "Order ID",
              value: order.order_number,
            },
            {
              icon: "storefront-outline",
              label: "Branch",
              value: order.branch?.branch_name ?? "—",
            },
            {
              icon: "location-outline",
              label: "Address",
              value: order.delivery_address?.address_line ?? "—",
            },
            {
              icon: "time-outline",
              label: "Order Placed",
              value: order.placed_at
                ? new Date(order.placed_at).toLocaleString()
                : "—",
            },
          ].map((row) => (
            <View key={row.label} style={styles.metaRow}>
              <Ionicons
                name={row.icon as any}
                size={16}
                color={colors.text.muted}
              />
              <View style={styles.metaText}>
                <Text
                  style={[
                    styles.metaLabel,
                    {
                      color: colors.text.faint,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  {row.label}
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    {
                      color: colors.text.primary,
                      fontFamily: "Inter_500Medium",
                    },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom padding for sticky button */}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── Sticky Bottom Bar ───────────────────── */}
      <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.default,
          },
        ]}
      >
        {/* Show Cancel if order is still PLACED */}
        {order.status === "PLACED" ? (
          <TouchableOpacity
            style={[
              styles.repeatButton,
              { backgroundColor: colors.status.error ?? "#dc2626" },
            ]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color="#ffffff" />
            <Text style={[styles.repeatText, { fontFamily: "Inter_700Bold" }]}>
              Cancel Order
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.repeatButton, { backgroundColor: brandColor }]}
            onPress={() => router.push("/cart")}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={[styles.repeatText, { fontFamily: "Inter_700Bold" }]}>
              Repeat Order
            </Text>
          </TouchableOpacity>
        )}
        <Text
          style={[
            styles.cartNote,
            { color: colors.text.faint, fontFamily: "Inter_400Regular" },
          ]}
        >
          {order.status === "PLACED"
            ? "Only PLACED orders can be cancelled"
            : "Items will be added to your cart"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  summaryHeader: {
    gap: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  summaryTitle: {
    fontSize: 15,
  },
  summaryMeta: {
    fontSize: 13,
    paddingLeft: 2,
  },
  itemDivider: {
    height: 1,
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemImage: {
    width: 48,
    height: 48,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemBrand: {
    fontSize: 12,
  },
  itemQty: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 15,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  priceRows: {
    gap: 2,
  },
  totalDivider: {
    borderTopWidth: 1,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  metaText: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomPad: { height: 80 },
  stickyBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
  },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  repeatText: {
    fontSize: 15,
    color: "#ffffff",
  },
  cartNote: {
    fontSize: 11,
    textAlign: "center",
  },
  notFoundText: { fontSize: 16 },
});
