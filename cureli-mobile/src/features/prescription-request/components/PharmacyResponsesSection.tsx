// src/features/prescription-request/components/PharmacyResponsesSection.tsx
//
// Renders the "Pharmacy Responses" section of the detail screen.
// Handles: no recipients yet, all-declined state, recipient cards,
// cancel button, and try-again CTA.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
}                       from 'react-native';
import { router }       from 'expo-router';
import { Ionicons }     from '@expo/vector-icons';

import { useTheme }            from '../../../theme/ThemeContext';
import { Spacing }             from '../../../theme/spacing';
import { Radius }              from '../../../theme/radius';
import { QuoteComparisonCard } from './QuoteComparisonCard';
import type { RecipientSummary } from '../api/prescriptionRequest.api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  recipients:       RecipientSummary[];
  allTerminalNoQuote: boolean;
  canCancel:        boolean;
  isAccepting:      boolean;
  acceptingId:      string | null;
  onAccept:         (recipientId: string) => void;
  onCancel:         () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PharmacyResponsesSection({
  recipients,
  allTerminalNoQuote,
  canCancel,
  isAccepting,
  acceptingId,
  onAccept,
  onCancel,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Section title */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Pharmacy Responses
      </Text>

      {/* No recipients yet — still waiting */}
      {recipients.length === 0 && (
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.background.card,
              borderColor:     colors.border.subtle,
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.text.muted} />
          <Text style={[styles.infoText, { color: colors.text.muted }]}>
            Waiting for pharmacies to respond…
          </Text>
        </View>
      )}

      {/* All pharmacies declined or expired with no quotes */}
      {allTerminalNoQuote && (
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.status.errorBg,
              borderColor:     colors.status.errorBorder,
            },
          ]}
        >
          <Ionicons
            name="storefront-outline"
            size={18}
            color={colors.status.error}
          />
          <View style={styles.infoTextWrap}>
            <Text style={[styles.infoTextBold, { color: colors.status.error }]}>
              No pharmacies available
            </Text>
            <Text style={[styles.infoTextSub, { color: colors.text.muted }]}>
              All selected pharmacies have declined or their quotes have
              expired. You can upload a new prescription to try again.
            </Text>
          </View>
        </View>
      )}

      {/* Recipient cards */}
      {recipients.map((recipient) => (
        <QuoteComparisonCard
          key={recipient.recipient_id}
          recipient={recipient}
          onAccept={onAccept}
          isAccepting={isAccepting}
          acceptingId={acceptingId}
        />
      ))}

      {/* Cancel button — only when at least one recipient is still actionable */}
      {canCancel && (
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          style={[styles.cancelBtn, { borderColor: colors.border.default }]}
        >
          <Text style={[styles.cancelBtnText, { color: colors.text.muted }]}>
            Cancel Request
          </Text>
        </TouchableOpacity>
      )}

      {/* Try again CTA — only when all pharmacies declined with no quotes */}
      {allTerminalNoQuote && (
        <TouchableOpacity
          onPress={() => router.push('/prescription-request' as any)}
          activeOpacity={0.85}
          style={[
            styles.tryAgainBtn,
            { backgroundColor: colors.brand.primary },
          ]}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.tryAgainBtnText}>Upload New Prescription</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper:      { gap: Spacing.md },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  infoCard: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
    padding:       Spacing.base,
    borderRadius:  Radius.lg,
    borderWidth:   1,
  },
  infoText:     { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  infoTextWrap: { flex: 1, gap: 4 },
  infoTextBold: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  infoTextSub: {
    fontSize:   12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },

  cancelBtn: {
    alignItems:      'center',
    paddingVertical: Spacing.md,
    borderRadius:    Radius.md,
    borderWidth:     1,
    marginTop:       Spacing.sm,
  },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  tryAgainBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.sm,
    height:         52,
    borderRadius:   Radius.md,
    marginTop:      Spacing.xs,
  },
  tryAgainBtnText: {
    fontSize:   15,
    fontFamily: 'Inter_700Bold',
    color:      '#ffffff',
  },
});