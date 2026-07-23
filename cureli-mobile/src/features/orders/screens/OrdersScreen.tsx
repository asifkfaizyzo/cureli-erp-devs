// src/features/orders/screens/OrdersScreen.tsx
//
// Changes in this version:
//   - isActivePrescription() helper fixes the FULLY_RESPONDED + quoted_count
//     bug where "all pharmacies declined" was wrongly counted as active
//   - Count bubbles on inner segmented tab labels
//     · Orders tab    → red bubble    (PLACED / ACCEPTED / READY_FOR_PICKUP)
//     · Prescriptions → brand bubble  (PENDING / PARTIALLY_RESPONDED /
//                                      FULLY_RESPONDED with quoted_count > 0)
//   - Bubbles always visible until every active item resolves
//   - No changes to badge store or layout

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView }           from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons }               from '@expo/vector-icons';

import { useTheme }                    from '../../../theme/ThemeContext';
import { OrderHistoryCard }            from '../components/OrderHistoryCard';
import { PrescriptionRequestCard }     from '../components/PrescriptionRequestCard';
import type {
  PrescriptionRequestSummary,
}                                      from '../components/PrescriptionRequestCard';
import { ordersApi }                   from '../../marketplace/api/orders.api';
import { useLayoutStore }              from '../../../store/layoutStore';
import { useOrderNotificationStore }   from '../../../store/orderNotificationStore';
import { useTabBadgeStore }            from '../../../store/tabBadgeStore';
import { usePrescriptionRequestStore } from '../../../store/prescriptionRequestStore';
import { usePrescriptionRequests }     from '../../prescription-request/hooks/usePrescriptionRequest';
import { Spacing }                     from '../../../theme/spacing';
import { Radius }                      from '../../../theme/radius';
import {
  PRX_ACTIVE_STATUSES,
  ORDER_ACTIVE_STATUSES,
}                                      from '../constants/prescriptionRequest.constants';
import type { MobileOrderSummary }     from '../../../types/order';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'orders' | 'prescriptions';

// ── Active prescription helper ────────────────────────────────────────────────
//
// A prescription request counts as "active" (needs user attention) when:
//   1. Status is PENDING or PARTIALLY_RESPONDED — waiting for pharmacy responses
//   2. Status is FULLY_RESPONDED AND quoted_count > 0 — quotes to review
//
// FULLY_RESPONDED with quoted_count === 0 means all pharmacies declined.
// There is nothing the user can do — it should NOT count as active.
//
// PRX_ACTIVE_STATUSES no longer contains FULLY_RESPONDED so this helper
// is the single place that encodes this rule.

function isActivePrescription(p: PrescriptionRequestSummary): boolean {
  if (PRX_ACTIVE_STATUSES.has(p.status)) return true;
  if (p.status === 'FULLY_RESPONDED' && p.quoted_count > 0) return true;
  return false;
}

// ── Small reusable count bubble ───────────────────────────────────────────────

interface CountBubbleProps {
  count:           number;
  backgroundColor: string;
}

