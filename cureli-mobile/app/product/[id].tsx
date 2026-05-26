// app/product/[id].tsx
//
// Medicine detail screen — Root Stack screen (tab bar hidden).
// Replaces the dev placeholder with a real marketplace detail view.
//
// Route: /product/:id  where :id is the variant's skuId (e.g. "10005").
// The MedicineCard routes here via router.push(`/product/${medicine.skuId}`).
//
// Data: useMedicineDetail(skuId) — fetches real catalog data + siblings,
//       enriched with deterministic fake marketplace decoration.
//
// Layout:
//   ┌─ Header bar (back + name) ──────────────────────────┐
//   │  ScrollView                                          │
//   │  ├─ Image area (CDN image or branded placeholder)   │
//   │  ├─ Name + Rx badge + form pill                     │
//   │  ├─ Marketplace row (pharmacy count / price / ETA)  │
//   │  ├─ Info section (composition, manufacturer, pack)  │
//   │  └─ Siblings rail ("Other brands / strengths")      │
//   └──────────────────────────────────────────────────────┘

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
import type {
  EnrichedMedicine,
  CompositionItem,
} from "../../src/types/medicine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.42;

// ── Sub-components ────────────────────────────────────────────

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: colors.text.faint }]}>
        {label}
      </Text>
      <Text
        style={[infoStyles.value, { color: colors.text.secondary }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  label: {
    ...Typography.smallMedium,
    width: 110,
    flexShrink: 0,
  },
  value: {
    ...Typography.small,
    flex: 1,
  },
});

