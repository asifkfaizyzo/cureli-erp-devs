// src/features/cart/screens/CartScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

import { DeliveryAddressCard } from "../components/DeliveryAddressCard";
import { DeliverySummaryCard } from "../components/DeliverySummaryCard";
import { BillDetailsCard } from "../components/BillDetailsCard";
import {
  DeliveryInstructionCard,
  INSTRUCTIONS,
} from "../components/DeliveryInstructionCard";
import { StickyCheckoutBar } from "../components/StickyCheckoutBar";
import { RecommendationSection } from "../components/RecommendationSection";
import { PrescriptionUploadCard } from "../components/PrescriptionUploadCard";
import { AddressPickerSheet } from "../components/AddressPickerSheet";
import { PatientSelectorCard } from "../components/PatientSelectorCard";
import { PatientPickerSheet } from "../components/PatientPickerSheet";
import { useCheckoutStore } from "../../../store/checkoutStore";
import { useAuthStore } from "../../../store/authStore";
import type { CheckoutPatient } from "../../../types/auth";

import { useCheckout } from "../hooks/useCheckout";
import { useDeliveryETA } from "../../../hooks/useDeliveryETA";

import { useCartStore } from "../../../store/cartStore";
import { usePrescriptionStore } from "../../../store/prescriptionStore";
import { useAddresses } from "../../profile/hooks/useAddresses";
import { useDeliveryLocationStore } from "../../../store/deliveryLocationStore";
import type { Address } from "../../profile/types/profile.types";

// ── Order success overlay ─────────────────────────────────────