function CountBubble({ count, backgroundColor }: CountBubbleProps) {
  if (count <= 0) return null;
  return (
    <View style={[styles.countBubble, { backgroundColor }]}>
      <Text style={styles.countBubbleText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const brandColor         = isDark ? colors.brand.accent : colors.brand.primary;
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  // ── Tab state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  // ── Badge store ────────────────────────────────────────────────────────
  const setHasActiveOrders        = useTabBadgeStore((s) => s.setHasActiveOrders);
  const setHasActivePrescriptions = useTabBadgeStore((s) => s.setHasActivePrescriptions);

  // ── Prescription draft state ───────────────────────────────────────────
  const draftFiles     = usePrescriptionRequestStore((s) => s.uploadedFiles);
  const currentDraftId = usePrescriptionRequestStore((s) => s.currentRequestId);

  // ── Notification store ─────────────────────────────────────────────────
  const lastStatusUpdate      = useOrderNotificationStore((s) => s.lastStatusUpdate);
  const clearLastStatusUpdate = useOrderNotificationStore((s) => s.clearLastStatusUpdate);

  // ── Orders state ───────────────────────────────────────────────────────
  const [orders,       setOrders]       = useState<MobileOrderSummary[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Prescription requests (React Query) ───────────────────────────────
  const {
    data:      prxList,
    isLoading: prxLoading,
    refetch:   refetchPrx,
  } = usePrescriptionRequests();

  // ── Fetch orders ───────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await ordersApi.getOrders();
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error('[OrdersScreen] fetchOrders error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  // Refetch when SSE signals a status change
  useEffect(() => {
    if (!lastStatusUpdate) return;
    fetchOrders(true);
    clearLastStatusUpdate();
  }, [lastStatusUpdate, fetchOrders, clearLastStatusUpdate]);

  // ── Active counts for inner tab bubbles ───────────────────────────────
  // Derived directly from live data — no extra state needed.

  const activeOrderCount = orders.filter((o: MobileOrderSummary) =>
    ORDER_ACTIVE_STATUSES.has(o.status),
  ).length;

  // Uses isActivePrescription() — correctly excludes FULLY_RESPONDED
  // where all pharmacies declined (quoted_count === 0).
  const activePrxCount = (prxList ?? []).filter(
    (p: PrescriptionRequestSummary) => isActivePrescription(p),
  ).length;

  // ── Badge sync — orders ────────────────────────────────────────────────
  useEffect(() => {
    setHasActiveOrders(activeOrderCount > 0);
  }, [activeOrderCount, setHasActiveOrders]);

  // ── Badge sync — prescriptions ─────────────────────────────────────────
  useEffect(() => {
    setHasActivePrescriptions(activePrxCount > 0);
  }, [activePrxCount, setHasActivePrescriptions]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOrders(true), refetchPrx()]);
    setIsRefreshing(false);
  }, [fetchOrders, refetchPrx]);

  // ── Navigation ─────────────────────────────────────────────────────────
  const handleOpenOrder = (orderId: string) => {
    router.push(`/orders/${orderId}` as any);
  };

  // ── Sub-components ─────────────────────────────────────────────────────

  const DraftBanner = useCallback(() => {
    if (draftFiles.length === 0 || currentDraftId !== null) return null;
    return (
      <TouchableOpacity
        onPress={() => router.push('/prescription-request' as any)}
        activeOpacity={0.85}
        style={[
          styles.draftCard,
          {
            backgroundColor: colors.background.tint,
            borderColor:     colors.border.brand,
          },
        ]}
      >
        <View
          style={[
            styles.draftIconWrap,
            { backgroundColor: colors.background.accent },
          ]}
        >
          <Ionicons name="document-text" size={18} color={brandColor} />
        </View>
        <View style={styles.draftTextWrap}>
          <Text
            style={[
              styles.draftTitle,
              { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Draft in progress
          </Text>
          <Text
            style={[
              styles.draftSub,
              { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {draftFiles.length} file{draftFiles.length !== 1 ? 's' : ''} uploaded
            — tap to continue
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.faint} />
      </TouchableOpacity>
    );
  }, [draftFiles.length, currentDraftId, colors, brandColor]);

  const OrdersEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: colors.background.elevated },
        ]}
      >
        <Ionicons name="receipt-outline" size={40} color={colors.text.disabled} />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
        ]}
      >
        No orders yet
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
        ]}
      >
        Your orders will appear here
      </Text>
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: brandColor }]}
        onPress={() => router.push('/')}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaButtonText, { fontFamily: 'Inter_600SemiBold' }]}>
          Start Shopping
        </Text>
      </TouchableOpacity>
    </View>
  );

  const PrescriptionsEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: colors.background.elevated },
        ]}
      >
        <Ionicons
          name="document-text-outline"
          size={40}
          color={colors.text.disabled}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
        ]}
      >
        No prescription requests
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
        ]}
      >
        Upload a prescription to get quotes from nearby pharmacies
      </Text>
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: brandColor }]}
        onPress={() => router.push('/prescription-request' as any)}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaButtonText, { fontFamily: 'Inter_600SemiBold' }]}>
          Upload Prescription
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top']}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:   colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
          ]}
        >
          My Orders
        </Text>
      </View>

      {/* ── Segmented tab control ───────────────────────────────────── */}
      <View
        style={[
          styles.tabStrip,
          {
            backgroundColor:   colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        {/* Orders segment */}
        <TouchableOpacity
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.7}
          style={[
            styles.tabSegment,
            activeTab === 'orders' && {
              borderBottomColor: brandColor,
              borderBottomWidth: 2,
            },
          ]}
        >
          <View style={styles.tabLabelRow}>
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color:      activeTab === 'orders'
                    ? colors.text.primary
                    : colors.text.faint,
                  fontFamily: activeTab === 'orders'
                    ? 'Inter_600SemiBold'
                    : 'Inter_400Regular',
                },
              ]}
            >
              Orders
            </Text>
            {/* Red bubble — active orders count */}
            <CountBubble
              count={activeOrderCount}
              backgroundColor={colors.status.error}
            />
          </View>
        </TouchableOpacity>

        {/* Prescriptions segment */}
        <TouchableOpacity
          onPress={() => setActiveTab('prescriptions')}
          activeOpacity={0.7}
          style={[
            styles.tabSegment,
            activeTab === 'prescriptions' && {
              borderBottomColor: brandColor,
              borderBottomWidth: 2,
            },
          ]}
        >
          <View style={styles.tabLabelRow}>
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color:      activeTab === 'prescriptions'
                    ? colors.text.primary
                    : colors.text.faint,
                  fontFamily: activeTab === 'prescriptions'
                    ? 'Inter_600SemiBold'
                    : 'Inter_400Regular',
                },
              ]}
            >
              Prescriptions
            </Text>
            {/* Brand bubble — active prescription requests count */}
            <CountBubble
              count={activePrxCount}
              backgroundColor={brandColor}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Orders tab ──────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={brandColor} />
            </View>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.order_id}
              renderItem={({ item }) => (
                <OrderHistoryCard
                  order={item}
                  onOpen={() => handleOpenOrder(item.order_id)}
                  onReorder={() => handleOpenOrder(item.order_id)}
                />
              )}
              ListEmptyComponent={<OrdersEmptyState />}
              ListHeaderComponent={<View style={styles.listHeader} />}
              ListFooterComponent={<View style={styles.listFooter} />}
              showsVerticalScrollIndicator={false}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              contentContainerStyle={[
                orders.length === 0 ? styles.emptyList : undefined,
                { paddingBottom: bottomTabBarHeight + Spacing.md },
              ]}
            />
          )}
        </>
      )}

      {/* ── Prescriptions tab ───────────────────────────────────────── */}
      {activeTab === 'prescriptions' && (
        <>
          {prxLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={brandColor} />
            </View>
          ) : (
            <FlatList<PrescriptionRequestSummary>
              data={prxList ?? []}
              keyExtractor={(item) => item.request_id}
              renderItem={({ item }) => (
                <PrescriptionRequestCard
                  request={item}
                  onPress={() =>
                    router.push(
                      `/prescription-request/${item.request_id}` as any,
                    )
                  }
                />
              )}
              ListHeaderComponent={
                <>
                  <DraftBanner />
                  <View style={styles.listHeader} />
                </>
              }
              ListEmptyComponent={
                draftFiles.length === 0 ? <PrescriptionsEmptyState /> : null
              }
              ListFooterComponent={<View style={styles.listFooter} />}
              showsVerticalScrollIndicator={false}
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              contentContainerStyle={[
                (prxList ?? []).length === 0 && draftFiles.length === 0
                  ? styles.emptyList
                  : undefined,
                { paddingBottom: bottomTabBarHeight + Spacing.md },
              ]}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical:   16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22 },

  // Segmented control
  tabStrip: {
    flexDirection:     'row',
    borderBottomWidth: 1,
  },
  tabSegment: {
    flex:              1,
    alignItems:        'center',
    paddingVertical:   12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  // Row that holds the label text + bubble side by side
  tabLabelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },

  tabSegmentText: { fontSize: 14 },

  // Count bubble
  countBubble: {
    minWidth:          18,
    height:            18,
    borderRadius:      9,
    paddingHorizontal: 5,
    alignItems:        'center',
    justifyContent:    'center',
  },
  countBubbleText: {
    fontSize:   10,
    color:      '#ffffff',
    fontFamily: 'Inter_700Bold',
    lineHeight: 13,
  },

  // Lists
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeader:       { height: 12 },
  listFooter:       { height: 8 },
  emptyList:        { flex: 1 },

  // Empty states
  emptyContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        32,
    gap:            12,
  },
  emptyIconWrap: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
  },
  emptyTitle:    { fontSize: 20 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  ctaButton: {
    marginTop:         8,
    paddingHorizontal: 28,
    paddingVertical:   12,
    borderRadius:      12,
  },
  ctaButtonText: { fontSize: 14, color: '#ffffff' },

  // Draft banner
  draftCard: {
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: 16,
    marginTop:        12,
    padding:          12,
    borderRadius:     Radius.lg,
    borderWidth:      1,
    gap:              Spacing.sm,
  },
  draftIconWrap: {
    width:          36,
    height:         36,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  draftTextWrap: { flex: 1, gap: 2 },
  draftTitle:    { fontSize: 14 },
  draftSub:      { fontSize: 12 },
});