function SiblingCard({
  medicine,
  onPress,
  colors,
}: {
  medicine: EnrichedMedicine;
  onPress: (m: EnrichedMedicine) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(medicine)}
      style={[
        siblingStyles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View
        style={[
          siblingStyles.imageBox,
          { backgroundColor: colors.background.tint },
        ]}
      >
        {medicine.image ? (
          <Image
            source={{ uri: medicine.image }}
            style={siblingStyles.image}
            resizeMode="contain"
          />
        ) : (
          <Ionicons name="medical-outline" size={22} color={colors.text.brand} />
        )}
      </View>
      <Text
        style={[siblingStyles.name, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {medicine.name}
      </Text>
      {medicine.packSize ? (
        <Text
          style={[siblingStyles.pack, { color: colors.text.muted }]}
          numberOfLines={1}
        >
          {medicine.packSize}
        </Text>
      ) : null}
      <Text style={[siblingStyles.price, { color: colors.text.brand }]}>
        ₹{medicine.marketplace.startsAt}
      </Text>
    </TouchableOpacity>
  );
}

const siblingStyles = StyleSheet.create({
  card: {
    width: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 4,
    alignItems: "center",
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    ...Typography.smallMedium,
    textAlign: "center",
    lineHeight: 16,
  },
  pack: {
    ...Typography.caption,
    textAlign: "center",
  },
  price: {
    ...Typography.smallBold,
  },
});

// ── Composition helpers ───────────────────────────────────────

function compositionLine(items: CompositionItem[]): string {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items
    .map((c) => (c.strength ? `${c.name} ${c.strength}` : c.name))
    .join(", ");
}

// ── Main screen ───────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { variant, siblings, isLoading, isError, refetch } =
    useMedicineDetail(id ?? "");

  const handlePressSibling = useCallback((medicine: EnrichedMedicine) => {
    // Replace current detail screen with the sibling's detail.
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
            accessibilityLabel="Go back"
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
            accessibilityLabel="Go back"
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

  const { marketplace } = variant;

  // ── Detail view ─────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Header bar */}
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
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.brand} />
        </TouchableOpacity>

        <Text
          style={[styles.headerTitle, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {variant.genericName ?? variant.name}
        </Text>

        {/* Spacer to balance the back button */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Image area ────────────────────────────────────── */}
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

        {/* ── Name block ─────────────────────────────────────── */}
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

          {/* Form pill */}
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

          {/* Generic name */}
          {variant.genericName && variant.genericName !== variant.name ? (
            <Text
              style={[styles.genericName, { color: colors.text.muted }]}
              numberOfLines={2}
            >
              {variant.genericName}
            </Text>
          ) : null}
        </View>

        {/* ── Marketplace summary card ────────────────────────── */}
        <View
          style={[
            styles.marketplaceCard,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          {/* Price */}
          <View style={styles.marketplaceItem}>
            <Text style={[styles.mktLabel, { color: colors.text.faint }]}>
              Starts at
            </Text>
            <Text style={[styles.mktValue, { color: colors.text.primary }]}>
              ₹{marketplace.startsAt}
            </Text>
          </View>

          <View
            style={[
              styles.mktDivider,
              { backgroundColor: colors.border.subtle },
            ]}
          />

          {/* Pharmacy count */}
          <View style={styles.marketplaceItem}>
            <Text style={[styles.mktLabel, { color: colors.text.faint }]}>
              Nearby
            </Text>
            <Text style={[styles.mktValue, { color: colors.text.primary }]}>
              {marketplace.pharmacyCount}{" "}
              {marketplace.pharmacyCount === 1 ? "pharmacy" : "pharmacies"}
            </Text>
          </View>

          <View
            style={[
              styles.mktDivider,
              { backgroundColor: colors.border.subtle },
            ]}
          />

          {/* ETA */}
          <View style={styles.marketplaceItem}>
            <Text style={[styles.mktLabel, { color: colors.text.faint }]}>
              ETA
            </Text>
            <Text style={[styles.mktValue, { color: colors.text.primary }]}>
              {marketplace.etaMins} mins
            </Text>
          </View>

          <View
            style={[
              styles.mktDivider,
              { backgroundColor: colors.border.subtle },
            ]}
          />

          {/* Stock */}
          <View style={styles.marketplaceItem}>
            <Text style={[styles.mktLabel, { color: colors.text.faint }]}>
              Stock
            </Text>
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockDot,
                  {
                    backgroundColor: marketplace.inStock
                      ? colors.status.success
                      : colors.status.warning,
                  },
                ]}
              />
              <Text
                style={[
                  styles.mktValue,
                  {
                    color: marketplace.inStock
                      ? colors.status.success
                      : colors.status.warning,
                  },
                ]}
              >
                {marketplace.stockLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Info section ──────────────────────────────────── */}
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

        {/* ── Sibling variants ─────────────────────────────── */}
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
              style={[styles.disclaimerText, { color: colors.status.warning }]}
            >
              This medicine requires a valid prescription from a licensed
              doctor.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
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
  headerSpacer: {
    width: 40,
    flexShrink: 0,
  },
  scrollContent: {
    paddingBottom: Spacing["4xl"],
    gap: Spacing.md,
  },
  // Image area
  imageArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  mainImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  // Name block
  nameBlock: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  medicineName: {
    ...Typography.h2,
    flex: 1,
  },
  rxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: 4,
  },
  rxText: {
    ...Typography.smallBold,
    fontSize: 11,
  },
  formPill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  formText: {
    ...Typography.smallMedium,
  },
  genericName: {
    ...Typography.body,
  },
  // Marketplace card
  marketplaceCard: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  marketplaceItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  mktLabel: {
    ...Typography.caption,
    textAlign: "center",
  },
  mktValue: {
    ...Typography.smallBold,
    textAlign: "center",
  },
  mktDivider: {
    width: 1,
    height: 32,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Info section
  infoSection: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  infoDivider: {
    height: 1,
    marginVertical: 2,
  },
  // Siblings
  siblingsSection: {
    paddingLeft: Spacing.base,
    gap: Spacing.md,
  },
  siblingsScroll: {
    paddingRight: Spacing.base,
    gap: Spacing.md,
  },
  // Disclaimer
  disclaimer: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  // Shared states
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
  centerSubtext: {
    ...Typography.body,
    textAlign: "center",
  },
});