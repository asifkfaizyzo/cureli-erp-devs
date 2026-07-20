// src/features/prescription-request/components/QuoteComparisonCard.tsx
//
// Displays a single pharmacy's response in the request detail screen.
// Shows different content based on recipient status.

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme }               from '../../../theme/ThemeContext';
import { Spacing }                from '../../../theme/spacing';
import { Radius }                 from '../../../theme/radius';
import { useQuoteCountdown }      from '../hooks/usePrescriptionRequest';
import type { RecipientSummary }  from '../api/prescriptionRequest.api';

interface Props {
  recipient:        RecipientSummary;
  onAccept:         (recipientId: string) => void;
  isAccepting:      boolean;
  acceptingId:      string | null;
}

// ── Countdown display ──────────────────────────────────────────────────────

function CountdownBadge({ expiresAt }: { expiresAt: string | null }) {
  const { colors }                    = useTheme();
  const { display, isExpired, isUrgent } = useQuoteCountdown(expiresAt);

  if (!display) return null;

  return (
    <View
      style={[
        styles.countdown,
        {
          backgroundColor: isExpired
            ? colors.status.errorBg
            : isUrgent
            ? colors.status.errorBg
            : colors.background.tint,
        },
      ]}
    >
      <Ionicons
        name="time-outline"
        size={11}
        color={isExpired || isUrgent ? colors.status.error : colors.text.muted}
      />
      <Text
        style={[
          styles.countdownText,
          {
            color: isExpired || isUrgent
              ? colors.status.error
              : colors.text.muted,
          },
        ]}
      >
        {isExpired ? 'Quote expired' : `Expires in ${display}`}
      </Text>
    </View>
  );
}

// ── Quote items preview ────────────────────────────────────────────────────

