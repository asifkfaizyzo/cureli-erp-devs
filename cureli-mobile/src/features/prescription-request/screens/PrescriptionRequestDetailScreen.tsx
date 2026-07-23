// src/features/prescription-request/screens/PrescriptionRequestDetailScreen.tsx
//
// Thin orchestrator — owns data fetching, checkout flow, and derived state.
// All rendering is delegated to:
//   PrescriptionFilesSection   — collapsible file thumbnails + image viewer
//   PharmacyResponsesSection   — recipient cards, cancel, try-again
//
// CHANGED: handleAccept no longer calls Razorpay directly.
// New flow:
//   acceptQuote API → get checkout_prefill + branch coordinates
//   → bulk-load CartItem[] into cartStore via setItems()
//   → store prescription files in prescriptionStore
//   → store prescription_request_id + prescription_recipient_id in checkoutStore
//   → navigate to /cart
//
// CartScreen + useCheckout handles Razorpay → confirm → success from there.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
}                            from 'react-native';
import { SafeAreaView }      from 'react-native-safe-area-context';
import { router }            from 'expo-router';
import { Ionicons }          from '@expo/vector-icons';

import { useTheme }                    from '../../../theme/ThemeContext';
import { Spacing }                     from '../../../theme/spacing';
import { Radius }                      from '../../../theme/radius';
import { RequestStatusBadge }          from '../components/RequestStatusBadge';
import { PrescriptionFilesSection }    from '../components/PrescriptionFilesSection';
import type { PrescriptionFile }       from '../components/PrescriptionFilesSection';
import { PharmacyResponsesSection }    from '../components/PharmacyResponsesSection';
import {
  usePrescriptionRequestDetail,
  useAcceptQuote,
  useCancelRequest,
}                                      from '../hooks/usePrescriptionRequest';
import { useCheckoutStore }            from '../../../store/checkoutStore';
import { useCartStore }                from '../../../store/cartStore';
import type { CartItem }               from '../../../store/cartStore';
import { usePrescriptionStore }        from '../../../store/prescriptionStore';
import type { RecipientSummary, QuoteItem } from '../api/prescriptionRequest.api';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIONABLE_RECIPIENT_STATUSES = new Set(['SENT', 'QUOTE_SENT']);

