// src/features/orders/components/PrescriptionRequestCard.tsx
//
// Card shown in the Orders screen → Prescriptions tab.
// Visual language mirrors OrderHistoryCard: same border radius, card
// background, divider pattern, footer row.
//
// FULLY_RESPONDED has two sub-states:
//   quoted_count > 0  → "Review Quotes →" CTA  (pharmacies sent quotes)
//   quoted_count === 0 → "No quotes available"   (all pharmacies declined)

import React                 from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
}                            from 'react-native';
import { Ionicons }          from '@expo/vector-icons';

import { useTheme }          from '../../../theme/ThemeContext';
import { Spacing }           from '../../../theme/spacing';
import { Radius }            from '../../../theme/radius';
import {
  PRX_STATUS_CONFIG,
  type PrxColorKey,
  type PrxStatusConfig,
}                            from '../constants/prescriptionRequest.constants';
import type { ColorPalette } from '../../../theme/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

// Matches the shape returned by getCustomerRequests → formatRequestSummary
export interface PrescriptionRequestSummary {
  request_id:      string;
  request_number:  string;
  status:          string;
  recipient_count: number;
  quoted_count:    number;
  accepted_count:  number;
  file_count:      number;
  created_at:      string;
  expires_at:      string | null;
  cancelled_at:    string | null;
  completed_at:    string | null;
}

interface Props {
  request: PrescriptionRequestSummary;
  onPress: () => void;
}

// ── Color resolver ────────────────────────────────────────────────────────────

