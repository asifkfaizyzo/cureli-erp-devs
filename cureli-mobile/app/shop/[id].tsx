// app/shop/[id].tsx
//
// Shop profile screen — Root Stack screen (tab bar hidden).
// Route: /shop/:id  where :id is the shop's UUID.
//
// CHANGE: MedicineRow now uses a quantity stepper (− count +) instead of
// the old "Added (n)" button. Two new handlers are wired up:
//   handleIncrementCart  — increments an already-added item
//   handleDecrementCart  — decrements; removes item when quantity reaches 0

import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../src/theme/ThemeContext";
import { Typography } from "../../src/theme/typography";
import { Spacing } from "../../src/theme/spacing";
import { Radius } from "../../src/theme/radius";

import { useShopProfile } from "../../src/features/marketplace/hooks/useShopProfile";
import {
  useShopMedicines,
  type EnrichedBranchMedicine,
} from "../../src/features/marketplace/hooks/useShopMedicines";
import { useCartStore } from "../../src/store/cartStore";

import { ShopHeader } from "../../src/features/marketplace/components/shop/ShopHeader";
import { ShopIdentity } from "../../src/features/marketplace/components/shop/ShopIdentity";
import { BranchSelector } from "../../src/features/marketplace/components/shop/BranchSelector";
import { CartConflictDialog } from "../../src/features/marketplace/components/shop/CartConflictDialog";
import { MedicineRow } from "../../src/features/marketplace/components/shop/MedicineRow";

// ── Debounce hook ─────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Screen ────────────────────────────────────────────────────

