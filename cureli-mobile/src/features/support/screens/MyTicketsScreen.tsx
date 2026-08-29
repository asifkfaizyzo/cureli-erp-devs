import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { TicketStatusBadge } from '../components/TicketStatusBadge';
import { supportApi } from '../api/support.api';
import type { CustomerTicketSummary } from '../../../types/support';

export function MyTicketsScreen() {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const [tickets, setTickets] = useState<CustomerTicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await supportApi.getMyTickets(1, 30);
      setTickets(res.data.data.tickets);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTickets();
  }, [fetchTickets]);

  const renderItem = ({ item }: { item: CustomerTicketSummary }) => (
    <TouchableOpacity
      style={[
        styles.ticketCard,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
      onPress={() => router.push(`/support/${item.ticket_id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.ticketIdWrap}>
          <Text style={[styles.ticketNumber, { color: colors.text.primary }]}>
            #{item.ticket_number}
          </Text>
          {item.order_number && (
            <Text style={[styles.orderNumber, { color: colors.text.faint }]}>
              Order: {item.order_number}
            </Text>
          )}
        </View>
        <TicketStatusBadge status={item.status} size="small" />
      </View>

      <Text style={[styles.subject, { color: colors.text.primary }]} numberOfLines={1}>
        {item.subject}
      </Text>

      <View style={[styles.cardFooter, { borderTopColor: colors.border.subtle }]}>
        <View style={styles.dateWrap}>
          <Ionicons name="time-outline" size={13} color={colors.text.faint} />
          <Text style={[styles.dateText, { color: colors.text.faint }]}>
            {new Date(item.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        {item.attachment_count > 0 && (
          <View style={styles.attachWrap}>
            <Ionicons name="attach" size={14} color={colors.text.faint} />
            <Text style={[styles.attachText, { color: colors.text.faint }]}>
              {item.attachment_count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.default }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Support Tickets</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : (
        <View style={styles.container}>
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.ticket_id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.background.tint }]}>
                  <Ionicons name="chatbubbles-outline" size={32} color={brandColor} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Support Tickets</Text>
                <Text style={[styles.emptySubtitle, { color: colors.text.faint }]}>
                  If you have an issue with a completed order, you can raise a ticket directly from the order details page.
                </Text>
              </View>
            }
          />

          {/* ── Sticky Bottom Contact Footer ── */}
          <View style={[styles.stickyFooter, { backgroundColor: colors.background.card, borderTopColor: colors.border.default }]}>
            <View style={styles.footerContent}>
              <Ionicons name="mail-outline" size={15} color={colors.text.faint} style={styles.footerIcon} />
              <View style={styles.footerTextContainer}>
                <Text style={[styles.footerText, { color: colors.text.faint }]}>
                  Have other questions? Contact us at
                </Text>
                <Text style={[styles.emailText, { color: brandColor }]}>
                  info@curelihealth.com
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, position: 'relative' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { 
    padding: 16, 
    gap: 12, 
    paddingBottom: 110 // Extra offset space for the two-line sticky footer
  },
  ticketCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketIdWrap: { gap: 2 },
  ticketNumber: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  orderNumber: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  subject: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  attachWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  attachText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },

  // ── Contact Support Sticky Footer Styles ───────────────────────────────────
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  footerIcon: {
    marginRight: 8,
  },
  footerTextContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  emailText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
});