function resolveStatusColors(
  colorKey: PrxColorKey,
  colors:   ColorPalette,
): { fg: string; bg: string } {
  switch (colorKey) {
    case 'success': return { fg: colors.status.success, bg: colors.status.successBg };
    case 'warning': return { fg: colors.status.warning, bg: colors.status.warningBg };
    case 'error':   return { fg: colors.status.error,   bg: colors.status.errorBg   };
    case 'info':    return { fg: colors.status.info,    bg: colors.status.infoBg    };
    default:        return { fg: colors.text.faint,     bg: colors.background.tint  };
  }
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

// ── Resolved config for FULLY_RESPONDED ──────────────────────────────────────
//
// FULLY_RESPONDED splits into two visually distinct states depending on
// whether any pharmacy actually sent a quote.
//
//   quoted_count > 0  → warn color, "Review Quotes"
//   quoted_count === 0 → error color, "No Quotes Available"
//
// All other statuses use PRX_STATUS_CONFIG as-is.

function resolveConfig(
  status:      string,
  quotedCount: number,
): PrxStatusConfig {
  if (status === 'FULLY_RESPONDED') {
    if (quotedCount > 0) {
      return {
        label:    'Review Quotes',
        colorKey: 'warning',
        icon:     'checkmark-circle-outline',
      };
    }
    return {
      label:    'No Quotes Available',
      colorKey: 'error',
      icon:     'close-circle-outline',
    };
  }
  return PRX_STATUS_CONFIG[status] ?? PRX_STATUS_CONFIG.PENDING;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PrescriptionRequestCard({ request, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const brandColor         = isDark ? colors.brand.accent : colors.brand.primary;

  const config     = resolveConfig(request.status, request.quoted_count);
  const { fg, bg } = resolveStatusColors(config.colorKey, colors);

  // "Review Quotes" CTA is only shown when there are actual quotes to review
  const showReviewCta =
    request.status === 'FULLY_RESPONDED' && request.quoted_count > 0;

  // "All declined" notice — all pharmacies responded but none sent a quote
  const showAllDeclined =
    request.status === 'FULLY_RESPONDED' && request.quoted_count === 0;

  // Which date is most meaningful to show in the footer
  const displayDate =
    request.completed_at ??
    request.cancelled_at ??
    request.created_at;

  // Recipients still waiting (not yet quoted, accepted, or terminal)
  const pendingCount =
    request.recipient_count - request.quoted_count - request.accepted_count;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.93}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor:     colors.border.default,
        },
      ]}
    >
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
          <Ionicons name={config.icon as any} size={13} color={fg} />
          <Text
            style={[
              styles.statusText,
              { color: fg, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            {config.label}
          </Text>
        </View>

        {/* Request number */}
        <Text
          style={[
            styles.requestNumber,
            { color: colors.text.disabled, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {request.request_number}
        </Text>
      </View>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <View style={styles.body}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Files */}
          <View style={styles.statItem}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={colors.text.faint}
            />
            <Text
              style={[
                styles.statText,
                { color: colors.text.secondary, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {request.file_count}{' '}
              {request.file_count === 1 ? 'file' : 'files'}
            </Text>
          </View>

          <View
            style={[styles.statDot, { backgroundColor: colors.border.default }]}
          />

          {/* Pharmacies */}
          <View style={styles.statItem}>
            <Ionicons
              name="storefront-outline"
              size={14}
              color={colors.text.faint}
            />
            <Text
              style={[
                styles.statText,
                { color: colors.text.secondary, fontFamily: 'Inter_400Regular' },
              ]}
            >
              {request.recipient_count}{' '}
              {request.recipient_count === 1 ? 'pharmacy' : 'pharmacies'}
            </Text>
          </View>

          {/* Quote count — only shown when quotes exist */}
          {request.quoted_count > 0 && (
            <>
              <View
                style={[
                  styles.statDot,
                  { backgroundColor: colors.border.default },
                ]}
              />
              <View style={styles.statItem}>
                <Ionicons
                  name="chatbubble-outline"
                  size={14}
                  color={colors.text.faint}
                />
                <Text
                  style={[
                    styles.statText,
                    {
                      color:      colors.text.secondary,
                      fontFamily: 'Inter_400Regular',
                    },
                  ]}
                >
                  {request.quoted_count}{' '}
                  {request.quoted_count === 1 ? 'quote' : 'quotes'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── "Review Quotes →" CTA ────────────────────────────────── */}
        {/* Only shown when FULLY_RESPONDED and at least one quote exists */}
        {showReviewCta && (
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.reviewCta, { backgroundColor: brandColor }]}
          >
            <Text
              style={[styles.reviewCtaText, { fontFamily: 'Inter_700Bold' }]}
            >
              Review Quotes
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── "All pharmacies declined" notice ────────────────────── */}
        {/* Shown when FULLY_RESPONDED but no pharmacy sent a quote    */}
        {showAllDeclined && (
          <View
            style={[
              styles.declinedNotice,
              {
                backgroundColor: colors.status.errorBg,
                borderColor:     colors.status.errorBorder,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.status.error}
            />
            <Text
              style={[
                styles.declinedNoticeText,
                { color: colors.status.error, fontFamily: 'Inter_400Regular' },
              ]}
            >
              All pharmacies declined. Tap to view details.
            </Text>
          </View>
        )}
      </View>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.footerDate,
            { color: colors.text.disabled, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {formatDate(displayDate)}
        </Text>

        {/* Pending count — only shown when actively waiting */}
        {pendingCount > 0 &&
          ['PENDING', 'PARTIALLY_RESPONDED'].includes(request.status) && (
            <View style={styles.statItem}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.text.faint}
              />
              <Text
                style={[
                  styles.footerHint,
                  { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
                ]}
              >
                {pendingCount} still responding
              </Text>
            </View>
          )}

        <Ionicons name="chevron-forward" size={14} color={colors.text.faint} />
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius:     16,
    borderWidth:      1,
    marginHorizontal: 16,
    marginBottom:     14,
    overflow:         'hidden',
  },

  // Top bar
  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingTop:        12,
    paddingBottom:     10,
  },
  statusBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      20,
  },
  statusText:    { fontSize: 12 },
  requestNumber: { fontSize: 11 },

  // Divider
  divider: { height: 1 },

  // Body
  body: {
    paddingHorizontal: 14,
    paddingVertical:   12,
    gap:               Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    flexWrap:      'wrap',
    gap:           Spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  statText: { fontSize: 13 },
  statDot: {
    width:        3,
    height:       3,
    borderRadius: 1.5,
  },

  // Review CTA
  reviewCta: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs + 2,
    borderRadius:      Radius.md,
  },
  reviewCtaText: {
    fontSize: 13,
    color:    '#fff',
  },

  // All declined notice
  declinedNotice: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.xs,
    padding:       Spacing.sm,
    borderRadius:  Radius.sm,
    borderWidth:   1,
  },
  declinedNoticeText: {
    fontSize:   12,
    lineHeight: 17,
    flex:       1,
  },

  // Footer
  footer: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  footerDate: { fontSize: 11 },
  footerHint: { fontSize: 11 },
});