// src/features/orders/screens/OrderDetailScreen.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { RatingBanner } from '../components/RatingBanner';
import { PriceRow } from '../components/PriceRow';
import {
  MOCK_ORDERS,
  formatDeliveryDate,
  formatTime,
} from '../constants/orders.constants';

interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const order = MOCK_ORDERS.find((o) => o.id === orderId);

  if (!order) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.notFound}>
          <Text
            style={[
              styles.notFoundText,
              { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Order not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: brandColor, fontFamily: 'Inter_600SemiBold' }}>
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
      edges={['top']}
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
            { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
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
                styles.successBadge,
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
                    fontFamily: 'Inter_700Bold',
                  },
                ]}
              >
                Dispensed
              </Text>
            </View>
            <Text
              style={[
                styles.summaryMeta,
                { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
              ]}
            >
              Arrived at {formatTime(order.deliveredAt)} ·{' '}
              {order.items.length} item{order.items.length > 1 ? 's' : ''}
            </Text>
          </View>

          {/* Item list */}
          {order.items.map((item, index) => (
            <View key={item.id}>
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
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
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
                        fontFamily: 'Inter_600SemiBold',
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemBrand,
                      {
                        color: colors.text.faint,
                        fontFamily: 'Inter_400Regular',
                      },
                    ]}
                  >
                    {[item.brand, item.packSize].filter(Boolean).join(' · ')}
                  </Text>
                  <Text
                    style={[
                      styles.itemQty,
                      {
                        color: colors.text.muted,
                        fontFamily: 'Inter_400Regular',
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
                      fontFamily: 'Inter_700Bold',
                    },
                  ]}
                >
                  ₹{item.totalPrice}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Rating Banner ───────────────────────── */}
        <RatingBanner
          submitted={order.ratingSubmitted}
          ratingValue={order.ratingValue}
          onEdit={() => {}}
        />

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
              { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
            ]}
          >
            Bill Details
          </Text>

          <View style={styles.priceRows}>
            <PriceRow label="MRP" value={`₹${order.bill.mrp}`} />
            <PriceRow
              label="Discount"
              value={`-₹${order.bill.discount}`}
              isDiscount
            />
            <PriceRow label="Item Total" value={`₹${order.bill.itemTotal}`} />
            <PriceRow
              label="Handling Fee"
              value={
                order.bill.handlingFee === 0
                  ? 'FREE'
                  : `₹${order.bill.handlingFee}`
              }
            />
            <PriceRow
              label="Delivery Fee"
              value={
                order.bill.deliveryFee === 0
                  ? 'FREE'
                  : `₹${order.bill.deliveryFee}`
              }
            />
            <View
              style={[
                styles.totalDivider,
                { borderTopColor: colors.border.default },
              ]}
            >
              <PriceRow
                label="Bill Total"
                value={`₹${order.bill.billTotal}`}
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
              { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
            ]}
          >
            Order Details
          </Text>

          {[
            { icon: 'receipt-outline', label: 'Order ID', value: order.id },
            { icon: 'card-outline', label: 'Payment', value: order.paymentMethod },
            { icon: 'location-outline', label: 'Address', value: order.addressLine },
            { icon: 'time-outline', label: 'Order Placed', value: formatDeliveryDate(order.placedAt) },
            { icon: 'checkmark-done-outline', label: 'Delivered', value: formatDeliveryDate(order.deliveredAt) },
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
                      fontFamily: 'Inter_400Regular',
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
                      fontFamily: 'Inter_500Medium',
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

      {/* ── Sticky Repeat Order Button ──────────── */}
      <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.repeatButton, { backgroundColor: brandColor }]}
          onPress={() => router.push('/cart')}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={18} color="#ffffff" />
          <Text
            style={[styles.repeatText, { fontFamily: 'Inter_700Bold' }]}
          >
            Repeat Order
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.cartNote,
            { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Items will be added to your cart
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  metaText: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  repeatText: {
    fontSize: 15,
    color: '#ffffff',
  },
  cartNote: {
    fontSize: 11,
    textAlign: 'center',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: { fontSize: 16 },
});