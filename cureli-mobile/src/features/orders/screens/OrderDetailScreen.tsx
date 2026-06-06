// src/features/orders/screens/OrderDetailScreen.tsx
// Changes:
//   - SSE polling via orderNotificationStore
//   - 30s interval polling for non-terminal orders as fallback
//   - Prescription section with signed URL + expiry handling
//   - Customer notes displayed in Order Info
//   - Rejection reason uses getRejectionLabel helper
//   - Reorder uses bottom sheet via ReorderSheet
//   - onDelete removed

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { useTheme } from '../../../theme/ThemeContext';
import { PriceRow } from '../components/PriceRow';
import { ReorderSheet } from '../components/ReorderSheet';
import { ordersApi } from '../../marketplace/api/orders.api';
import { useOrderNotificationStore } from '../../../store/orderNotificationStore';
import {
  getStatusLabel,
  getStatusColorKey,
  getStatusIcon,
  getRejectionLabel,
  formatDeliveryDate,
} from '../constants/orders.constants';
import type {
  MobileOrderDetail,
  MobileOrderPrescription,
  ReorderItemsResponse,
} from '../../../types/order';

// ── Terminal statuses — no polling needed once reached ────────────────────────
const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'REJECTED']);

// ── Prescription row ──────────────────────────────────────────────────────────

interface PrescriptionRowProps {
  prescription: MobileOrderPrescription;
  orderId:      string;
  colors:       any;
}

