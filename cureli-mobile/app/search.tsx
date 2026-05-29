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
import { router } from "expo-router";
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
import {
  searchShops,
  type DummyShop,
} from "../src/features/marketplace/constants/dummyShops";
import type { EnrichedMedicine } from "../src/types/medicine";

// ── Types ─────────────────────────────────────────────────────

type SearchMode = "medicines" | "shops";

// ── Mode-specific copy ────────────────────────────────────────

const MODE_COPY = {
  medicines: {
    placeholder: "Search medicines, brands, compositions...",
    helperText: "Showing medicine and brand matches",
    idleTitle: "Find medicines quickly",
    idleHint: "Search by medicine name, brand, or composition",
    leadingIcon: "medkit-outline" as const,
    chipIcon: "search-outline" as const,
    emptyPrefix: "No medicines found for",
    emptyHint: "Try a different name or brand",
    resultLabel: "medicine",
  },
  shops: {
    placeholder: "Search pharmacies, shop names, areas...",
    helperText: "Search pharmacies by name or area in Kochi",
    idleTitle: "Find pharmacies near you",
    idleHint: "Search by pharmacy name or area like Kakkanad",
    leadingIcon: "storefront-outline" as const,
    chipIcon: "storefront-outline" as const,
    emptyPrefix: "No shops found for",
    emptyHint: "Try a pharmacy name or area like Kakkanad, Edapally",
    resultLabel: "shop",
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

// ── Quick suggestions ─────────────────────────────────────────

const MEDICINE_SUGGESTIONS = [
  "Paracetamol",
  "Vitamin D",
  "Metformin",
  "Omeprazole",
  "Cetirizine",
  "Amoxicillin",
];

const SHOP_SUGGESTIONS = [
  "Kakkanad",
  "Edapally",
  "Apollo",
  "MedPlus",
  "Vytilla",
  "Aluva",
];

// ── Mode toggle component ─────────────────────────────────────

interface ModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.toggleSection}>
      {/* Label */}
      <Text style={[styles.toggleLabel, { color: colors.text.muted }]}>
        Search in
      </Text>

      {/* Pills */}
      <View
        style={[
          styles.toggleWrapper,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <TouchableOpacity
          onPress={() => onChange("medicines")}
          activeOpacity={0.8}
          style={[
            styles.togglePill,
            mode === "medicines" && {
              backgroundColor: colors.brand.primary,
            },
          ]}
        >
          <Ionicons
            name="medkit-outline"
            size={14}
            color={mode === "medicines" ? "#FFFFFF" : colors.text.muted}
          />
          <Text
            style={[
              styles.togglePillText,
              {
                color:
                  mode === "medicines" ? "#FFFFFF" : colors.text.muted,
              },
            ]}
          >
            Medicines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChange("shops")}
          activeOpacity={0.8}
          style={[
            styles.togglePill,
            mode === "shops" && {
              backgroundColor: colors.brand.primary,
            },
          ]}
        >
          <Ionicons
            name="storefront-outline"
            size={14}
            color={mode === "shops" ? "#FFFFFF" : colors.text.muted}
          />
          <Text
            style={[
              styles.togglePillText,
              {
                color: mode === "shops" ? "#FFFFFF" : colors.text.muted,
              },
            ]}
          >
            Shops
          </Text>
        </TouchableOpacity>
      </View>

      {/* Helper text */}
      <Text style={[styles.toggleHelper, { color: colors.text.faint }]}>
        {MODE_COPY[mode].helperText}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────

export default function SearchScreen() {
  const { colors } = useTheme();

  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<SearchMode>("medicines");
  const debouncedQuery = useDebounce(inputValue, 400);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Current mode copy
  const copy = MODE_COPY[mode];

  // ── Medicine results (only fetch when in medicine mode) ──
  const { medicines, isLoading, isError, refetch } = useMedicineResults(
    debouncedQuery,
    mode === "medicines",
  );

  // ── Shop results (sync filter, always instant) ────────────
  const shops = useMemo<DummyShop[]>(() => {
    if (mode !== "shops") return [];
    return searchShops(debouncedQuery);
  }, [debouncedQuery, mode]);

  // ── Derived state ─────────────────────────────────────────
  const hasQuery = inputValue.trim().length >= 2;
  const isMedicineMode = mode === "medicines";
  const isShopMode = mode === "shops";

  const isSearching = isMedicineMode && hasQuery && isLoading;
  const hasMedicineResults = isMedicineMode && medicines.length > 0;
  const hasShopResults = isShopMode && shops.length > 0;
  const hasAnyResults = hasMedicineResults || hasShopResults;

  const suggestions =
    isMedicineMode ? MEDICINE_SUGGESTIONS : SHOP_SUGGESTIONS;

  // Result count text
  const resultCount = isMedicineMode ? medicines.length : shops.length;
  const resultLabel =
    resultCount === 1 ? copy.resultLabel : `${copy.resultLabel}s`;

  // ── Handlers ──────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setInputValue("");
    inputRef.current?.focus();
  }, []);

  const handlePressMedicine = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}`);
  }, []);

  const handlePressShop = useCallback((shop: DummyShop) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(`/shop/${shop.shopId}` as any);
  }, []);

  const handleSuggestionPress = useCallback((term: string) => {
    setInputValue(term);
  }, []);

  const handleCameraPress = useCallback(() => {
    router.push("/prescription/upload");
  }, []);

  // ── FlatList renderers ────────────────────────────────────

  const renderMedicine = useCallback<ListRenderItem<EnrichedMedicine>>(
    ({ item }) => (
      <MedicineCard medicine={item} onPress={handlePressMedicine} />
    ),
    [handlePressMedicine],
  );

  const renderShop = useCallback<ListRenderItem<DummyShop>>(
    ({ item }) => <ShopCard shop={item} onPress={handlePressShop} />,
    [handlePressShop],
  );

  const medicineKeyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  const shopKeyExtractor = useCallback(
    (item: DummyShop) => item.shopId,
    [],
  );

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
          {/* Mode-aware leading icon */}
          <Ionicons
            name={copy.leadingIcon}
            size={18}
            color={colors.text.muted}
          />

          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text.primary }]}
            placeholder={copy.placeholder}
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

      {/* ── Mode toggle with label + helper ── */}
      <ModeToggle mode={mode} onChange={setMode} />

      {/* ── IDLE state ── */}
      {!hasQuery && (
        <View style={styles.idleContainer}>
          <Text style={[styles.idleTitle, { color: colors.text.secondary }]}>
            {copy.idleTitle}
          </Text>
          <Text style={[styles.idleHint, { color: colors.text.muted }]}>
            {copy.idleHint}
          </Text>
          <View style={styles.suggestions}>
            {suggestions.map((term) => (
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
                  name={copy.chipIcon}
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

      {/* ── LOADING (medicines only) ── */}
      {isSearching && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Searching medicines...
          </Text>
        </View>
      )}

      {/* ── ERROR (medicines only) ── */}
      {isMedicineMode && hasQuery && isError && (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            Search failed
          </Text>
          <Text
            style={[styles.centerSubtext, { color: colors.text.brand }]}
            onPress={() => refetch()}
          >
            Tap to retry
          </Text>
        </View>
      )}

      {/* ── EMPTY ── */}
      {hasQuery &&
        !isSearching &&
        !isError &&
        !hasAnyResults && (
          <View style={styles.center}>
            <Ionicons
              name={isMedicineMode ? "medkit-outline" : "storefront-outline"}
              size={44}
              color={colors.text.faint}
            />
            <Text
              style={[styles.centerText, { color: colors.text.secondary }]}
            >
              {copy.emptyPrefix} "{debouncedQuery}"
            </Text>
            <Text style={[styles.centerSubtext, { color: colors.text.muted }]}>
              {copy.emptyHint}
            </Text>
          </View>
        )}

      {/* ── MEDICINE RESULTS ── */}
      {isMedicineMode && hasMedicineResults && !isSearching && (
        <>
          <View style={styles.resultsHeader}>
            <Text
              style={[styles.resultsCount, { color: colors.text.muted }]}
            >
              {resultCount} {resultLabel} for{" "}
              <Text style={{ color: colors.text.secondary }}>
                "{debouncedQuery}"
              </Text>
            </Text>
          </View>
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
        </>
      )}

      {/* ── SHOP RESULTS ── */}
      {isShopMode && hasShopResults && (
        <>
          <View style={styles.resultsHeader}>
            <Text
              style={[styles.resultsCount, { color: colors.text.muted }]}
            >
              {resultCount} {resultLabel} for{" "}
              <Text style={{ color: colors.text.secondary }}>
                "{debouncedQuery}"
              </Text>
            </Text>
          </View>
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

  // ── Header ──────────────────────────────────────────────────
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

  // ── Toggle section ──────────────────────────────────────────
  toggleSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  toggleLabel: {
    ...Typography.smallMedium,
  },
  toggleWrapper: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderRadius: Radius.full,
    padding: 3,
    gap: 2,
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  togglePillText: {
    ...Typography.smallMedium,
  },
  toggleHelper: {
    ...Typography.small,
    marginTop: 2,
  },

  // ── Idle ────────────────────────────────────────────────────
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

  // ── Center states ───────────────────────────────────────────
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

  // ── Results ─────────────────────────────────────────────────
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