function OrderSuccess({ onGoHome }: { onGoHome: () => void }) {
  const { colors } = useTheme();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={[styles.successRoot, { backgroundColor: colors.background.page }]}
    >
      <Animated.View style={badgeStyle}>
        <View
          style={[
            styles.successBadge,
            { backgroundColor: colors.status.successBg },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={colors.status.success}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.successBody, contentStyle]}>
        <Text style={[styles.successTitle, { color: colors.text.primary }]}>
          Order Placed!
        </Text>
        <Text style={[styles.successSub, { color: colors.text.muted }]}>
          Your order has been placed with the pharmacy.{"\n"}
          Track your order status in the Orders tab.
        </Text>
        <TouchableOpacity
          onPress={onGoHome}
          activeOpacity={0.85}
          style={[styles.homeBtn, { backgroundColor: colors.brand.primary }]}
        >
          <Ionicons name="home-outline" size={16} color="#fff" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Cart screen ───────────────────────────────────────────────

export function CartScreen() {
  const { colors } = useTheme();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const tempPrescriptions = usePrescriptionStore((s) => s.tempFiles);
  const clearPrescriptions = usePrescriptionStore((s) => s.clearTempFiles);
  const deliveryNotes = usePrescriptionStore((s) => s.deliveryNotes);
  const setDeliveryNotes = usePrescriptionStore((s) => s.setDeliveryNotes);

  // ── Address resolution ────────────────────────────────────
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const selectAddress = useDeliveryLocationStore((s) => s.selectAddress);
  const pickedAddressId = useDeliveryLocationStore(
    (s) => s.location.addressId ?? null,
  );

  const resolvedAddress: Address | null = (() => {
    if (pickedAddressId) {
      return addresses.find((a) => a.id === pickedAddressId) ?? null;
    }
    return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  })();

  // ── Auto-select address ───────────────────────────────────
  //
  // Handles two cases:
  //   1. Nothing selected yet (pickedAddressId is null)
  //   2. Stale ID selected — address was deleted, ID no longer
  //      exists in the current list (MMKV persisted a dead ID)
  //
  // In both cases: auto-select the default address or first.
  // If the picked ID still exists → do nothing.

  useEffect(() => {
    if (addressesLoading) return;
    if (addresses.length === 0) return;

    const pickedExists =
      pickedAddressId !== null &&
      addresses.some((a) => a.id === pickedAddressId);

    if (pickedExists) return;

    const toSelect =
      addresses.find((a) => a.is_default) ?? addresses[0];

    selectAddress({
      source: "saved",
      area: toSelect.custom_label ?? toSelect.label,
      addressLine: `${toSelect.city}, ${toSelect.state} ${toSelect.pincode}`,
      latitude: toSelect.latitude ?? null,
      longitude: toSelect.longitude ?? null,
      addressId: toSelect.id,
    });
  }, [addresses, addressesLoading, pickedAddressId, selectAddress]);

  // ── Sheet state ───────────────────────────────────────────
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [patientSheetVisible, setPatientSheetVisible] = useState(false);

  const selectedPatient = useCheckoutStore((s) => s.selectedPatient);
  const setSelectedPatient = useCheckoutStore((s) => s.setSelectedPatient);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (
      selectedPatient === null &&
      user?.full_name &&
      user?.date_of_birth &&
      user?.sex
    ) {
      const dob = new Date(user.date_of_birth);
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;

      setSelectedPatient({
        is_self: true,
        name: user.full_name,
        age,
        sex: user.sex,
      });
    }
  }, []);

  const handleAddressPress = useCallback(() => {
    setAddressSheetVisible(true);
  }, []);

  const handleAddressSheetClose = useCallback(() => {
    setAddressSheetVisible(false);
  }, []);

  const [isSuccess, setIsSuccess] = useState(false);

  const [selectedInstructions, setSelectedInstructions] = useState<string[]>(
    [],
  );

  const handleToggleInstruction = useCallback(
    (id: string) => {
      setSelectedInstructions((prev) => {
        const next = prev.includes(id)
          ? prev.filter((s) => s !== id)
          : [...prev, id];
        const labels = INSTRUCTIONS.filter((i) => next.includes(i.id)).map(
          (i) => i.label,
        );
        setDeliveryNotes(labels.join(", "));
        return next;
      });
    },
    [setDeliveryNotes],
  );

  const requiresPrescription = items.some((i) => i.requiresPrescription);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleGoHome = useCallback(() => {
    router.replace("/(tabs)/home" as any);
  }, []);

  const firstItem = items[0] as any;
  const branchLat = firstItem?.branchLatitude ?? null;
  const branchLng = firstItem?.branchLongitude ?? null;
  const location = useDeliveryLocationStore((s) => s.location);
  const userLat = location.latitude;
  const userLng = location.longitude;

  const { distanceKm } = useDeliveryETA(userLat, userLng, branchLat, branchLng);

  const { placeOrder, isQuoteLoading } = useCheckout({
    distanceKm,
    onSuccess: useCallback(() => {
      clearCart();
      clearPrescriptions();
      setSelectedInstructions([]);
      setIsSuccess(true);
    }, [clearCart, clearPrescriptions]),
  });

  if (isSuccess) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top", "bottom"]}
      >
        <OrderSuccess onGoHome={handleGoHome} />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background.card,
              borderBottomColor: colors.border.subtle,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            My Cart
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={64} color={colors.text.faint} />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Your cart is empty
          </Text>
          <Text style={[styles.emptySub, { color: colors.text.muted }]}>
            Add medicines to get started
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)" as any)}
            activeOpacity={0.8}
            style={[
              styles.emptyBtn,
              { backgroundColor: colors.brand.primary },
            ]}
          >
            <Text style={styles.emptyBtnText}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background.card,
              borderBottomColor: colors.border.subtle,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            My Cart
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <DeliveryAddressCard onChangePress={handleAddressPress} />

          <PatientSelectorCard
            patient={selectedPatient}
            onPress={() => setPatientSheetVisible(true)}
          />

          <DeliverySummaryCard />

          {requiresPrescription && <PrescriptionUploadCard />}

          <RecommendationSection />

          <BillDetailsCard />

          <DeliveryInstructionCard
            selected={selectedInstructions}
            onToggle={handleToggleInstruction}
          />
        </ScrollView>

        {isQuoteLoading && (
          <View style={styles.loadingOverlay}>
            <View
              style={[
                styles.loadingCard,
                { backgroundColor: colors.background.card },
              ]}
            >
              <ActivityIndicator size="large" color={colors.brand.primary} />
              <Text
                style={[
                  styles.loadingText,
                  {
                    color: colors.text.primary,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Please wait..
              </Text>
            </View>
          </View>
        )}

        <StickyCheckoutBar onPlaceOrder={placeOrder} />
      </SafeAreaView>

      {addressSheetVisible && (
        <AddressPickerSheet
          visible={addressSheetVisible}
          onClose={handleAddressSheetClose}
        />
      )}

      {patientSheetVisible && (
        <PatientPickerSheet
          visible={patientSheetVisible}
          selectedPatient={selectedPatient}
          onSelect={(patient: CheckoutPatient) => setSelectedPatient(patient)}
          onClose={() => setPatientSheetVisible(false)}
        />
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h4,
  },
  headerSpacer: { width: 36 },
  scrollContent: {
    paddingBottom: 150,
  },
  seeAllBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  loadingCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: "center",
  },
  emptySub: {
    ...Typography.body,
    textAlign: "center",
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    ...Typography.button,
    color: "#ffffff",
  },
  successRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 32,
  },
  successBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  successBody: {
    alignItems: "center",
    gap: Spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: 24,
    height: 50,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  homeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});