function PrescriptionRow({ prescription, orderId, colors }: PrescriptionRowProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = useCallback(async () => {
    if (prescription.is_expired) return;

    setIsLoading(true);
    try {
      const res = await ordersApi.getPrescriptionUrl(orderId, prescription.prescription_id);
      const url = res.data?.data?.url;
      if (url) {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 410) {
        Alert.alert('Expired', 'This prescription file has been deleted from our servers.');
      } else {
        Alert.alert('Error', 'Could not open prescription. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [prescription, orderId]);

  const isPdf     = prescription.mime_type === 'application/pdf';
  const iconName  = isPdf ? 'document-outline' : 'image-outline';
  const isExpired = prescription.is_expired;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isExpired || isLoading}
      activeOpacity={isExpired ? 1 : 0.7}
      style={[
        styles.prescriptionRow,
        {
          backgroundColor: isExpired
            ? colors.background.elevated
            : colors.background.tint,
          borderColor: colors.border.subtle,
          opacity: isExpired ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons
        name={iconName as any}
        size={18}
        color={isExpired ? colors.text.disabled : colors.text.brand}
      />
      <Text
        style={[
          styles.prescriptionName,
          {
            color:      isExpired ? colors.text.disabled : colors.text.secondary,
            fontFamily: 'Inter_400Regular',
            flex:       1,
          },
        ]}
        numberOfLines={1}
      >
        {prescription.original_name}
      </Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.text.brand} />
      ) : isExpired ? (
        <Text
          style={[
            styles.expiredLabel,
            { color: colors.text.disabled, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Expired
        </Text>
      ) : (
        <Ionicons name="open-outline" size={15} color={colors.text.brand} />
      )}
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface OrderDetailScreenProps {
  orderId: string;
}

export function OrderDetailScreen({ orderId }: OrderDetailScreenProps) {
  const { colors, isDark } = useTheme();
  const brandColor         = isDark ? colors.brand.accent : colors.brand.primary;

  const lastStatusUpdate    = useOrderNotificationStore((s) => s.lastStatusUpdate);
  const clearLastStatusUpdate = useOrderNotificationStore((s) => s.clearLastStatusUpdate);

  const [order,      setOrder]      = useState<MobileOrderDetail | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [reorderSheetVisible, setReorderSheetVisible] = useState(false);
  const [reorderData, setReorderData] = useState<ReorderItemsResponse | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await ordersApi.getOrderDetail(orderId);
      setOrder(res.data.data);
    } catch (err) {
      console.error('[OrderDetailScreen] fetchDetail error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // SSE-triggered refresh — fires when pharmacy changes status
  useEffect(() => {
    if (!lastStatusUpdate)                       return;
    if (lastStatusUpdate.order_id !== orderId)   return;

    fetchDetail();
    clearLastStatusUpdate();
  }, [lastStatusUpdate, orderId, fetchDetail, clearLastStatusUpdate]);

  // Polling fallback — 30s interval for non-terminal orders
  // Handles cases where SSE connection is absent (app just foregrounded,
  // SSE reconnect in progress, etc.)
  useEffect(() => {
    if (!order) return;

    // Clear any existing interval first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Only poll for active (non-terminal) orders
    if (TERMINAL_STATUSES.has(order.status)) return;

    pollingIntervalRef.current = setInterval(() => {
      fetchDetail();
    }, 30_000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [order?.status, fetchDetail]);

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text:  'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersApi.cancelOrder(orderId);
              fetchDetail();
            } catch (err: any) {
              Alert.alert(
                'Cancel Failed',
                err.response?.data?.message || 'Could not cancel order.',
              );
            }
          },
        },
      ],
    );
  }, [orderId, fetchDetail]);

  // ── Reorder ───────────────────────────────────────────────────────────────
  const handleReorder = useCallback(async () => {
    setReorderLoading(true);
    try {
      const res = await ordersApi.getReorderItems(orderId);
      const data: ReorderItemsResponse = res.data.data;

      if (data.available.length === 0 && data.unavailable.length > 0) {
        // Nothing available at all — show simple alert
        Alert.alert(
          'Items Unavailable',
          'None of the items from this order are currently available at this pharmacy.',
        );
        return;
      }

      setReorderData(data);
      setReorderSheetVisible(true);
    } catch (err) {
      console.error('[OrderDetailScreen] getReorderItems error:', err);
      Alert.alert('Error', 'Could not load reorder information. Please try again.');
    } finally {
      setReorderLoading(false);
    }
  }, [orderId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.centered}>
          <Text style={[styles.notFoundText, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
            Order not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: brandColor, fontFamily: 'Inter_600SemiBold' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const colorKey   = getStatusColorKey(order.status);
  const statusIcon = getStatusIcon(order.status) as any;
  const statusLabel = getStatusLabel(order.status);

  const statusFg =
    colorKey === 'success' ? colors.status.success :
    colorKey === 'error'   ? colors.status.error   :
    colorKey === 'warning' ? colors.status.warning :
    colors.brand.primary;

  const statusBg =
    colorKey === 'success' ? colors.status.successBg :
    colorKey === 'error'   ? colors.status.errorBg   :
    colorKey === 'warning' ? colors.status.warningBg :
    colors.background.tint;

  const addr        = order.delivery_address;
  const addressLine = addr
    ? [
        addr.address_line_1,
        addr.address_line_2,
        addr.landmark,
        addr.city,
        addr.state,
        addr.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : '—';

  const isTerminal = TERMINAL_STATUSES.has(order.status);

  // Order Info rows — includes notes when present
  const orderInfoRows = [
    { icon: 'receipt-outline',    label: 'Order ID',           value: order.order_number              },
    { icon: 'storefront-outline', label: 'Shop',               value: order.shop_name ?? '—'         },
    { icon: 'git-branch-outline', label: 'Branch',             value: order.branch_name ?? '—'       },
    { icon: 'location-outline',   label: 'Delivery Address',   value: addressLine                     },
    { icon: 'wallet-outline',     label: 'Payment',            value: order.payment_method            },
    { icon: 'time-outline',       label: 'Order Placed',       value: formatDeliveryDate(order.placed_at) },
    ...(order.notes
      ? [{ icon: 'chatbubble-outline', label: 'Delivery Instructions', value: order.notes }]
      : []),
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:   colors.background.card,
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
        <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
          Order Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
          <View style={styles.summaryHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Ionicons name={statusIcon} size={16} color={statusFg} />
              <Text style={[styles.statusBadgeText, { color: statusFg, fontFamily: 'Inter_700Bold' }]}>
                {statusLabel}
              </Text>
            </View>

            <Text style={[styles.summaryMeta, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
              {order.order_number} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </Text>

            {/* Rejection reason */}
            {order.status === 'REJECTED' && order.rejection_reason ? (
              <View style={[styles.rejectionBanner, { backgroundColor: colors.status.errorBg }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.status.error} />
                <Text style={[styles.rejectionText, { color: colors.status.error, fontFamily: 'Inter_400Regular' }]}>
                  Reason:{' '}
                  {order.rejection_reason_other
                    ? order.rejection_reason_other
                    : getRejectionLabel(order.rejection_reason)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Item list */}
          {order.items.map((item, index) => (
            <View key={item.item_id}>
              {index > 0 && (
                <View style={[styles.itemDivider, { backgroundColor: colors.border.subtle }]} />
              )}
              <View style={styles.itemRow}>
                <View
                  style={[
                    styles.itemImageWrap,
                    { backgroundColor: colors.background.elevated, borderColor: colors.border.subtle },
                  ]}
                >
                  <Ionicons name="medkit-outline" size={24} color={colors.text.faint} />
                </View>
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemName, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}
                    numberOfLines={2}
                  >
                    {item.medicine_name}
                  </Text>
                  {item.brand ? (
                    <Text style={[styles.itemBrand, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
                      {item.brand}{item.pack_size ? ` · ${item.pack_size}` : ''}
                    </Text>
                  ) : null}
                  <Text style={[styles.itemQty, { color: colors.text.muted, fontFamily: 'Inter_400Regular' }]}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
                  ₹{item.line_total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Prescriptions */}
        {order.prescriptions.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
            <Text style={[styles.cardTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
              Prescriptions
            </Text>
            <View style={styles.prescriptionList}>
              {order.prescriptions.map((p) => (
                <PrescriptionRow
                  key={p.prescription_id}
                  prescription={p}
                  orderId={orderId}
                  colors={colors}
                />
              ))}
            </View>
            {order.prescriptions.some((p) => p.is_expired) && (
              <Text style={[styles.prescriptionExpiredNote, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
                Expired files are deleted from our servers after the order is resolved.
              </Text>
            )}
          </View>
        )}

        {/* Bill Details */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
          <Text style={[styles.cardTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
            Bill Details
          </Text>
          <View style={styles.priceRows}>
            <PriceRow label="Items Total" value={`₹${order.subtotal.toFixed(2)}`} />
            <PriceRow label="Delivery"    value="Free" />
            <View style={[styles.totalDivider, { borderTopColor: colors.border.default }]}>
              <PriceRow label="Grand Total" value={`₹${order.total_amount.toFixed(2)}`} isTotal />
            </View>
          </View>
        </View>

        {/* Order Info */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
          <Text style={[styles.cardTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
            Order Info
          </Text>
          {orderInfoRows.map((row) => (
            <View key={row.label} style={styles.metaRow}>
              <Ionicons name={row.icon as any} size={16} color={colors.text.muted} />
              <View style={styles.metaText}>
                <Text style={[styles.metaLabel, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
                  {row.label}
                </Text>
                <Text style={[styles.metaValue, { color: colors.text.primary, fontFamily: 'Inter_500Medium' }]}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Status Timeline */}
        {order.status_history.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
            <Text style={[styles.cardTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
              Order Timeline
            </Text>
            {order.status_history.map((entry, index) => (
              <View key={index} style={styles.timelineRow}>
                <View style={styles.timelineDotWrap}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor:
                          index === order.status_history.length - 1
                            ? brandColor
                            : colors.border.default,
                      },
                    ]}
                  />
                  {index < order.status_history.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.border.subtle }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStatus, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
                    {getStatusLabel(entry.to_status)}
                  </Text>
                  <Text style={[styles.timelineDate, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
                    {formatDeliveryDate(entry.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.stickyBar,
          { backgroundColor: colors.background.card, borderTopColor: colors.border.default },
        ]}
      >
        {order.status === 'PLACED' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.status.error ?? '#dc2626' }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color="#ffffff" />
              <Text style={[styles.actionButtonText, { fontFamily: 'Inter_700Bold' }]}>
                Cancel Order
              </Text>
            </TouchableOpacity>
            <Text style={[styles.actionNote, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
              You can only cancel before the pharmacy accepts
            </Text>
          </>
        ) : order.status === 'COMPLETED' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: brandColor, opacity: reorderLoading ? 0.7 : 1 }]}
              onPress={handleReorder}
              disabled={reorderLoading}
              activeOpacity={0.8}
            >
              {reorderLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#ffffff" />
              )}
              <Text style={[styles.actionButtonText, { fontFamily: 'Inter_700Bold' }]}>
                Reorder
              </Text>
            </TouchableOpacity>
            <Text style={[styles.actionNote, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
              Items will be added to your cart for review
            </Text>
          </>
        ) : (
          <View style={styles.statusInfoBar}>
            <Ionicons name={statusIcon} size={16} color={statusFg} />
            <Text style={[styles.statusInfoText, { color: statusFg, fontFamily: 'Inter_500Medium' }]}>
              {statusLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Reorder bottom sheet */}
      {reorderData && (
        <ReorderSheet
          visible={reorderSheetVisible}
          data={reorderData}
          onClose={() => {
            setReorderSheetVisible(false);
            setReorderData(null);
          }}
          onConfirm={() => {
            setReorderSheetVisible(false);
            setReorderData(null);
            router.push('/cart' as any);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16 },

  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
  },
  backButton:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, marginBottom: 4 },

  summaryHeader: { gap: 6 },
  statusBadge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    alignSelf:     'flex-start',
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:  20,
  },
  statusBadgeText: { fontSize: 14 },
  summaryMeta:     { fontSize: 13, paddingLeft: 2 },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    paddingHorizontal: 10,
    paddingVertical:   8,
    borderRadius:  8,
    marginTop:     4,
  },
  rejectionText: { fontSize: 13, flex: 1 },

  itemDivider: { height: 1, marginVertical: 10 },
  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImageWrap: {
    width:          56,
    height:         56,
    borderRadius:   10,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  itemInfo:  { flex: 1, gap: 3 },
  itemName:  { fontSize: 14, lineHeight: 20 },
  itemBrand: { fontSize: 12 },
  itemQty:   { fontSize: 12 },
  itemPrice: { fontSize: 15, flexShrink: 0 },

  // Prescriptions
  prescriptionList: { gap: 8 },
  prescriptionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderRadius:   10,
    borderWidth:    1,
  },
  prescriptionName:     { fontSize: 13 },
  expiredLabel:         { fontSize: 11 },
  prescriptionExpiredNote: { fontSize: 11, lineHeight: 16, marginTop: 4 },

  priceRows:    { gap: 2 },
  totalDivider: { borderTopWidth: 1, marginTop: 6 },

  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  metaText:  { flex: 1, gap: 2 },
  metaLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, lineHeight: 18 },

  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineDotWrap: { alignItems: 'center', width: 12 },
  timelineDot:     { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine:    { width: 2, flex: 1, minHeight: 20, marginVertical: 3 },
  timelineContent: { flex: 1, paddingBottom: 14, gap: 2 },
  timelineStatus:  { fontSize: 13 },
  timelineDate:    { fontSize: 12 },

  bottomPad: { height: 80 },
  stickyBar: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 6 },
  actionButton: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 14,
    borderRadius:   12,
  },
  actionButtonText: { fontSize: 15, color: '#ffffff' },
  actionNote:       { fontSize: 11, textAlign: 'center' },
  statusInfoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  statusInfoText: { fontSize: 14 },
});