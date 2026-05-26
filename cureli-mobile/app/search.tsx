// app/search.tsx
//
// Medicine search screen — Root Stack screen (tab bar hidden).
// Replaces the dev placeholder with a real search experience.
//
// Architecture:
//   • Lives outside (tabs)/ so it covers the tab bar when pushed.
//   • Text input → 400ms debounce → query → MedicineCard feed.
//   • Uses a local useQuery (not useMedicineFeed's useInfiniteQuery) because
//     the search UX is a single result page, not an infinite scroll. The user
//     refines the query rather than paginating.
//   • EnrichedMedicine is built here the same way as the home feed so cards
//     look identical — same fake marketplace data for the same skuId.
//
// States:
//   idle      — no query typed yet → "popular" prompt / empty canvas
//   loading   — debounced query is in flight
//   results   — FlatList of MedicineCards
//   empty     — query returned 0 results
//   error     — network / server error

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
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
import { marketplaceApi } from "../src/features/marketplace/api/marketplace.api";
import { generateMarketplaceData } from "../src/features/marketplace/utils/generateMarketplaceData";
import type { EnrichedMedicine } from "../src/types/medicine";

// ── Debounce hook ─────────────────────────────────────────────
// Returns a value that only updates after `delay` ms of inactivity.
// Using a ref-based implementation to avoid stale-closure issues.

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Search query hook ─────────────────────────────────────────

function useSearchResults(query: string) {
  const trimmed = query.trim();

  const result = useQuery({
    queryKey: ["medicines", "search", trimmed],
    queryFn: () =>
      marketplaceApi.getMedicines({ search: trimmed, limit: 30 }),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 min — search results can change
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

// ── Quick suggestion chips ────────────────────────────────────
// Shown when the search field is empty to give users a starting point.

const QUICK_SUGGESTIONS = [
  "Paracetamol",
  "Vitamin D",
  "Metformin",
  "Omeprazole",
  "Cetirizine",
  "Amoxicillin",
];

// ── Main screen ───────────────────────────────────────────────

export default function SearchScreen() {
  const { colors } = useTheme();

  const [inputValue, setInputValue] = useState("");
  const debouncedQuery = useDebounce(inputValue, 400);
  const inputRef = useRef<TextInput>(null);

  // Focus the input on mount — the user is here to type.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const { medicines, isLoading, isError, refetch } =
    useSearchResults(debouncedQuery);

  // ── Handlers ─────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setInputValue("");
    inputRef.current?.focus();
  }, []);

  const handlePressMedicine = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}`);
  }, []);

  const handleSuggestionPress = useCallback((term: string) => {
    setInputValue(term);
  }, []);

  // ── FlatList renderers ────────────────────────────────────────

  const renderItem = useCallback<ListRenderItem<EnrichedMedicine>>(
    ({ item }) => (
      <MedicineCard medicine={item} onPress={handlePressMedicine} />
    ),
    [handlePressMedicine],
  );

  const keyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  // ── Derived state ─────────────────────────────────────────────

  const hasQuery = inputValue.trim().length >= 2;
  const isSearching = hasQuery && isLoading;
  const hasResults = medicines.length > 0;

  // ── Render ─────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Header: back + search input ──────────────────── */}
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
          <Ionicons name="search" size={18} color={colors.text.muted} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text.primary }]}
            placeholder="Search medicines, brands…"
            placeholderTextColor={colors.text.muted}
            value={inputValue}
            onChangeText={setInputValue}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {inputValue.length > 0 ? (
            <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear">
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name="camera-outline"
              size={18}
              color={colors.text.brand}
            />
          )}
        </View>
      </View>

      {/* ── Body ──────────────────────────────────────────── */}

      {/* IDLE — no query yet */}
      {!hasQuery && (
        <View style={styles.idleContainer}>
          <Text style={[styles.idleTitle, { color: colors.text.secondary }]}>
            What are you looking for?
          </Text>
          <Text style={[styles.idleHint, { color: colors.text.muted }]}>
            Search by medicine name, brand, or composition
          </Text>
          <View style={styles.suggestions}>
            {QUICK_SUGGESTIONS.map((term) => (
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
                  name="search-outline"
                  size={13}
                  color={colors.text.brand}
                />
                <Text
                  style={[styles.suggestionText, { color: colors.text.brand }]}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* LOADING */}
      {hasQuery && isSearching && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Searching…
          </Text>
        </View>
      )}

      {/* ERROR */}
      {hasQuery && isError && (
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

      {/* EMPTY — query but no results */}
      {hasQuery && !isSearching && !isError && !hasResults && (
        <View style={styles.center}>
          <Ionicons
            name="search-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            No results for "{debouncedQuery}"
          </Text>
          <Text style={[styles.centerSubtext, { color: colors.text.muted }]}>
            Try a different name or brand
          </Text>
        </View>
      )}

      {/* RESULTS */}
      {hasQuery && !isSearching && hasResults && (
        <>
          <View style={styles.resultsHeader}>
            <Text
              style={[styles.resultsCount, { color: colors.text.muted }]}
            >
              {medicines.length} result{medicines.length !== 1 ? "s" : ""} for{" "}
              <Text style={{ color: colors.text.secondary }}>
                "{debouncedQuery}"
              </Text>
            </Text>
          </View>
          <FlatList
            data={medicines}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
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
    paddingVertical: 0, // Android adds extra padding otherwise
  },
  // Idle state
  idleContainer: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing["2xl"],
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
  // Shared center states
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
  // Results
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