// src/features/cart/hooks/useCheckout.ts
//
// CHANGE: Reads prescriptionRequestContext from checkoutStore and passes
// prescription_request_id + prescription_recipient_id to createSession
// when the cart was populated from a prescription quote.
// For normal cart checkouts both fields are omitted (undefined).

import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";

import { checkoutApi } from "../../marketplace/api/checkout.api";
import { useCheckoutStore } from "../../../store/checkoutStore";
import { useCartStore } from "../../../store/cartStore";
import { usePrescriptionStore } from "../../../store/prescriptionStore";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";
import { useAddresses } from "../../profile/hooks/useAddresses";

interface UseCheckoutOptions {
  distanceKm: number | null;
  onSuccess: () => void;
}

export function useCheckout({ distanceKm, onSuccess }: UseCheckoutOptions) {
  const items            = useCartStore((s) => s.items);
  const clearCart        = useCartStore((s) => s.clearCart);
  const tempPrescriptions = usePrescriptionStore((s) => s.tempFiles);
  const clearPrescriptions = usePrescriptionStore((s) => s.clearTempFiles);

  const { addresses } = useAddresses();
  const pickedAddressId = useDeliveryLocationStore(
    (s) => s.location.addressId ?? null,
  );
  const resolvedAddress = pickedAddressId
    ? (addresses.find((a) => a.id === pickedAddressId) ?? null)
    : (addresses.find((a) => a.is_default) ?? addresses[0] ?? null);

  const {
    breakdown,
    isQuoteLoading,
    tip,
    setBreakdown,
    setQuoteLoading,
  } = useCheckoutStore();

  const selectedPatient              = useCheckoutStore((s) => s.selectedPatient);
  // ── NEW: prescription request context ──────────────────────────────────
  const prescriptionRequestContext   = useCheckoutStore(
    (s) => s.prescriptionRequestContext,
  );
  // ──────────────────────────────────────────────────────────────────────

  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quote fetch — unchanged
  useEffect(() => {
    if (items.length === 0 || distanceKm === null) {
      setBreakdown(null);
      return;
    }

    const branchId = items[0]?.branchId;
    if (!branchId) return;

    if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);

    quoteDebounceRef.current = setTimeout(async () => {
      try {
        setQuoteLoading(true);
        const res = await checkoutApi.getQuote({
          branch_id: branchId,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity:  i.quantity,
          })),
          distance_km: distanceKm,
          tip,
        });
        setBreakdown(res.data.data);
      } catch {
        // Silent — UI shows last known breakdown
      } finally {
        setQuoteLoading(false);
      }
    }, 400);

    return () => {
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
    };
  }, [items, distanceKm, tip]);

  // ── Place order ───────────────────────────────────────────
  const placeOrder = useCallback(async () => {
    if (!resolvedAddress) {
      Alert.alert(
        "Address Required",
        "Please add a delivery address before placing your order.",
      );
      return;
    }

    if (distanceKm === null) {
      Alert.alert(
        "Location Error",
        "Unable to calculate delivery distance. Please check your address.",
      );
      return;
    }

    if (breakdown && !breakdown.delivery_available) {
      Alert.alert(
        "Delivery Unavailable",
        breakdown.unavailable_reason ??
          "Delivery is not available to this location.",
      );
      return;
    }

    const branchId = items[0]?.branchId;
    if (!branchId) {
      Alert.alert("Error", "No branch found. Please re-add items to cart.");
      return;
    }

    if (!selectedPatient) {
      Alert.alert(
        "Select Patient",
        "Please select who this order is for before placing your order.",
      );
      return;
    }

    try {
      // ── Step 1: Create checkout session ──────────────────
      const sessionRes = await checkoutApi.createSession({
        branch_id:           branchId,
        delivery_address_id: resolvedAddress.id,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity:  i.quantity,
        })),
        distance_km:        distanceKm,
        tip,
        prescription_files: tempPrescriptions,
        patient:            selectedPatient,
        // ── NEW: pass prescription request context if present ──────────
        // undefined fields are omitted by axios serialisation automatically
        ...(prescriptionRequestContext
          ? {
              prescription_request_id:   prescriptionRequestContext.prescription_request_id,
              prescription_recipient_id: prescriptionRequestContext.prescription_recipient_id,
            }
          : {}),
        // ──────────────────────────────────────────────────────────────
      });

      const {
        session_id,
        razorpay_order_id,
        amount_paise,
        currency,
        key_id,
      } = sessionRes.data.data;

      // ── Step 2: Open Razorpay sheet ───────────────────────
      const paymentData = (await RazorpayCheckout.open({
        description: "Medicine Order",
        currency,
        key:         key_id,
        amount:      amount_paise,
        order_id:    razorpay_order_id,
        name:        "Cureli",
        prefill:     {},
        theme:       { color: "#05015A" },
      })) as {
        razorpay_payment_id: string;
        razorpay_order_id:   string;
        razorpay_signature:  string;
      };

      // ── Step 3: Confirm payment ───────────────────────────
      await checkoutApi.confirm({
        session_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_signature:  paymentData.razorpay_signature,
      });

      // ── Step 4: Clear everything ──────────────────────────
      clearCart();
      clearPrescriptions();
      useCheckoutStore.getState().reset(); // also clears prescriptionRequestContext
      onSuccess();

    } catch (err: any) {
      if (err?.code === 0) return;

      const message =
        err?.response?.data?.message ||
        err?.description ||
        "Something went wrong. Please try again.";

      if (err?.response?.status === 410) {
        Alert.alert(
          "Session Expired",
          "Your checkout session expired. Please try again.",
        );
      } else {
        Alert.alert("Order Failed", message);
      }
    }
  }, [
    resolvedAddress,
    distanceKm,
    breakdown,
    items,
    tip,
    tempPrescriptions,
    selectedPatient,
    prescriptionRequestContext,  // ← added to dep array
    clearCart,
    clearPrescriptions,
    onSuccess,
  ]);

  return { placeOrder, isQuoteLoading };
}