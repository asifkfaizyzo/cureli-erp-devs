// src/features/prescription-request/screens/PrescriptionRequestDetailScreen.tsx

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router }       from 'expo-router';
import { Ionicons }     from '@expo/vector-icons';

import { useTheme }              from '../../../theme/ThemeContext';
import { Spacing }               from '../../../theme/spacing';
import { Radius }                from '../../../theme/radius';
import { RequestStatusBadge }    from '../components/RequestStatusBadge';
import { QuoteComparisonCard }   from '../components/QuoteComparisonCard';
import {
  usePrescriptionRequestDetail,
  useAcceptQuote,
  useCancelRequest,
} from '../hooks/usePrescriptionRequest';
import { checkoutApi }            from '../../marketplace/api/checkout.api';
import { useCheckoutStore }       from '../../../store/checkoutStore';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import { useAddresses }           from '../../profile/hooks/useAddresses';
import RazorpayCheckout           from 'react-native-razorpay';
// ── FIX: import RecipientSummary so the map callback is typed ─────────────────
import type { RecipientSummary }  from '../api/prescriptionRequest.api';

interface Props {
  requestId: string;
}

export function PrescriptionRequestDetailScreen({ requestId }: Props) {
  const { colors } = useTheme();

  const { data: request, isLoading, isError, refetch } =
    usePrescriptionRequestDetail(requestId);

  const acceptMutation = useAcceptQuote(requestId);
  const cancelMutation = useCancelRequest();

  const [acceptingId, setAcceptingId]     = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const selectedPatient = useCheckoutStore((s) => s.selectedPatient);
  const { addresses }   = useAddresses();
  const pickedAddressId = useDeliveryLocationStore((s) => s.location.addressId ?? null);

  // ── Accept quote + proceed to checkout ─────────────────────────────────

  const handleAccept = useCallback(async (recipientId: string) => {
    setAcceptingId(recipientId);

    try {
      const acceptRes = await acceptMutation.mutateAsync(recipientId);
      const prefill   = acceptRes.data?.data?.checkout_prefill;

      if (!prefill) {
        Alert.alert('Error', 'Failed to get checkout data. Please try again.');
        return;
      }

      const resolvedAddress = pickedAddressId
        ? addresses.find((a) => a.id === pickedAddressId)
        : addresses.find((a) => a.id === prefill.delivery_address_id)
          ?? addresses.find((a) => a.is_default)
          ?? addresses[0];

      if (!resolvedAddress) {
        Alert.alert('Address Required', 'Please add a delivery address first.');
        return;
      }

      if (!selectedPatient) {
        Alert.alert(
          'Select Patient',
          'Please go to cart settings and select who this order is for.',
        );
        return;
      }

      setIsCheckingOut(true);

      const sessionRes = await checkoutApi.createSession({
        branch_id:                 prefill.branch_id,
        delivery_address_id:       resolvedAddress.id,
        items:                     prefill.items,
        distance_km:               0,
        prescription_files:        prefill.prescription_files,
        patient:                   selectedPatient,
        prescription_request_id:   prefill.prescription_request_id,
        prescription_recipient_id: prefill.prescription_recipient_id,
      });

      const { session_id, razorpay_order_id, amount_paise, currency, key_id } =
        sessionRes.data.data;

      const options = {
        description: 'Medicine Order',
        currency,
        key:         key_id,
        amount:      amount_paise,
        order_id:    razorpay_order_id,
        name:        'Cureli',
        prefill:     {},
        theme:       { color: '#05015A' },
      };

      const paymentData = (await RazorpayCheckout.open(options)) as {
        razorpay_payment_id: string;
        razorpay_order_id:   string;
        razorpay_signature:  string;
      };

      await checkoutApi.confirm({
        session_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_signature:  paymentData.razorpay_signature,
      });

      Alert.alert(
        'Order Placed! 🎉',
        'Your prescription order has been placed. You can track it in the Orders tab.',
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(tabs)/orders' as any),
          },
        ],
      );
    } catch (err: any) {
      if (err?.code === 0) return;

      const message =
        err?.response?.data?.message ??
        err?.description ??
        'Something went wrong. Please try again.';

      if (err?.response?.status === 410) {
        Alert.alert('Quote Expired', 'This quote has expired. Please wait for a new one.');
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setAcceptingId(null);
      setIsCheckingOut(false);
    }
  }, [acceptMutation, addresses, pickedAddressId, selectedPatient]);

  // ── Cancel request ──────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this prescription request?',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text:    'Cancel Request',
          style:   'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(requestId);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to cancel request. Please try again.');
            }
          },
        },
      ],
    );
  }, [requestId, cancelMutation]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !request) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.text.faint} />
          <Text style={[styles.errorText, { color: colors.text.muted }]}>
            Failed to load request
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.7}>
            <Text style={[styles.retryText, { color: colors.text.brand }]}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = ['PENDING', 'PARTIALLY_RESPONDED', 'FULLY_RESPONDED'].includes(
    request.status,
  );

  const isCheckoutLoading = isCheckingOut || acceptMutation.isPending;

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
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {request.request_number}
          </Text>
          <RequestStatusBadge status={request.status} />
        </View>
      </View>

      {/* Checkout loading overlay */}
      {isCheckoutLoading && (
        <View style={styles.overlay}>
          <View
            style={[
              styles.overlayCard,
              { backgroundColor: colors.background.card },
            ]}
          >
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={[styles.overlayText, { color: colors.text.primary }]}>
              Processing…
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Pharmacy Responses
        </Text>

        {request.recipients.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.background.card,
                borderColor:     colors.border.subtle,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.text.muted} />
            <Text style={[styles.emptyText, { color: colors.text.muted }]}>
              Waiting for pharmacies to respond…
            </Text>
          </View>
        ) : (
          // ── FIX: recipient is typed as RecipientSummary ──────────────────
          request.recipients.map((recipient: RecipientSummary) => (
            <QuoteComparisonCard
              key={recipient.recipient_id}
              recipient={recipient}
              onAccept={handleAccept}
              isAccepting={isCheckoutLoading}
              acceptingId={acceptingId}
            />
          ))
        )}

        {canCancel && (
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
            style={[
              styles.cancelBtn,
              { borderColor: colors.border.default },
            ]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text.muted }]}>
              Cancel Request
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    height:            56,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap:               Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, gap: 3 },
  headerTitle:  { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  content: {
    padding:       Spacing.base,
    paddingBottom: 40,
    gap:           Spacing.md,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptyCard: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    padding:       Spacing.base,
    borderRadius:  Radius.lg,
    borderWidth:   1,
  },
  emptyText:  { fontSize: 13, fontFamily: 'Inter_400Regular' },
  cancelBtn: {
    alignItems:     'center',
    paddingVertical: Spacing.md,
    borderRadius:   Radius.md,
    borderWidth:    1,
    marginTop:      Spacing.sm,
  },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  centerState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.md,
  },
  errorText:  { fontSize: 14, fontFamily: 'Inter_400Regular' },
  retryText:  { fontSize: 14, fontFamily: 'Inter_500Medium' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          100,
  },
  overlayCard: {
    borderRadius: Radius.lg,
    padding:      28,
    alignItems:   'center',
    gap:          Spacing.md,
  },
  overlayText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});