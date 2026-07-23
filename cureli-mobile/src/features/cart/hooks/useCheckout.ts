// src/features/cart/hooks/useCheckout.ts
//
// CHANGE: Reads prescriptionRequestContext from checkoutStore and passes
// prescription_request_id + prescription_recipient_id to createSession
// when the cart was populated from a prescription quote.
// For normal cart checkouts both fields are omitted (undefined).

import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { useDialog } from "../../../components/Dialog/DialogProvider";
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
  const { alert: showAlert } = useDialog();
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
      await showAlert({
        title: "Address Required",
        message: "Please add a delivery address before placing your order.",
        confirmLabel: "OK",
      });
      return;
    }

    if (distanceKm === null) {
      await showAlert({
        title: "Location Error",
        message: "Unable to calculate delivery distance. Please check your address.",
        confirmLabel: "OK",
      });
      return;
    }

    if (breakdown && !breakdown.delivery_available) {
      await showAlert({
        title: "Delivery Unavailable",
        message:
          breakdown.unavailable_reason ??
          "Delivery is not available to this location.",
        confirmLabel: "OK",
      });
      return;
    }

    const branchId = items[0]?.branchId;
    if (!branchId) {
      await showAlert({
        title: "Error",
        message: "No branch found. Please re-add items to cart.",
        confirmLabel: "OK",
      });
      return;
    }

    if (!selectedPatient) {
      await showAlert({
        title: "Select Patient",
        message: "Please select who this order is for before placing your order.",
        confirmLabel: "OK",
      });
      return;
    }

    try {
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
        ...(prescriptionRequestContext
          ? {
              prescription_request_id:   prescriptionRequestContext.prescription_request_id,
              prescription_recipient_id: prescriptionRequestContext.prescription_recipient_id,
            }
          : {}),
      });

      const {
        session_id,
        razorpay_order_id,
        amount_paise,
        currency,
        key_id,
      } = sessionRes.data.data;

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

      await checkoutApi.confirm({
        session_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_signature:  paymentData.razorpay_signature,
      });

      clearCart();
      clearPrescriptions();
      useCheckoutStore.getState().reset();
      onSuccess();
    } catch (err: any) {
      if (err?.code === 0) return;

      const message =
        err?.response?.data?.message ||
        err?.description ||
        "Something went wrong. Please try again.";

      if (err?.response?.status === 410) {
        await showAlert({
          title: "Session Expired",
          message: "Your checkout session expired. Please try again.",
          confirmLabel: "OK",
        });
      } else {
        await showAlert({
          title: "Order Failed",
          message,
          confirmLabel: "OK",
        });
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
    prescriptionRequestContext,
    clearCart,
    clearPrescriptions,
    onSuccess,
    showAlert,
  ]);

  return { placeOrder, isQuoteLoading };
}