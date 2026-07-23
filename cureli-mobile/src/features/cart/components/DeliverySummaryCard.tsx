// src/features/cart/components/DeliverySummaryCard.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDialog } from '../../../components/Dialog/DialogProvider';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { Radius } from '../../../theme/radius';
import { getPlaceholder } from '../../../utils/placeholderImage';
import { useCartStore, type CartItem } from '../../../store/cartStore';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import { useDeliveryETA } from '../../../hooks/useDeliveryETA';

// ── Quantity selector ─────────────────────────────────────────

function QuantitySelector({ item }: { item: CartItem }) {
  const { colors } = useTheme();
  const { confirm: confirmDialog } = useDialog();
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrement = useCallback(async () => {
    if (item.quantity === 1) {
      const confirmed = await confirmDialog({
        title: 'Remove Item',
        message: `Remove ${item.name} from cart?`,
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        destructive: true,
      });

      if (confirmed) {
        removeItem(item.variantId);
      }
    } else {
      decrementItem(item.variantId);
    }
  }, [item, decrementItem, removeItem, confirmDialog]);

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

// ── Cart item image ───────────────────────────────────────────

function CartItemImage({ uri }: { uri: string | null }) {
  const { colors, isDark } = useTheme();
  const placeholder = getPlaceholder(isDark);
  const imageOpacity = useSharedValue(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [uri]);

  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageReady || imageError;

  return (
    <View
      style={[
        styles.imageBox,
        {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* Placeholder: only while real image is loading or errored */}
      {showPlaceholder ? (
        <Animated.Image
          source={placeholder}
          style={styles.image}
          resizeMode="contain"
        />
      ) : null}

      {/* Real image: loads invisibly, fades in, placeholder unmounts */}
      {uri && !imageError ? (
        <Animated.Image
          source={{ uri }}
          style={[styles.image, styles.realImageOverlay, realImageAnimatedStyle]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
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
      <CartItemImage uri={item.image ?? null} />

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

  const etaLine = (() => {
    if (isLoading) return null;
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

  const pharmacy = cartPharmacy();

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
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  realImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
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