// src/features/orders/screens/OrdersScreen.tsx
// Changes:
//   - Watches lastStatusUpdate from orderNotificationStore
//   - Pull-to-refresh via FlatList onRefresh
//   - Removed dead onDelete prop

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { OrderHistoryCard } from '../components/OrderHistoryCard';
import { ordersApi } from '../../marketplace/api/orders.api';
import { useLayoutStore } from '../../../store/layoutStore';
import { useOrderNotificationStore } from '../../../store/orderNotificationStore';
import { Spacing } from '../../../theme/spacing';
import type { MobileOrderSummary } from '../../../types/order';

export function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const brandColor         = isDark ? colors.brand.accent : colors.brand.primary;
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  const lastStatusUpdate    = useOrderNotificationStore((s) => s.lastStatusUpdate);
  const clearLastStatusUpdate = useOrderNotificationStore((s) => s.clearLastStatusUpdate);

  const [orders,    setOrders]    = useState<MobileOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Fetch on tab focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  // Refresh when SSE signals a status change
  // Any order changing status means the list may need updating
  // (e.g. an order that was PLACED is now ACCEPTED — still visible,
  // but the card status badge needs to update)
  React.useEffect(() => {
    if (!lastStatusUpdate) return;
    fetchOrders(true); // silent = don't show full loading spinner
    clearLastStatusUpdate();
  }, [lastStatusUpdate, fetchOrders, clearLastStatusUpdate]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders(true);
  }, [fetchOrders]);

  const handleOpen = (orderId: string) => {
    router.push(`/orders/${orderId}` as any);
  };

  const handleReorder = (orderId: string) => {
    // Navigate to detail screen which handles reorder flow
    router.push(`/orders/${orderId}` as any);
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[styles.emptyIconWrap, { backgroundColor: colors.background.elevated }]}
      >
        <Ionicons name="receipt-outline" size={40} color={colors.text.disabled} />
      </View>
      <Text
        style={[styles.emptyTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}
      >
        No orders yet
      </Text>
      <Text
        style={[styles.emptySubtitle, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}
      >
        Your orders will appear here
      </Text>
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: brandColor }]}
        onPress={() => router.push('/')}
        activeOpacity={0.8}
      >
        <Text style={[styles.shopButtonText, { fontFamily: 'Inter_600SemiBold' }]}>
          Start Shopping
        </Text>
      </TouchableOpacity>
    </View>
  );

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
            backgroundColor:  colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Text
          style={[styles.headerTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}
        >
          My Orders
        </Text>
        <Text
          style={[styles.headerCount, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}
        >
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Loading — initial load only */}
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
              onOpen={() => handleOpen(item.order_id)}
              onReorder={() => handleReorder(item.order_id)}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          ListHeaderComponent={<View style={styles.listHeader} />}
          ListFooterComponent={<View style={styles.listFooter} />}
          showsVerticalScrollIndicator={false}
          // Pull-to-refresh
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={[
            orders.length === 0 ? styles.emptyList : undefined,
            { paddingBottom: bottomTabBarHeight + Spacing.md },
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical:   16,
    borderBottomWidth: 1,
    flexDirection:     'row',
    alignItems:        'baseline',
    gap:               8,
  },
  headerTitle:      { fontSize: 22 },
  headerCount:      { fontSize: 13 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeader:       { height: 12 },
  listFooter:       { height: 8 },
  emptyList:        { flex: 1 },
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
  shopButton: {
    marginTop:       8,
    paddingHorizontal: 28,
    paddingVertical:   12,
    borderRadius:    12,
  },
  shopButtonText: { fontSize: 14, color: '#ffffff' },
});