// Delivery ETA header + list of cart items with quantity controls.

import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { useCartStore, type CartItem } from "../../../store/cartStore";

// ── Quantity selector ─────────────────────────────────────────

function QuantitySelector({ item }: { item: CartItem }) {
  const { colors } = useTheme();
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrement = useCallback(() => {
    if (item.quantity === 1) {
      Alert.alert(
        "Remove Item",
        `Remove ${item.name} from cart?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => removeItem(item.variantId),
          },
        ],
      );
    } else {
      decrementItem(item.variantId);
    }
  }, [item, decrementItem, removeItem]);

  const handleIncrement = useCallback(() => {
    incrementItem(item.variantId);
  }, [item.variantId, incrementItem]);

  return (
    <View style={styles.qtySelector}>
      <TouchableOpacity
        onPress={handleDecrement}
        activeOpacity={0.8}
        style={styles.qtyBtn}
        accessibilityLabel="Decrease quantity"
      >
        <Text style={styles.qtyBtnText}>−</Text>
      </TouchableOpacity>

      <Text style={styles.qtyCount}>{item.quantity}</Text>

      <TouchableOpacity
        onPress={handleIncrement}
        activeOpacity={0.8}
        style={styles.qtyBtn}
        accessibilityLabel="Increase quantity"
      >
        <Text style={styles.qtyBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Cart item row ─────────────────────────────────────────────

function CartItemRow({ item }: { item: CartItem }) {
  const { colors } = useTheme();

  return (
    <View style={styles.itemRow}>
      {/* Image */}
      <View style={styles.imageBox}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name="medical-outline"
            size={24}
            color={colors.text.brand}
          />
        )}
      </View>

      {/* Details */}
      <View style={styles.itemDetails}>
        <Text
          style={[styles.itemName, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.manufacturer ? (
          <Text
            style={[styles.itemMeta, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {item.manufacturer}
          </Text>
        ) : null}
      </View>

      {/* Qty selector */}
      <QuantitySelector item={item} />
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────

export function DeliverySummaryCard() {
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons name="time-outline" size={20} color={colors.text.brand} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.eta, { color: colors.text.primary }]}>
            Delivery in 12 minutes
          </Text>
          <Text style={[styles.shipment, { color: colors.text.muted }]}>
            Shipment of {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

      {/* Items */}
      {items.map((item) => (
        <CartItemRow key={item.variantId} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  eta: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  shipment: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  imageBox: {
    width: 60,
    height: 60,
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#05015A",
    overflow: "hidden",
  },
  qtyBtn: {
    width: 26,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  qtyCount: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});