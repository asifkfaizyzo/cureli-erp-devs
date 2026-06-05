// src/features/cart/components/DeliverySummaryCard.tsx

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCartStore, type CartItem } from '../../../store/cartStore';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import { useDeliveryETA } from '../../../hooks/useDeliveryETA';

// ── Quantity selector ─────────────────────────────────────────

function QuantitySelector({ item }: { item: CartItem }) {
  const { colors } = useTheme();
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrement = useCallback(() => {
    if (item.quantity === 1) {
      Alert.alert(
        'Remove Item',
        `Remove ${item.name} from cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
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
    <View
      style={[styles.qtySelector, { backgroundColor: colors.brand.primary }]}
    >
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
  const lineTotal = item.pricePerUnit * item.quantity;

  return (
    <View style={styles.itemRow}>
      {/* Image */}
      <View
        style={[
          styles.imageBox,
          { backgroundColor: colors.background.tint },
        ]}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name="medical-outline"
            size={22}
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

        {/* Price row — shown below name/manufacturer */}
        <View style={styles.itemPriceRow}>
          <Text style={[styles.itemUnitPrice, { color: colors.text.faint }]}>
            ₹{item.pricePerUnit} × {item.quantity}
          </Text>
          <Text
            style={[styles.itemLineTotal, { color: colors.text.primary }]}
          >
            ₹{lineTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Qty selector */}
      <QuantitySelector item={item} />
    </View>
  );
}

// ── ETA header ────────────────────────────────────────────────

function ETAHeader({
  itemCount,
  durationText,
  distanceText,
  isLoading,
}: {
  itemCount: number;
  durationText: string | null;
  distanceText: string | null;
  isLoading: boolean;
}) {
  const { colors } = useTheme();

  // Build the ETA display string
  const etaLine = (() => {
    if (isLoading) return null; // spinner shown instead
    if (durationText) return `Delivery in ${durationText}`;
    return 'Estimating delivery time…';
  })();

  const subtitleLine = (() => {
    const base =
      itemCount === 1 ? '1 item' : `${itemCount} items`;
    if (distanceText && durationText) return `${base} · ${distanceText} away`;
    return base;
  })();

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.background.tint },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size={18} color={colors.text.brand} />
        ) : (
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.text.brand}
          />
        )}
      </View>
      <View style={styles.headerText}>
        <Text style={[styles.eta, { color: colors.text.primary }]}>
          {etaLine ?? 'Calculating…'}
        </Text>
        <Text style={[styles.shipment, { color: colors.text.muted }]}>
          {subtitleLine}
        </Text>
      </View>
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────

export function DeliverySummaryCard() {
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);
  const cartPharmacy = useCartStore((s) => s.cartPharmacy);
  const location = useDeliveryLocationStore((s) => s.location);

  // Branch coordinates come from the cart pharmacy.
  // We don't store branch coordinates on CartItem directly — they live
  // in the shop profile. For now we use the delivery location coordinates
  // as origin and would need branch lat/lng as destination.
  //
  // What we have available:
  //   - user location: location.latitude, location.longitude
  //   - branch: we only have shopId/branchId on CartItem, not coordinates
  //
  // The branch coordinates ARE returned by the shop profile API but we
  // don't cache them in the cart store. The simplest approach without
  // adding a new API call: use the distance from deliveryLocationStore
  // if available (set when user picked their location near a shop).
  //
  // For a future improvement: store branchLat/branchLng on CartItem.
  // For now: if we have user location but no branch coords, we show
  // the ETA spinner briefly then fall back to null (no ETA shown).
  //
  // The pharmacy object from cartPharmacy() only has shopId/branchId/names.
  // We need to extend CartItem or make a separate lookup to get branch coords.
  // Decision: extend CartItem with optional branchLatitude/branchLongitude.
  // This is a one-line change in the store and the shop screen addItem call.

  const pharmacy = cartPharmacy();

  // Read branch coordinates from the first cart item if available.
  // We will add these fields to CartItem in cartStore.ts below.
  const firstItem = items[0] as (CartItem & {
    branchLatitude?: number | null;
    branchLongitude?: number | null;
  }) | undefined;

  const branchLat = firstItem?.branchLatitude ?? null;
  const branchLng = firstItem?.branchLongitude ?? null;
  const userLat = location.latitude;
  const userLng = location.longitude;

  const { durationText, distanceText, isLoading: etaLoading } =
    useDeliveryETA(userLat, userLng, branchLat, branchLng);

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <ETAHeader
        itemCount={items.length}
        durationText={durationText}
        distanceText={distanceText}
        isLoading={etaLoading}
      />

      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

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
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  eta: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  shipment: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingRight: 4,
  },
  itemUnitPrice: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  itemLineTotal: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 82,
    height: 30,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  qtyBtn: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  qtyCount: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});