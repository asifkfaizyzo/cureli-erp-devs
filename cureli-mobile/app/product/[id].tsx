// app/product/[id].tsx
//
// Medicine detail screen — Root Stack screen (tab bar hidden).
// Route: /product/:id  where :id is the variant's skuId.
//
// Image display:
//   - 0 images → placeholder (handled inside ProductImageCarousel)
//   - 1 image  → static single image (handled inside ProductImageCarousel)
//   - 2+ images → swipeable carousel with dot indicator
//
// ── GO TO CART BAR ───────────────────────────────────────────
// Rendered globally from app/_layout.tsx via GlobalCartBar.
// The shared GlobalCartBar renders above the bottom sheet backdrop,
// but the backdrop visually covers it when the sheet is open —
// no special coordination needed from this screen.
// This screen only adds bottom padding to the ScrollView so content
// clears the bar when it is visible.

import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../src/theme/ThemeContext";
import { Typography } from "../../src/theme/typography";
import { Spacing } from "../../src/theme/spacing";
import { Radius } from "../../src/theme/radius";

import { useMedicineDetail } from "../../src/features/marketplace/hooks/useMedicineDetail";
import { useMedicineShops } from "../../src/features/marketplace/hooks/useMedicineShops";
import { useDeliveryLocation } from "../../src/hooks/useDeliveryLocation";
import { useCartBottomPadding } from "../../src/hooks/useCartBottomPadding";

import { InfoRow } from "../../src/features/marketplace/components/product/InfoRow";
import { SiblingCard } from "../../src/features/marketplace/components/product/SiblingCard";
import { UnavailableBanner } from "../../src/features/marketplace/components/product/UnavailableBanner";
import { MarketplaceSummaryCard } from "../../src/features/marketplace/components/product/MarketplaceSummaryCard";
import { FindPharmaciesSection } from "../../src/features/marketplace/components/product/FindPharmaciesSection";
import { ShopsBottomSheet } from "../../src/features/marketplace/components/product/ShopsBottomSheet";
import { ProductImageCarousel } from "../../src/features/marketplace/components/product/ProductImageCarousel";

import type { EnrichedMedicine } from "../../src/types/medicine";
import type { CompositionItem } from "../../src/types/medicine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Helpers ───────────────────────────────────────────────────

function compositionLine(items: CompositionItem[]): string {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items
    .map((c) => (c.strength ? `${c.name} ${c.strength}` : c.name))
    .join(", ");
}

