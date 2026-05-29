// app/search.tsx
//
// Unified search screen with Medicines / Shops toggle.
//
// PHASE 4 CHANGE: complete rebuild.
//
// Previous design:
//   - Two modes (medicines / shops) with a toggle
//   - Shop side used DUMMY_SHOPS local array
//   - Mode toggle was labeled "Search in" with pills
//
// New design:
//   - Two tabs: Medicines | Shops
//   - Medicines tab: real catalog search (unchanged backend)
//   - Shops tab: real shop search via GET /mobile/shops/search
//   - Both tabs share the same search input and debounce logic
//   - dummyShops.ts is gone
//   - Location: not yet integrated (expo-location future phase)
//     Shops ordered by listing count until location is added
//
// Medicine results render MedicineCard (unchanged).
// Shop results render ShopCard (updated to real ShopSearchResult type).
//
// Cart conflict handling lives in Phase 5 (shop profile screen).
// The ADD button on ProductCard now navigates to detail page (Phase 4).

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// ── CHANGED: added useLocalSearchParams to this import ────────
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "../src/theme/ThemeContext";
import { Typography } from "../src/theme/typography";
import { Spacing } from "../src/theme/spacing";
import { Radius } from "../src/theme/radius";
import { MedicineCard } from "../src/features/marketplace/components/MedicineCard";
import { ShopCard } from "../src/features/marketplace/components/ShopCard";
import { marketplaceApi } from "../src/features/marketplace/api/marketplace.api";
import { generateMarketplaceData } from "../src/features/marketplace/utils/generateMarketplaceData";
import { useShopSearch } from "../src/features/marketplace/hooks/useShopSearch";
import type { EnrichedMedicine } from "../src/types/medicine";
import type { ShopSearchResult } from "../src/types/shop";

// ── Types ─────────────────────────────────────────────────────

type SearchTab = "medicines" | "shops";

// ── Tab config ────────────────────────────────────────────────

const TAB_CONFIG = {
  medicines: {
    label: "Medicines",
    icon: "medkit-outline" as const,
    placeholder: "Search medicines, brands, compositions...",
    idleTitle: "Find medicines quickly",
    idleHint: "Search by medicine name, brand, or composition",
    emptyPrefix: "No medicines found for",
    emptyHint: "Try a different name or brand",
    resultLabel: "medicine",
    suggestions: [
      "Paracetamol",
      "Vitamin D",
      "Metformin",
      "Omeprazole",
      "Cetirizine",
      "Amoxicillin",
    ],
  },
  shops: {
    label: "Shops",
    icon: "storefront-outline" as const,
    placeholder: "Search pharmacies by name or area...",
    idleTitle: "Find pharmacies near you",
    idleHint: "Search by pharmacy name or area",
    emptyPrefix: "No pharmacies found for",
    emptyHint: "Try a pharmacy name or area",
    resultLabel: "pharmacy",
    suggestions: [
      "Apollo",
      "MedPlus",
      "Kakkanad",
      "Edapally",
      "Vytilla",
      "Aluva",
    ],
  },
} as const;

// ── Debounce hook ─────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Medicine search hook ──────────────────────────────────────