function QuoteItemsPreview({
  items,
  colors,
}: {
  items:  RecipientSummary['quote_items'];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const [expanded, setExpanded] = useState(false);

  const available   = items.filter((i) => i.is_available);
  const unavailable = items.filter((i) => !i.is_available);
  const displayed   = expanded ? items : items.slice(0, 3);

  return (
    <View style={styles.itemsContainer}>
      {displayed.map((item) => (
        <View key={item.quote_item_id} style={styles.itemRow}>
          <View style={styles.itemLeft}>
            <Text
              style={[
                styles.itemName,
                {
                  color: item.is_available
                    ? colors.text.secondary
                    : colors.text.faint,
                  textDecorationLine: item.is_available ? 'none' : 'line-through',
                },
              ]}
              numberOfLines={1}
            >
              {item.medicine_name}
            </Text>
            {item.is_substitute && (
              <Text style={[styles.substituteBadge, { color: colors.text.brand }]}>
                Substitute
              </Text>
            )}
            {!item.is_available && (
              <Text style={[styles.unavailableBadge, { color: colors.status.error }]}>
                Unavailable
              </Text>
            )}
            {item.substitute_note && (
              <Text
                style={[styles.substituteNote, { color: colors.text.muted }]}
                numberOfLines={2}
              >
                {item.substitute_note}
              </Text>
            )}
          </View>
          {item.is_available && (
            <Text style={[styles.itemPrice, { color: colors.text.primary }]}>
              ₹{item.line_total.toFixed(2)}
            </Text>
          )}
        </View>
      ))}

      {items.length > 3 && (
        <TouchableOpacity
          onPress={() => setExpanded((e) => !e)}
          activeOpacity={0.7}
          style={styles.expandBtn}
        >
          <Text style={[styles.expandText, { color: colors.text.brand }]}>
            {expanded ? 'Show less' : `+${items.length - 3} more items`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────

export function QuoteComparisonCard({
  recipient,
  onAccept,
  isAccepting,
  acceptingId,
}: Props) {
  const { colors } = useTheme();
  const isThisAccepting = acceptingId === recipient.recipient_id && isAccepting;

  // ── Status: SENT — waiting ─────────────────────────────────────────────
  if (recipient.status === 'SENT') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor:     colors.border.default,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.pharmacyInfo}>
            <Text style={[styles.pharmacyName, { color: colors.text.primary }]}>
              {recipient.shop_name}
            </Text>
            {recipient.distance_km != null && (
              <Text style={[styles.distance, { color: colors.text.muted }]}>
                {recipient.distance_km} km away
              </Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadgeSmall,
              { backgroundColor: colors.status.warningBg },
            ]}
          >
            <ActivityIndicator size={10} color={colors.status.warning} />
            <Text style={[styles.statusBadgeText, { color: colors.status.warning }]}>
              Waiting
            </Text>
          </View>
        </View>
        <Text style={[styles.waitingSubtext, { color: colors.text.faint }]}>
          Waiting for pharmacy to review your prescription
        </Text>
      </View>
    );
  }

  // ── Status: DECLINED ──────────────────────────────────────────────────
  if (recipient.status === 'DECLINED') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor:     colors.border.subtle,
            opacity:         0.6,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.pharmacyInfo}>
            <Text style={[styles.pharmacyName, { color: colors.text.muted }]}>
              {recipient.shop_name}
            </Text>
          </View>
          <View
            style={[styles.statusBadgeSmall, { backgroundColor: colors.status.errorBg }]}
          >
            <Ionicons name="close-circle" size={11} color={colors.status.error} />
            <Text style={[styles.statusBadgeText, { color: colors.status.error }]}>
              Declined
            </Text>
          </View>
        </View>
        {recipient.decline_reason && (
          <Text style={[styles.waitingSubtext, { color: colors.text.faint }]}>
            {recipient.decline_reason}
          </Text>
        )}
      </View>
    );
  }

  // ── Status: EXPIRED ───────────────────────────────────────────────────
  if (recipient.status === 'EXPIRED') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor:     colors.border.subtle,
            opacity:         0.5,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.pharmacyName, { color: colors.text.faint }]}>
            {recipient.shop_name}
          </Text>
          <Text style={[styles.statusBadgeText, { color: colors.text.faint }]}>
            Expired
          </Text>
        </View>
      </View>
    );
  }

  // ── Status: ACCEPTED or CONVERTED ────────────────────────────────────
  if (recipient.status === 'ACCEPTED' || recipient.status === 'CONVERTED') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor:     colors.status.success + '40',
            borderWidth:     1.5,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.pharmacyInfo}>
            <Text style={[styles.pharmacyName, { color: colors.text.primary }]}>
              {recipient.shop_name}
            </Text>
            {recipient.distance_km != null && (
              <Text style={[styles.distance, { color: colors.text.muted }]}>
                {recipient.distance_km} km away
              </Text>
            )}
          </View>
          <View
            style={[
              styles.statusBadgeSmall,
              { backgroundColor: colors.status.successBg },
            ]}
          >
            <Ionicons name="checkmark-circle" size={11} color={colors.status.success} />
            <Text style={[styles.statusBadgeText, { color: colors.status.success }]}>
              {recipient.status === 'CONVERTED' ? 'Order placed' : 'Accepted'}
            </Text>
          </View>
        </View>
        {recipient.quote_items.length > 0 && (
          <QuoteItemsPreview items={recipient.quote_items} colors={colors} />
        )}
      </View>
    );
  }

  // ── Status: QUOTE_SENT — main quote card ──────────────────────────────
  const summary      = recipient.quote_summary;
  const isExpiredQuote = recipient.quote_expires_at
    ? new Date() > new Date(recipient.quote_expires_at)
    : false;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor:     isExpiredQuote
            ? colors.border.subtle
            : colors.brand.primary + '40',
          borderWidth: 1.5,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.pharmacyInfo}>
          <Text style={[styles.pharmacyName, { color: colors.text.primary }]}>
            {recipient.shop_name}
          </Text>
          {recipient.distance_km != null && (
            <Text style={[styles.distance, { color: colors.text.muted }]}>
              {recipient.distance_km} km away
            </Text>
          )}
        </View>
        <CountdownBadge expiresAt={recipient.quote_expires_at} />
      </View>

      {/* Summary chips */}
      {summary && (
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.chip,
              { backgroundColor: colors.status.successBg },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.status.success }]}>
              {summary.available_items}/{summary.total_items} available
            </Text>
          </View>

          {summary.unavailable_items > 0 && (
            <View
              style={[
                styles.chip,
                { backgroundColor: colors.status.errorBg },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.status.error }]}>
                {summary.unavailable_items} unavailable
              </Text>
            </View>
          )}

          {summary.quote_total > 0 && (
            <View
              style={[
                styles.chip,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.text.secondary }]}>
                ₹{summary.quote_total.toFixed(0)} total
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Quote items */}
      {recipient.quote_items.length > 0 && (
        <QuoteItemsPreview items={recipient.quote_items} colors={colors} />
      )}

      {/* Accept button */}
      {!isExpiredQuote && (
        <TouchableOpacity
          onPress={() => onAccept(recipient.recipient_id)}
          disabled={isAccepting}
          activeOpacity={0.8}
          style={[
            styles.acceptBtn,
            { backgroundColor: colors.brand.primary },
          ]}
        >
          {isThisAccepting ? (
            <ActivityIndicator size={16} color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          )}
          <Text style={styles.acceptBtnText}>
            {isThisAccepting ? 'Accepting…' : 'Accept Quote'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth:  1,
    padding:      Spacing.base,
    gap:          Spacing.sm,
  },
  cardHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            Spacing.sm,
  },
  pharmacyInfo: {
    flex: 1,
    gap:  3,
  },
  pharmacyName: {
    fontSize:   15,
    fontFamily: 'Inter_600SemiBold',
  },
  distance: {
    fontSize:   12,
    fontFamily: 'Inter_400Regular',
  },
  statusBadgeSmall: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingHorizontal: 8,
    paddingVertical:  4,
    borderRadius:     20,
    flexShrink:       0,
  },
  statusBadgeText: {
    fontSize:   11,
    fontFamily: 'Inter_600SemiBold',
  },
  countdown: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingHorizontal: 8,
    paddingVertical:  4,
    borderRadius:     20,
  },
  countdownText: {
    fontSize:   11,
    fontFamily: 'Inter_500Medium',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
  },
  chipText: {
    fontSize:   11,
    fontFamily: 'Inter_500Medium',
  },
  itemsContainer: {
    gap:           Spacing.xs,
    paddingTop:    Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  itemRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            Spacing.sm,
  },
  itemLeft: {
    flex: 1,
    gap:  2,
  },
  itemName: {
    fontSize:   13,
    fontFamily: 'Inter_400Regular',
  },
  substituteBadge: {
    fontSize:   10,
    fontFamily: 'Inter_600SemiBold',
  },
  unavailableBadge: {
    fontSize:   10,
    fontFamily: 'Inter_600SemiBold',
  },
  substituteNote: {
    fontSize:   11,
    fontFamily: 'Inter_400Regular',
    fontStyle:  'italic',
    lineHeight: 16,
  },
  itemPrice: {
    fontSize:   13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  expandBtn: {
    paddingTop: 4,
  },
  expandText: {
    fontSize:   12,
    fontFamily: 'Inter_500Medium',
  },
  waitingSubtext: {
    fontSize:   12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  acceptBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 13,
    borderRadius:   Radius.md,
    marginTop:      Spacing.xs,
  },
  acceptBtnText: {
    fontSize:   15,
    fontFamily: 'Inter_700Bold',
    color:      '#ffffff',
  },
});