export default function ShopScreen() {
  const { colors } = useTheme();
  const { id: shopId } = useLocalSearchParams<{ id: string }>();

  // ── Cart ──────────────────────────────────────────────────
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartItems = useCartStore((state) => state.items);
  const cartPharmacy = useCartStore((state) => state.cartPharmacy);

  // ── NEW: increment / decrement selectors ──────────────────
  // These must already exist in your cartStore, or see the note below.
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);

  // ── Conflict dialog ───────────────────────────────────────
  const [conflictVisible, setConflictVisible] = useState(false);
  const pendingAddRef = useRef<EnrichedBranchMedicine | null>(null);

  // ── Profile ───────────────────────────────────────────────
  const {
    profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useShopProfile(shopId ?? "", null);

  // ── Branch selection ──────────────────────────────────────
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (profile && profile.branches.length > 0 && !selectedBranchId) {
      const firstEnabled = profile.branches.find((b) => b.marketplaceEnabled);
      if (firstEnabled) setSelectedBranchId(firstEnabled.branchId);
    }
  }, [profile, selectedBranchId]);

  useEffect(() => {
    setSelectedBranchId(null);
  }, [shopId]);

  // ── In-shop search ────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  // ── Medicines ─────────────────────────────────────────────
  const {
    medicines,
    total,
    isLoading: isMedicinesLoading,
    isError: isMedicinesError,
    refetch: refetchMedicines,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useShopMedicines(
    shopId ?? "",
    selectedBranchId ?? "",
    debouncedSearch,
  );

  // ── Cart quantity map ─────────────────────────────────────
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) map.set(item.variantId, item.quantity);
    return map;
  }, [cartItems]);

  // ── Selected branch ───────────────────────────────────────
  const selectedBranch = useMemo(
    () =>
      profile?.branches.find((b) => b.branchId === selectedBranchId) ?? null,
    [profile, selectedBranchId],
  );

  // ── Handlers ──────────────────────────────────────────────

  const handleBranchSelect = useCallback((branchId: string) => {
    setSelectedBranchId(branchId);
    setSearchInput("");
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Initial add — triggers conflict dialog when needed
  const handleAddToCart = useCallback(
    (item: EnrichedBranchMedicine) => {
      if (!profile || !selectedBranch) return;

      const result = addItem({
        variantId: item.variantId,
        skuId: item.skuId,
        name: item.name,
        pricePerUnit: item.listingPrice ?? item.marketplace.startsAt,
        image: item.image,
        manufacturer: item.manufacturer,
        shopId: profile.shopId,
        shopName: profile.name,
        branchId: selectedBranch.branchId,
        branchName: selectedBranch.branchName ?? profile.name,
      });

      if (result.status === "conflict") {
        pendingAddRef.current = item;
        setConflictVisible(true);
      }
    },
    [addItem, profile, selectedBranch],
  );

  // ── NEW: stepper handlers ─────────────────────────────────
  // incrementItem(variantId) adds 1 to an existing cart line.
  // decrementItem(variantId) subtracts 1; removes the line at 0.
  // Both are no-ops if the variantId is not in the cart.

  const handleIncrementCart = useCallback(
    (item: EnrichedBranchMedicine) => {
      incrementItem(item.variantId);
    },
    [incrementItem],
  );

  const handleDecrementCart = useCallback(
    (item: EnrichedBranchMedicine) => {
      decrementItem(item.variantId);
    },
    [decrementItem],
  );

  // ── Conflict resolution ───────────────────────────────────

  const handleConflictConfirm = useCallback(() => {
    setConflictVisible(false);
    const pending = pendingAddRef.current;
    if (!pending || !profile || !selectedBranch) return;

    clearCart();
    addItem({
      variantId: pending.variantId,
      skuId: pending.skuId,
      name: pending.name,
      pricePerUnit: pending.listingPrice ?? pending.marketplace.startsAt,
      image: pending.image,
      manufacturer: pending.manufacturer,
      shopId: profile.shopId,
      shopName: profile.name,
      branchId: selectedBranch.branchId,
      branchName: selectedBranch.branchName ?? profile.name,
    });

    pendingAddRef.current = null;
  }, [clearCart, addItem, profile, selectedBranch]);

  const handleConflictCancel = useCallback(() => {
    setConflictVisible(false);
    pendingAddRef.current = null;
  }, []);

  // ── FlatList renderers ────────────────────────────────────

  const renderMedicine = useCallback<ListRenderItem<EnrichedBranchMedicine>>(
    ({ item }) => (
      <MedicineRow
        item={item}
        onAdd={handleAddToCart}
        onIncrement={handleIncrementCart}
        onDecrement={handleDecrementCart}
        cartQuantity={cartQuantityMap.get(item.variantId) ?? 0}
        colors={colors}
      />
    ),
    [
      handleAddToCart,
      handleIncrementCart,
      handleDecrementCart,
      cartQuantityMap,
      colors,
    ],
  );

  const keyExtractor = useCallback(
    (item: EnrichedBranchMedicine) => item.variantId,
    [],
  );

  // ── List header ───────────────────────────────────────────

  const ListHeader = useMemo(() => {
    if (!profile) return null;

    return (
      <View>
        <ShopIdentity profile={profile} colors={colors} />

        {/* Branch selector */}
        {profile.branches.length > 0 && selectedBranchId ? (
          <View style={styles.branchSection}>
            <Text
              style={[styles.branchLabel, { color: colors.text.secondary }]}
            >
              {profile.branches.length === 1
                ? "Branch"
                : `${profile.branches.length} branches`}
            </Text>
            <BranchSelector
              branches={profile.branches}
              selectedBranchId={selectedBranchId}
              onSelect={handleBranchSelect}
              colors={colors}
            />
          </View>
        ) : null}

        {/* In-shop search */}
        {selectedBranchId ? (
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.input,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.text.muted}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: colors.text.primary },
                ]}
                placeholder="Search medicines in this branch..."
                placeholderTextColor={colors.text.muted}
                value={searchInput}
                onChangeText={setSearchInput}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchInput.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchInput("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Medicines section label */}
        {selectedBranchId && !isMedicinesLoading && !isMedicinesError ? (
          <View style={styles.medicinesHeader}>
            <Text
              style={[
                styles.medicinesTitle,
                { color: colors.text.primary },
              ]}
            >
              {debouncedSearch.trim().length >= 1
                ? `Results for "${debouncedSearch}"`
                : "Available Medicines"}
            </Text>
            <Text
              style={[styles.medicinesCount, { color: colors.text.muted }]}
            >
              {total} items
            </Text>
          </View>
        ) : null}
      </View>
    );
  }, [
    profile,
    selectedBranchId,
    searchInput,
    handleBranchSelect,
    isMedicinesLoading,
    isMedicinesError,
    debouncedSearch,
    total,
    colors,
  ]);

  // ── Footer ────────────────────────────────────────────────

  const ListFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
        </View>
      ) : (
        <View style={styles.footerSpacer} />
      ),
    [isFetchingNextPage, colors.brand.primary],
  );

  // ── Empty ─────────────────────────────────────────────────

  const ListEmpty = useCallback(
    () =>
      isMedicinesLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Loading medicines…
          </Text>
        </View>
      ) : isMedicinesError ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text
            style={[styles.centerText, { color: colors.text.secondary }]}
          >
            Failed to load medicines
          </Text>
          <Text
            style={[styles.retryText, { color: colors.text.brand }]}
            onPress={() => refetchMedicines()}
          >
            Tap to retry
          </Text>
        </View>
      ) : !selectedBranchId ? (
        <View style={styles.center}>
          <Ionicons
            name="git-branch-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text
            style={[styles.centerText, { color: colors.text.secondary }]}
          >
            Select a branch to view medicines
          </Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons
            name="medkit-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text
            style={[styles.centerText, { color: colors.text.secondary }]}
          >
            {debouncedSearch.trim().length >= 1
              ? `No medicines found for "${debouncedSearch}"`
              : "No medicines listed in this branch"}
          </Text>
        </View>
      ),
    [
      isMedicinesLoading,
      isMedicinesError,
      selectedBranchId,
      debouncedSearch,
      refetchMedicines,
      colors,
    ],
  );

  // ── Profile loading / error states ────────────────────────

  if (isProfileLoading) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        <ShopHeader title="" colors={colors} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Loading pharmacy…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isProfileError || !profile) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        <ShopHeader title="Pharmacy" colors={colors} />
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text
            style={[styles.centerText, { color: colors.text.secondary }]}
          >
            Pharmacy not found
          </Text>
          <Text
            style={[styles.retryText, { color: colors.text.brand }]}
            onPress={() => refetchProfile()}
          >
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const existingPharmacy = cartPharmacy();

  // ── Main render ───────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      <ShopHeader title={profile.name} colors={colors} />

      <FlatList
        data={medicines}
        renderItem={renderMedicine}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={
          medicines.length === 0
            ? styles.emptyContent
            : styles.listContent
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
      />

      <CartConflictDialog
        visible={conflictVisible}
        existingShopName={existingPharmacy?.shopName ?? ""}
        existingBranchName={existingPharmacy?.branchName ?? ""}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  branchSection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  branchLabel: {
    ...Typography.smallMedium,
  },
  searchSection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    paddingVertical: 0,
  },
  medicinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  medicinesTitle: { ...Typography.bodyMedium },
  medicinesCount: { ...Typography.small },
  listContent: { paddingBottom: Spacing["3xl"] },
  emptyContent: { flexGrow: 1 },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  footerSpacer: { height: Spacing["2xl"] },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["4xl"],
    gap: Spacing.sm,
  },
  centerText: {
    ...Typography.h4,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryText: { ...Typography.body, textAlign: "center" },
});