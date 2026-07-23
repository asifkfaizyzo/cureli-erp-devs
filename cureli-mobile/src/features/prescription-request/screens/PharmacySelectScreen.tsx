// src/features/prescription-request/screens/PharmacySelectScreen.tsx
// Step 2 — Select pharmacies near delivery address

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { usePrescriptionRequestStore } from "../../../store/prescriptionRequestStore";
import { prescriptionRequestApi } from "../api/prescriptionRequest.api";
import { useAddresses } from "../../profile/hooks/useAddresses";
import { PharmacySelectCard } from "../components/PharmacySelectCard";
// ── FIX: searchShops is a method on marketplaceApi, not a named export ────────
import { marketplaceApi } from "../../marketplace/api/marketplace.api";
// ── FIX: import the shop type so the map callback is typed ───────────────────
import type { ShopSearchResponse } from "../../../types/shop";
import { useQuery } from "@tanstack/react-query";

// Derive the shop item type from the response type
type ShopItem = ShopSearchResponse["shops"][number];

export function PharmacySelectScreen() {
  const { colors } = useTheme();

  const {
    uploadedFiles,
    selectedAddressId,
    selectedBranchIds,
    isSubmitting,
    submitError,
    toggleBranch,
    setSubmitting,
    setSubmitError,
    setCurrentRequest,
    reset,
  } = usePrescriptionRequestStore();

  const { addresses } = useAddresses();
  const address = addresses.find((a) => a.id === selectedAddressId);
  const lat = address?.latitude ? Number(address.latitude) : null;
  const lng = address?.longitude ? Number(address.longitude) : null;

  // ── Fetch nearby shops ──────────────────────────────────────────────────
  const { data: shopsData, isLoading: shopsLoading } = useQuery({
    queryKey: ["nearby-shops-for-prescription", lat, lng],
    queryFn: async () => {
      // ── FIX: use marketplaceApi.searchShops ──────────────────────────────
      const res = await marketplaceApi.searchShops({ lat, lng, limit: 30 });
      return res.shops ?? [];
    },
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 2,
  });

  const shops: ShopItem[] = shopsData ?? [];

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (selectedBranchIds.length === 0) {
      Alert.alert("Select Pharmacy", "Please select at least one pharmacy.");
      return;
    }
    if (!address || lat == null || lng == null) {
      Alert.alert(
        "Address Error",
        "Your delivery address is missing location data.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await prescriptionRequestApi.submitRequest({
        files: uploadedFiles.map((f) => ({
          file_key: f.file_key,
          original_name: f.original_name,
          mime_type: f.mime_type,
          file_size: f.file_size,
        })),
        delivery_address_id: selectedAddressId!,
        search_latitude: lat,
        search_longitude: lng,
        branch_ids: selectedBranchIds,
      });

      const requestId = res.data?.data?.request_id;
      setCurrentRequest(requestId);

      router.replace(`/prescription-request/${requestId}` as any);
      setTimeout(() => reset(), 500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Failed to submit. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedBranchIds,
    address,
    lat,
    lng,
    uploadedFiles,
    selectedAddressId,
    setSubmitting,
    setSubmitError,
    setCurrentRequest,
    reset,
  ]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
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
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Select Pharmacies
        </Text>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: colors.text.muted }]}>
            2 of 2
          </Text>
        </View>
      </View>

      {/* Selection count bar */}
      <View
        style={[
          styles.selectionBar,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Text style={[styles.selectionText, { color: colors.text.secondary }]}>
          {selectedBranchIds.length === 0
            ? "Select pharmacies to send your prescription"
            : `${selectedBranchIds.length} ${selectedBranchIds.length === 1 ? "pharmacy" : "pharmacies"} selected (max 10)`}
        </Text>
      </View>

      {/* Shop list */}
      {shopsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.loadingText, { color: colors.text.muted }]}>
            Finding nearby pharmacies…
          </Text>
        </View>
      ) : shops.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Ionicons
            name="storefront-outline"
            size={48}
            color={colors.text.faint}
          />
          <Text style={[styles.emptyText, { color: colors.text.muted }]}>
            No pharmacies found near your address
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {/* ── FIX: shop is now typed as ShopItem ───────────────────────── */}
          {shops.map((shop: ShopItem) => {
            const branch = shop.nearestBranch;
            if (!branch) return null;
            const isSelected = selectedBranchIds.includes(branch.branchId);
            const isMaxReached = selectedBranchIds.length >= 10 && !isSelected;

            return (
              <TouchableOpacity
                key={shop.shopId}
                activeOpacity={isMaxReached ? 1 : 0.9}
                disabled={isMaxReached}
                style={{ opacity: isMaxReached ? 0.4 : 1 }}
              >
                <PharmacySelectCard
                  shop={shop}
                  isSelected={isSelected}
                  onToggle={(branchId) => {
                    if (isMaxReached) {
                      Alert.alert(
                        "Maximum reached",
                        "You can select up to 10 pharmacies.",
                      );
                      return;
                    }
                    toggleBranch(branchId);
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Submit error */}
      {submitError && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.status.errorBg,
              borderColor: colors.status.errorBorder,
            },
          ]}
        >
          <Ionicons
            name="warning-outline"
            size={14}
            color={colors.status.error}
          />
          <Text style={[styles.errorText, { color: colors.status.error }]}>
            {submitError}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background.card,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={selectedBranchIds.length === 0 || isSubmitting}
          activeOpacity={0.85}
          style={[
            styles.submitBtn,
            {
              backgroundColor:
                selectedBranchIds.length > 0 && !isSubmitting
                  ? colors.brand.primary
                  : colors.background.tint,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size={18} color="#fff" />
          ) : (
            <Ionicons name="send-outline" size={18} color="#fff" />
          )}
          <Text
            style={[
              styles.submitBtnText,
              {
                color:
                  selectedBranchIds.length > 0 && !isSubmitting
                    ? "#fff"
                    : colors.text.faint,
              },
            ]}
          >
            {isSubmitting
              ? "Sending…"
              : `Send to ${selectedBranchIds.length || ""} ${selectedBranchIds.length === 1 ? "Pharmacy" : "Pharmacies"}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  stepIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stepText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  selectionBar: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  selectionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  list: {
    padding: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
  },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