// ── Screen ────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  // ── Medicine detail ───────────────────────────────────────
  const { variant, siblings, isLoading, isError, refetch } =
    useMedicineDetail(id ?? "");

  // ── Delivery location ─────────────────────────────────────
  const { location } = useDeliveryLocation();
  const shopLat =
    location.latitude != null && location.longitude != null
      ? location.latitude
      : null;
  const shopLng =
    location.latitude != null && location.longitude != null
      ? location.longitude
      : null;

  // ── Shops stocking this medicine ──────────────────────────
  const {
    shops,
    isLoading: isShopsLoading,
    isError: isShopsError,
    refetch: refetchShops,
  } = useMedicineShops({
    idOrSku: id ?? "",
    lat: shopLat,
    lng: shopLng,
    enabled: variant != null && variant.availableNearYou !== false,
  });

  // ── Bottom sheet state ────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);

  const handleOpenSheet = useCallback(() => setSheetVisible(true), []);
  const handleCloseSheet = useCallback(() => setSheetVisible(false), []);

  // ── Bottom padding for ScrollView ─────────────────────────
  // Delegates to the shared hook. Uses Spacing["4xl"] as the resting
  // value (matching the original manual default for this screen).
  const scrollBottomPadding = useCartBottomPadding(Spacing["4xl"]);

  // ── Navigation ────────────────────────────────────────────
  const handlePressSibling = useCallback((medicine: EnrichedMedicine) => {
    router.replace(`/product/${medicine.skuId}`);
  }, []);

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView
          style={[styles.safe, { backgroundColor: colors.background.page }]}
          edges={["top"]}
        >
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.brand,
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={colors.text.brand}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={[styles.centerText, { color: colors.text.muted }]}>
              Loading medicine…
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (isError || !variant) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView
          style={[styles.safe, { backgroundColor: colors.background.page }]}
          edges={["top"]}
        >
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.brand,
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={colors.text.brand}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <Ionicons
              name="cloud-offline-outline"
              size={44}
              color={colors.text.faint}
            />
            <Text
              style={[styles.centerText, { color: colors.text.secondary }]}
            >
              Medicine not found
            </Text>
            <Text
              style={[styles.centerSubtext, { color: colors.text.brand }]}
              onPress={() => refetch()}
            >
              Tap to retry
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const { availableNearYou } = variant;

  // ── Derive clean gallery images ───────────────────────────
  const galleryImages = useMemo(
    () =>
      (variant.images ?? []).filter(
        (url) => typeof url === "string" && url.length > 0,
      ),
    [variant.images],
  );

  // ── Detail ────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        {/* Header */}
        <View
          style={[
            styles.headerBar,
            {
              borderBottomColor: colors.border.subtle,
              backgroundColor: colors.background.page,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={colors.text.brand}
            />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {variant.genericName ?? variant.name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPadding },
          ]}
        >
          {/* Image / carousel */}
          <ProductImageCarousel images={galleryImages} colors={colors} />

          {/* Name block */}
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.medicineName, { color: colors.text.primary }]}
              >
                {variant.name}
              </Text>
              {variant.prescriptionRequired && (
                <View
                  style={[
                    styles.rxBadge,
                    {
                      backgroundColor: colors.status.warningBg,
                      borderColor: colors.status.warning,
                    },
                  ]}
                >
                  <Text
                    style={[styles.rxText, { color: colors.status.warning }]}
                  >
                    Rx
                  </Text>
                </View>
              )}
            </View>

            {variant.form ? (
              <View
                style={[
                  styles.formPill,
                  {
                    backgroundColor: colors.background.tint,
                    borderColor: colors.border.brand,
                  },
                ]}
              >
                <Text style={[styles.formText, { color: colors.text.brand }]}>
                  {variant.form}
                </Text>
              </View>
            ) : null}

            {variant.genericName && variant.genericName !== variant.name ? (
              <Text
                style={[styles.genericName, { color: colors.text.muted }]}
                numberOfLines={2}
              >
                {variant.genericName}
              </Text>
            ) : null}
          </View>

          {/* Marketplace summary */}
          {availableNearYou && shops.length > 0 ? (
            <MarketplaceSummaryCard shops={shops} colors={colors} />
          ) : availableNearYou === false ? (
            <UnavailableBanner colors={colors} />
          ) : null}

          {/* Find pharmacies CTA / unavailable state */}
          {availableNearYou !== false ? (
            <FindPharmaciesSection
              shopCount={shops.length}
              isLoading={isShopsLoading}
              onPress={handleOpenSheet}
              colors={colors}
            />
          ) : (
            <View
              style={[
                styles.disabledBtn,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.default,
                },
              ]}
            >
              <Ionicons
                name="cart-outline"
                size={18}
                color={colors.text.faint}
              />
              <Text
                style={[styles.disabledBtnText, { color: colors.text.faint }]}
              >
                Not Available
              </Text>
            </View>
          )}

          {/* Info section */}
          <View
            style={[
              styles.infoSection,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.text.primary }]}
            >
              Medicine Info
            </Text>

            <View
              style={[
                styles.infoDivider,
                { backgroundColor: colors.border.subtle },
              ]}
            />

            <InfoRow
              label="Composition"
              value={compositionLine(variant.composition)}
              colors={colors}
            />

            {variant.manufacturer ? (
              <>
                <View
                  style={[
                    styles.infoDivider,
                    { backgroundColor: colors.border.subtle },
                  ]}
                />
                <InfoRow
                  label="Manufacturer"
                  value={variant.manufacturer}
                  colors={colors}
                />
              </>
            ) : null}

            {variant.packSize ? (
              <>
                <View
                  style={[
                    styles.infoDivider,
                    { backgroundColor: colors.border.subtle },
                  ]}
                />
                <InfoRow
                  label="Pack Size"
                  value={variant.packSize}
                  colors={colors}
                />
              </>
            ) : null}

            {variant.strength ? (
              <>
                <View
                  style={[
                    styles.infoDivider,
                    { backgroundColor: colors.border.subtle },
                  ]}
                />
                <InfoRow
                  label="Strength"
                  value={variant.strength}
                  colors={colors}
                />
              </>
            ) : null}
          </View>

          {/* Siblings */}
          {siblings.length > 0 ? (
            <View style={styles.siblingsSection}>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                Other options
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.siblingsScroll}
              >
                {siblings.map((s) => (
                  <SiblingCard
                    key={s.variantId}
                    medicine={s}
                    onPress={handlePressSibling}
                    colors={colors}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Rx disclaimer */}
          {variant.prescriptionRequired ? (
            <View
              style={[
                styles.disclaimer,
                {
                  backgroundColor: colors.status.warningBg,
                  borderColor: colors.status.warning,
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.status.warning}
              />
              <Text
                style={[
                  styles.disclaimerText,
                  { color: colors.status.warning },
                ]}
              >
                This medicine requires a valid prescription from a licensed
                doctor.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Shops bottom sheet */}
        {variant && (
          <ShopsBottomSheet
            visible={sheetVisible}
            onClose={handleCloseSheet}
            variant={variant}
            shops={shops}
            isLoading={isShopsLoading}
            isError={isShopsError}
            onRetry={refetchShops}
            colors={colors}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  headerTitle: {
    ...Typography.bodySemiBold,
    flex: 1,
  },
  headerSpacer: { width: 40, flexShrink: 0 },
  scrollContent: {
    gap: Spacing.md,
  },
  nameBlock: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  medicineName: { ...Typography.h2, flex: 1 },
  rxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: 4,
  },
  rxText: { ...Typography.smallBold, fontSize: 11 },
  formPill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  formText: { ...Typography.smallMedium },
  genericName: { ...Typography.body },
  disabledBtn: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1,
  },
  disabledBtnText: { ...Typography.bodyMedium },
  infoSection: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  infoDivider: { height: 1, marginVertical: 2 },
  siblingsSection: { paddingLeft: Spacing.base, gap: Spacing.md },
  siblingsScroll: { paddingRight: Spacing.base, gap: Spacing.md },
  disclaimer: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  disclaimerText: { ...Typography.small, flex: 1, lineHeight: 18 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  centerText: {
    ...Typography.h4,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  centerSubtext: { ...Typography.body, textAlign: "center" },
});