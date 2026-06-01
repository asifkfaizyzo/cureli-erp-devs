// src/features/orders/screens/OrdersScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { OrderHistoryCard } from '../components/OrderHistoryCard';
import { MOCK_ORDERS } from '../constants/orders.constants';
import type { DispensedOrder } from '../../../types/order';

export function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const [orders, setOrders] = useState<DispensedOrder[]>(MOCK_ORDERS);
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const handleOpen = (orderId: string) => {
  router.push(`/orders/${orderId}` as any);
};

  const handleReorder = (orderId: string) => {
    // TODO: add items to cart
    router.push('/cart');
  };

  const handleDelete = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const EmptyState = () => (
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
        Your delivered orders will appear here
      </Text>
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: brandColor }]}
        onPress={() => router.push('/')}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.shopButtonText, { fontFamily: 'Inter_600SemiBold' }]}
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
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
          ]}
        >
          My Orders
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

      {/* ── Order List ─────────────────────────────── */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderHistoryCard
            order={item}
            onOpen={() => handleOpen(item.id)}
            onReorder={() => handleReorder(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        ListHeaderComponent={<View style={styles.listHeader} />}
        ListFooterComponent={<View style={styles.listFooter} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
  },
  headerCount: {
    fontSize: 13,
  },
  listHeader: { height: 12 },
  listFooter: { height: 24 },
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
  emptyTitle: {
    fontSize: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 14,
    color: '#ffffff',
  },
});