const CANCELLABLE_REQUEST_STATUSES = new Set([
  'PENDING',
  'PARTIALLY_RESPONDED',
  'FULLY_RESPONDED',
]);

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  requestId: string;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function PrescriptionRequestDetailScreen({ requestId }: Props) {
  const { colors } = useTheme();

  const {
    data:      request,
    isLoading,
    isError,
    refetch,
  } = usePrescriptionRequestDetail(requestId);

  const acceptMutation = useAcceptQuote(requestId);
  const cancelMutation = useCancelRequest();

  const [acceptingId,   setAcceptingId]   = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ── Stores written to on quote accept ──────────────────────────────────
  const setCartItems  = useCartStore((s) => s.setItems);
  const clearCart     = useCartStore((s) => s.clearCart);
  const setTempFiles  = usePrescriptionStore((s) => s.setTempFiles);
  const clearTempFiles = usePrescriptionStore((s) => s.clearTempFiles);
  const setPrescriptionRequestContext = useCheckoutStore(
    (s) => s.setPrescriptionRequestContext,
  );

  // ── Accept quote ────────────────────────────────────────────────────────
  //
  // 1. Call acceptQuote API → get checkout_prefill + branch coordinates
  // 2. Map available quote items → CartItem[] using:
  //      prefill.items for authoritative variantId/quantity
  //      quote_items for display data (name, price, image)
  //      acceptRes branch_latitude/longitude for distance calculation
  // 3. Bulk-load cart → clearCart() then setItems()
  // 4. Store prescription files in prescriptionStore.tempFiles
  // 5. Store prescription_request_id + prescription_recipient_id in checkoutStore
  // 6. Navigate to /cart — CartScreen handles Razorpay from here

  const handleAccept = useCallback(
    async (recipientId: string) => {
      setAcceptingId(recipientId);
      setIsCheckingOut(true);

      try {
        const acceptRes  = await acceptMutation.mutateAsync(recipientId);
        const data       = acceptRes.data?.data;
        const prefill    = data?.checkout_prefill;
        const shopName   = data?.shop_name    ?? '';
        const branchName = data?.branch_name  ?? '';
        // ── ADDED: branch coordinates from backend accept response ────────
        // Backend now fetches these from BranchMarketplaceSettings.
        // Used to populate CartItem.branchLatitude/branchLongitude so that
        // CartScreen can call useDeliveryETA and get a real distanceKm.
        const branchLatitude  = data?.branch_latitude  ?? null;
        const branchLongitude = data?.branch_longitude ?? null;
        // ─────────────────────────────────────────────────────────────────

        if (!prefill) {
          Alert.alert('Error', 'Failed to get checkout data. Please try again.');
          return;
        }

        // Find the accepted recipient in the already-loaded request data.
        // We need quote_items for display fields since prefill.items only
        // contains [{ variantId, quantity }].
        const recipient = request?.recipients?.find(
          (r: RecipientSummary) => r.recipient_id === recipientId,
        );

        if (!recipient) {
          Alert.alert('Error', 'Could not find quote details. Please try again.');
          return;
        }

        // prefill.items is the authoritative source for variantId + quantity.
        // Available quote_items provide display data, in the same order.
        // TypeScript fix: explicit QuoteItem type on filter/map callbacks.
        const availableQuoteItems: QuoteItem[] = recipient.quote_items.filter(
          (qi: QuoteItem) => qi.is_available,
        );

        const prefillItems: Array<{ variantId: string; quantity: number }> =
          prefill.items ?? [];

        // Map by index — backend returns prefill.items in the same order
        // as the available quote items.
        const cartItems: CartItem[] = availableQuoteItems.map(
          (qi: QuoteItem, idx: number) => ({
            variantId:            prefillItems[idx]?.variantId ?? qi.quote_item_id,
            skuId:                qi.variant_sku    ?? '',
            name:                 qi.medicine_name,
            quantity:             prefillItems[idx]?.quantity  ?? qi.quantity,
            pricePerUnit:         qi.unit_price,
            image:                qi.image_url      ?? null,
            manufacturer:         qi.brand          ?? null,
            shopId:               recipient.shop_id,
            shopName,
            branchId:             recipient.branch_id,
            branchName,
            requiresPrescription: true,
            category:             null,
            // ── ADDED: pass branch coordinates through to CartItem ─────────
            branchLatitude,
            branchLongitude,
            // ─────────────────────────────────────────────────────────────
          }),
        );

        if (cartItems.length === 0) {
          Alert.alert(
            'No Items Available',
            'All items in this quote are unavailable.',
          );
          return;
        }

        // Populate cart
        clearCart();
        setCartItems(cartItems);

        // Store prescription files so useCheckout passes them to createSession
        clearTempFiles();
        setTempFiles(
          (prefill.prescription_files ?? []).map((f: any) => ({
            prescription_key: f.prescription_key,
            original_name:    f.original_name,
            mime_type:        f.mime_type,
            file_size:        f.file_size,
          })),
        );

        // Store request/recipient IDs so useCheckout passes them to createSession
        setPrescriptionRequestContext({
          prescription_request_id:   prefill.prescription_request_id,
          prescription_recipient_id: prefill.prescription_recipient_id,
        });

        // Navigate — CartScreen takes over from here
        router.push('/cart' as any);

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
    },
    [
      acceptMutation,
      request,
      clearCart,
      setCartItems,
      clearTempFiles,
      setTempFiles,
      setPrescriptionRequestContext,
    ],
  );

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

  // ── Loading ─────────────────────────────────────────────────────────────

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

  // ── Error ───────────────────────────────────────────────────────────────

  if (isError || !request) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top']}
      >
        <View style={styles.centerState}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.text.faint}
          />
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

  // ── Derived state ───────────────────────────────────────────────────────

  const actionableRecipients = request.recipients.filter(
    (r: RecipientSummary) => ACTIONABLE_RECIPIENT_STATUSES.has(r.status),
  );

  const allTerminalNoQuote =
    request.recipients.length > 0 &&
    actionableRecipients.length === 0 &&
    !['ACCEPTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'].includes(request.status);

  const canCancel =
    CANCELLABLE_REQUEST_STATUSES.has(request.status) &&
    actionableRecipients.length > 0;

  const isCheckoutLoading = isCheckingOut || acceptMutation.isPending;

  const files: PrescriptionFile[] = request.files ?? [];

  // ── Render ──────────────────────────────────────────────────────────────

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

      {/* Loading cart overlay */}
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
              Loading your cart…
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Prescription files collapsible */}
        <PrescriptionFilesSection
          files={files}
          requestId={request.request_id}
        />

        {/* Pharmacy responses */}
        <PharmacyResponsesSection
          recipients={request.recipients as RecipientSummary[]}
          allTerminalNoQuote={allTerminalNoQuote}
          canCancel={canCancel}
          isAccepting={isCheckoutLoading}
          acceptingId={acceptingId}
          onAccept={handleAccept}
          onCancel={handleCancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    height:            56,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap:               Spacing.sm,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
    gap:           Spacing.sm,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },

  content: {
    padding:       Spacing.base,
    paddingBottom: 40,
    gap:           Spacing.md,
  },

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

  centerState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.md,
  },
  errorText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  retryText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});