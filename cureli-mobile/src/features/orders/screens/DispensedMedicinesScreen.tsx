// src/features/orders/screens/DispensedMedicinesScreen.tsx

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
import { Spacing } from '../../../theme/spacing';
import type { MobileOrderSummary } from '../../../types/order';

export function DispensedMedicinesScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  const [orders, setOrders] = useState<MobileOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ordersApi.getOrders();
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error('[DispensedMedicinesScreen] fetchOrders error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const handleOpen = (orderId: string) => {
    router.push(`/orders/${orderId}` as any);
  };

  const handleReorder = (_orderId: string) => {
    router.push('/cart');
  };

  const handleDelete = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: colors.background.elevated },
        ]}
      >
        <Ionicons
          name="receipt-outline"
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
        style={[styles.shopButton, { backgroundColor: brandColor }]}
        onPress={() => router.push('/')}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.shopButtonText,
            { fontFamily: 'Inter_600SemiBold' },
          ]}
        >
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
      {/* ── Header ──────────────────────────────────────── */}
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
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
            ]}
          >
            My Medicines
          </Text>
          <Text
            style={[
              styles.headerCount,
              { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* ── Loading ─────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        /* ── List ──────────────────────────────────────── */
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={({ item }) => (
            <OrderHistoryCard
              order={item}
              onOpen={() => handleOpen(item.order_id)}
              onReorder={() => handleReorder(item.order_id)}
              onDelete={() => handleDelete(item.order_id)}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          ListHeaderComponent={<View style={styles.listHeader} />}
          ListFooterComponent={<View style={styles.listFooter} />}
          showsVerticalScrollIndicator={false}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17 },
  headerCount: { fontSize: 12, marginTop: 1 },
  headerRight: { width: 36 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeader: { height: 12 },
  listFooter: { height: 8 },
  emptyList: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  shopButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: { fontSize: 14, color: '#ffffff' },
});