function useMedicineResults(query: string, enabled: boolean) {
  const trimmed = query.trim();

  const result = useQuery({
    queryKey: ["medicines", "search", trimmed],
    queryFn: () =>
      marketplaceApi.getMedicines({ search: trimmed, limit: 30 }),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

  const medicines: EnrichedMedicine[] =
    result.data?.medicines.map((v) => ({
      ...v,
      marketplace: generateMarketplaceData(v.variantId),
    })) ?? [];

  return {
    medicines,
    isLoading: result.isLoading && result.fetchStatus !== "idle",
    isError: result.isError,
    refetch: result.refetch,
  };
}

// ── Tab toggle ────────────────────────────────────────────────

interface TabToggleProps {
  activeTab: SearchTab;
  onChange: (tab: SearchTab) => void;
}

function TabToggle({ activeTab, onChange }: TabToggleProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tabWrapper,
        { backgroundColor: colors.background.tint },
      ]}
    >
      {(Object.keys(TAB_CONFIG) as SearchTab[]).map((tab) => {
        const config = TAB_CONFIG[tab];
        const isActive = activeTab === tab;

        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(tab)}
            activeOpacity={0.8}
            style={[
              styles.tabPill,
              isActive && { backgroundColor: colors.brand.primary },
            ]}
          >
            <Ionicons
              name={config.icon}
              size={14}
              color={isActive ? "#FFFFFF" : colors.text.muted}
            />
            <Text
              style={[
                styles.tabPillText,
                { color: isActive ? "#FFFFFF" : colors.text.muted },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

export default function SearchScreen() {
  const { colors } = useTheme();

  // ── State declarations ────────────────────────────────────
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("medicines");
  const debouncedQuery = useDebounce(inputValue, 400);
  const inputRef = useRef<TextInput>(null);

  // ── Read initial params from navigation ───────────────────
  // Passed by product detail screen "Find Pharmacies" button:
  //   tab: "shops" | "medicines"
  //   q: pre-filled search query (medicine name)
  // Both are optional — direct navigation to /search has no params.
  const params = useLocalSearchParams<{ tab?: string; q?: string }>();

  // Apply params once on mount only.
  // useEffect with empty deps — intentional, params are initial values only.
  // If user navigates back and forward, we do not re-apply.
  useEffect(() => {
    if (params.tab === "shops" || params.tab === "medicines") {
      setActiveTab(params.tab);
    }
    if (params.q && params.q.trim().length > 0) {
      setInputValue(params.q.trim());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const config = TAB_CONFIG[activeTab];
  const hasQuery = inputValue.trim().length >= 2;

  // ── Medicine tab data ─────────────────────────────────────
  const {
    medicines,
    isLoading: isMedicinesLoading,
    isError: isMedicinesError,
    refetch: refetchMedicines,
  } = useMedicineResults(debouncedQuery, activeTab === "medicines");

  // ── Shops tab data ────────────────────────────────────────
  // Location is null for now — Phase 6 will add expo-location.
  // Shops are ordered by listing count when no location is provided.
  const {
    shops,
    isLoading: isShopsLoading,
    isError: isShopsError,
    refetch: refetchShops,
  } = useShopSearch({
    q: debouncedQuery,
    location: null,
    limit: 20,
    // Shops tab always fetches — even without a query — so the idle
    // state shows real shops instead of a blank screen.
    enabled: activeTab === "shops",
  });

  // ── Derived state ─────────────────────────────────────────

  const isMedicineTab = activeTab === "medicines";
  const isShopTab = activeTab === "shops";

  const isLoading = isMedicineTab ? isMedicinesLoading : isShopsLoading;
  const isError = isMedicineTab ? isMedicinesError : isShopsError;

  const hasMedicineResults = isMedicineTab && medicines.length > 0;
  const hasShopResults = isShopTab && shops.length > 0;
  const hasResults = hasMedicineResults || hasShopResults;

  const resultCount = isMedicineTab ? medicines.length : shops.length;
  const resultLabel =
    resultCount === 1 ? config.resultLabel : `${config.resultLabel}s`;

  // For the shops tab, show results even without a query (idle browse).
  // For the medicines tab, only show results when query >= 2 chars.
  const shouldShowResults = isShopTab ? hasShopResults : hasMedicineResults;

  // Show the idle state only for medicines when no query entered.
  // For shops, the idle state is replaced by the full shop list.
  const showIdle = isMedicineTab && !hasQuery;

  // ── Handlers ──────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setInputValue("");
    inputRef.current?.focus();
  }, []);

  const handleTabChange = useCallback((tab: SearchTab) => {
    setActiveTab(tab);
    // Do not clear the search input — user's query applies to both tabs.
    // They may be searching "Apollo" and want to see both medicine and
    // shop results.
  }, []);

  const handlePressMedicine = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const handlePressShop = useCallback((shop: ShopSearchResult) => {
    router.push(`/shop/${shop.shopId}` as any);
  }, []);

  const handleSuggestionPress = useCallback((term: string) => {
    setInputValue(term);
  }, []);

  const handleCameraPress = useCallback(() => {
    router.push("/prescription/upload" as any);
  }, []);

  const handleRetry = useCallback(() => {
    if (isMedicineTab) refetchMedicines();
    else refetchShops();
  }, [isMedicineTab, refetchMedicines, refetchShops]);

  // ── FlatList renderers ────────────────────────────────────

  const renderMedicine = useCallback<ListRenderItem<EnrichedMedicine>>(
    ({ item }) => (
      <MedicineCard medicine={item} onPress={handlePressMedicine} />
    ),
    [handlePressMedicine],
  );

  const renderShop = useCallback<ListRenderItem<ShopSearchResult>>(
    ({ item }) => (
      <ShopCard shop={item} onPress={handlePressShop} />
    ),
    [handlePressShop],
  );

  const medicineKeyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  const shopKeyExtractor = useCallback(
    (item: ShopSearchResult) => item.shopId,
    [],
  );

  // ── Results header text ───────────────────────────────────

  const resultsHeaderText = useMemo(() => {
    if (isShopTab && !hasQuery) {
      return `${resultCount} ${resultLabel} near you`;
    }
    return `${resultCount} ${resultLabel} for "${debouncedQuery}"`;
  }, [isShopTab, hasQuery, resultCount, resultLabel, debouncedQuery]);

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header with search input ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.page,
            borderBottomColor: colors.border.subtle,
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

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.input,
            },
          ]}
        >
          <Ionicons
            name={config.icon}
            size={18}
            color={colors.text.muted}
          />

          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text.primary }]}
            placeholder={config.placeholder}
            placeholderTextColor={colors.text.muted}
            value={inputValue}
            onChangeText={setInputValue}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {inputValue.length > 0 ? (
            <TouchableOpacity
              onPress={handleClear}
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCameraPress}
              accessibilityRole="button"
              accessibilityLabel="Upload prescription"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.text.brand}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tab toggle ── */}
      <View style={styles.tabSection}>
        <TabToggle activeTab={activeTab} onChange={handleTabChange} />
      </View>

      {/* ── IDLE state (medicines tab only, no query) ── */}
      {showIdle && (
        <View style={styles.idleContainer}>
          <Text style={[styles.idleTitle, { color: colors.text.secondary }]}>
            {config.idleTitle}
          </Text>
          <Text style={[styles.idleHint, { color: colors.text.muted }]}>
            {config.idleHint}
          </Text>
          <View style={styles.suggestions}>
            {config.suggestions.map((term) => (
              <TouchableOpacity
                key={term}
                onPress={() => handleSuggestionPress(term)}
                style={[
                  styles.suggestionChip,
                  {
                    backgroundColor: colors.background.tint,
                    borderColor: colors.border.brand,
                  },
                ]}
              >
                <Ionicons
                  name={config.icon}
                  size={13}
                  color={colors.text.brand}
                />
                <Text
                  style={[
                    styles.suggestionText,
                    { color: colors.text.brand },
                  ]}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── LOADING ── */}
      {!showIdle && isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            {isMedicineTab
              ? "Searching medicines..."
              : "Finding pharmacies..."}
          </Text>
        </View>
      )}

      {/* ── ERROR ── */}
      {!showIdle && !isLoading && isError && (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            {isMedicineTab ? "Search failed" : "Failed to load pharmacies"}
          </Text>
          <Text
            style={[styles.centerSubtext, { color: colors.text.brand }]}
            onPress={handleRetry}
          >
            Tap to retry
          </Text>
        </View>
      )}

      {/* ── EMPTY (only when query entered and no results) ── */}
      {!showIdle &&
        !isLoading &&
        !isError &&
        hasQuery &&
        !hasResults && (
          <View style={styles.center}>
            <Ionicons
              name={
                isMedicineTab ? "medkit-outline" : "storefront-outline"
              }
              size={44}
              color={colors.text.faint}
            />
            <Text
              style={[styles.centerText, { color: colors.text.secondary }]}
            >
              {config.emptyPrefix} "{debouncedQuery}"
            </Text>
            <Text
              style={[styles.centerSubtext, { color: colors.text.muted }]}
            >
              {config.emptyHint}
            </Text>
          </View>
        )}

      {/* ── RESULTS ── */}
      {!showIdle && !isLoading && !isError && shouldShowResults && (
        <>
          {/* Results count header */}
          <View style={styles.resultsHeader}>
            <Text
              style={[styles.resultsCount, { color: colors.text.muted }]}
            >
              {resultsHeaderText}
            </Text>
          </View>

          {/* Medicine results */}
          {isMedicineTab && (
            <FlatList
              data={medicines}
              renderItem={renderMedicine}
              keyExtractor={medicineKeyExtractor}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={11}
              removeClippedSubviews
            />
          )}

          {/* Shop results */}
          {isShopTab && (
            <FlatList
              data={shops}
              renderItem={renderShop}
              keyExtractor={shopKeyExtractor}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={11}
              removeClippedSubviews
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
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
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    ...Typography.body,
    flex: 1,
    paddingVertical: 0,
  },
  // ── Tabs ──────────────────────────────────────────────────
  tabSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  tabWrapper: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    padding: 3,
    gap: 2,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  tabPillText: {
    ...Typography.smallMedium,
  },
  // ── Idle ──────────────────────────────────────────────────
  idleContainer: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  idleTitle: {
    ...Typography.h3,
  },
  idleHint: {
    ...Typography.body,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  suggestionText: {
    ...Typography.smallMedium,
  },
  // ── Center states ─────────────────────────────────────────
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
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
  // ── Results ───────────────────────────────────────────────
  resultsHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  resultsCount: {
    ...Typography.small,
  },
  listContent: {
    paddingBottom: Spacing["3xl"],
  },
});