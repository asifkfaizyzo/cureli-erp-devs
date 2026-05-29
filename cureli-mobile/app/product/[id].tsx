// app/product/[id].tsx
//
// Medicine detail screen — Root Stack screen (tab bar hidden).
// Route: /product/:id  where :id is the variant's skuId.
//
// This file is intentionally thin — it only:
//   1. Reads route params
//   2. Calls useMedicineDetail
//   3. Handles loading / error states
//   4. Composes pre-built components into the screen layout
//
// All sub-components live in:
//   src/features/marketplace/components/product/

import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../src/theme/ThemeContext";
import { Typography } from "../../src/theme/typography";
import { Spacing } from "../../src/theme/spacing";
import { Radius } from "../../src/theme/radius";

import { useMedicineDetail } from "../../src/features/marketplace/hooks/useMedicineDetail";

import { InfoRow } from "../../src/features/marketplace/components/product/InfoRow";
import { SiblingCard } from "../../src/features/marketplace/components/product/SiblingCard";
import { UnavailableBanner } from "../../src/features/marketplace/components/product/UnavailableBanner";
import { MarketplaceSummaryCard } from "../../src/features/marketplace/components/product/MarketplaceSummaryCard";
import { FindPharmaciesSection } from "../../src/features/marketplace/components/product/FindPharmaciesSection";

import type {
  EnrichedMedicine,
  CompositionItem,
} from "../../src/types/medicine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.42;

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
  const { variant, siblings, isLoading, isError, refetch } =
    useMedicineDetail(id ?? "");

  const handlePressSibling = useCallback((medicine: EnrichedMedicine) => {
    router.replace(`/product/${medicine.skuId}`);
  }, []);

  // ── Loading ─────────────────────────────────────────────────
  if (isLoading) {
    return (
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
            <Ionicons name="arrow-back" size={20} color={colors.text.brand} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Loading medicine…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (isError || !variant) {
    return (
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
            <Ionicons name="arrow-back" size={20} color={colors.text.brand} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
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
    );
  }

  const { marketplace, availableNearYou } = variant;

  // ── Detail ──────────────────────────────────────────────────
  return (
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
          <Ionicons name="arrow-back" size={20} color={colors.text.brand} />
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
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image */}
        <View
          style={[
            styles.imageArea,
            { backgroundColor: colors.background.card },
          ]}
        >
          {variant.image ? (
            <Image
              source={{ uri: variant.image }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons
                name="medical-outline"
                size={64}
                color={colors.text.brand}
              />
            </View>
          )}
        </View>

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
                <Text style={[styles.rxText, { color: colors.status.warning }]}>
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

        {/* Marketplace area */}
        {availableNearYou ? (
          <MarketplaceSummaryCard marketplace={marketplace} colors={colors} />
        ) : (
          <UnavailableBanner colors={colors} />
        )}

        {/* CTA */}
        {availableNearYou ? (
          <FindPharmaciesSection
            medicineName={variant.name}
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
            <Ionicons name="cart-outline" size={18} color={colors.text.faint} />
            <Text style={[styles.disabledBtnText, { color: colors.text.faint }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Medicine Info
          </Text>

          <View
            style={[styles.infoDivider, { backgroundColor: colors.border.subtle }]}
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
              <InfoRow label="Pack Size" value={variant.packSize} colors={colors} />
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
              <InfoRow label="Strength" value={variant.strength} colors={colors} />
            </>
          ) : null}
        </View>

        {/* Siblings */}
        {siblings.length > 0 ? (
          <View style={styles.siblingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
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
              style={[styles.disclaimerText, { color: colors.status.warning }]}
            >
              This medicine requires a valid prescription from a licensed doctor.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: Spacing["4xl"],
    gap: Spacing.md,
  },
  imageArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  mainImage: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
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
  centerText: { ...Typography.h4, marginTop: Spacing.sm, textAlign: "center" },
  centerSubtext: { ...Typography.body, textAlign: "center" },
});