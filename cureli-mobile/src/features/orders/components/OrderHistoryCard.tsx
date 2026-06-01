// src/features/orders/components/OrderHistoryCard.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { RatingBanner } from './RatingBanner';
import { formatDeliveryDate } from '../constants/orders.constants';
import type { DispensedOrder } from '../../../types/order';

interface OrderHistoryCardProps {
  order: DispensedOrder;
  onOpen: () => void;
  onReorder: () => void;
  onDelete: () => void;
}

export function OrderHistoryCard({
  order,
  onOpen,
  onReorder,
  onDelete,
}: OrderHistoryCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;
  const firstItem = order.items[0];
  const extraCount = order.items.length - 1;

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
      {/* ── Order Header ─────────────────────────────── */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          {/* Success badge */}
          <View
            style={[
              styles.successBadge,
              { backgroundColor: colors.status.successBg },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.status.success}
            />
            <Text
              style={[
                styles.arrivedText,
                {
                  color: colors.status.success,
                  fontFamily: 'Inter_600SemiBold',
                },
              ]}
            >
              Arrived in {order.arrivedInMinutes} mins
            </Text>
          </View>

          <Text
            style={[
              styles.dateText,
              { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {formatDeliveryDate(order.deliveredAt)}
          </Text>
        </View>

        <View style={styles.orderHeaderRight}>
          <Text
            style={[
              styles.amountText,
              { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
            ]}
          >
            ₹{order.bill.billTotal}
          </Text>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="trash-outline"
              size={15}
              color={colors.text.faint}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Product Preview ───────────────────────── */}
      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border.subtle },
        ]}
      />
      <View style={styles.productPreview}>
        <View style={styles.imageRow}>
          {/* Show up to 3 product images */}
          {order.items.slice(0, 3).map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.imageWrapper,
                {
                  backgroundColor: colors.background.elevated,
                  borderColor: colors.border.subtle,
                  marginLeft: index > 0 ? -8 : 0,
                  zIndex: 3 - index,
                },
              ]}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name="medkit-outline"
                  size={20}
                  color={colors.text.faint}
                />
              )}
            </View>
          ))}
          {/* Extra count badge */}
          {extraCount > 0 && (
            <View
              style={[
                styles.extraBadge,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Text
                style={[
                  styles.extraText,
                  { color: colors.text.muted, fontFamily: 'Inter_600SemiBold' },
                ]}
              >
                +{extraCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text
            style={[
              styles.itemName,
              { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' },
            ]}
            numberOfLines={1}
          >
            {firstItem.name}
          </Text>
          <Text
            style={[
              styles.itemMeta,
              { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
            ]}
            numberOfLines={1}
          >
            {order.items.length} item{order.items.length > 1 ? 's' : ''}
            {firstItem.packSize ? ` · ${firstItem.packSize}` : ''}
          </Text>
        </View>
      </View>

      {/* ── Rating Banner ──────────────────────────── */}
      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border.subtle },
        ]}
      />
      <RatingBanner
        submitted={order.ratingSubmitted}
        ratingValue={order.ratingValue}
        onEdit={() => {}}
        compact
      />

      {/* ── Reorder Footer ──────────────────────────── */}
      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border.subtle },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.reorderButton,
          { backgroundColor: colors.background.tint },
        ]}
        onPress={onReorder}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={16} color={brandColor} />
        <Text
          style={[
            styles.reorderText,
            { color: brandColor, fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          Reorder
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
  },
  orderHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  arrivedText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  amountText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 40,
    height: 40,
  },
  extraBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  extraText: {
    fontSize: 11,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 14,
  },
  itemMeta: {
    fontSize: 12,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  reorderText: {
    fontSize: 14,
  },
});