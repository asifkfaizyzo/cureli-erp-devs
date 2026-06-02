// app/shop/[id].tsx
//
// Shop profile screen — Root Stack screen (tab bar hidden).
// Route: /shop/:id  where :id is the shop's UUID.
//
// ── BRANCH SELECTION (rewritten) ──────────────────────────────
// Previous design used two competing effects + a single
// `selectedBranchId` state:
//   - Effect A: auto-select first enabled branch when profile loads
//   - Effect B: reset selectedBranchId to null on shopId change
// On a cached re-visit the profile arrives synchronously with a stable
// reference, so Effect A never re-ran after Effect B nulled the branch.
// Result: branch selector + medicines vanished on the second visit.
//
// New design DERIVES the effective branch instead of racing effects:
//   - userSelectedBranchId: set ONLY when the user taps a branch.
//   - defaultBranchId: derived from profile (first enabled, else first).
//   - effectiveBranchId = userSelectedBranchId ?? defaultBranchId.
//   - One effect clears userSelectedBranchId when shopId changes; the
//     derived default fills in immediately, so there is no blank state.
// Deterministic whether profile comes from network or cache.
//
// ── LOCATION (new) ────────────────────────────────────────────
// The screen now reads the customer's resolved delivery location and
// passes lat/lng to useShopProfile. The backend sorts branches
// nearest-first when location is present, so the derived default
// branch becomes the NEAREST enabled branch. Fetch-immediately: the
// profile query key includes lat/lng, so if location resolves after
// first paint the query refetches and branches re-sort. A branch the
// user has explicitly tapped is preserved across that re-sort.
//
// ── GO TO CART BAR (new) ──────────────────────────────────────
// A floating "Go to Cart" bar appears at the bottom of the screen
// whenever cartCount > 0. It shows:
//   Left  : item count badge
//   Centre: "Go to Cart" label
//   Right : running ₹ total
// Tapping it navigates to /cart.
// The FlatList contentContainerStyle gains extra bottom padding when
// the bar is visible so the last medicine row is never hidden behind it.

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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useDeliveryLocation } from "../../src/hooks/useDeliveryLocation";

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

// ── Constants ─────────────────────────────────────────────────

// Height of the floating "Go to Cart" bar (excluding safe-area inset).
const CART_BAR_HEIGHT = 64;

// ── Screen ────────────────────────────────────────────────────

export default function ShopScreen() {
  const { colors } = useTheme();
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // ── Delivery location ─────────────────────────────────────
  // location.latitude / longitude are null for the "fallback" source
  // and populated for "gps" / "saved". We only pass a location object
  // to the profile query when BOTH coords are present.
  const { location } = useDeliveryLocation();

  const profileLocation = useMemo(
    () =>
      location.latitude != null && location.longitude != null
        ? { lat: location.latitude, lng: location.longitude }
        : null,
    [location.latitude, location.longitude],
  );

  // ── Cart ──────────────────────────────────────────────────
  const addItem      = useCartStore((state) => state.addItem);
  const clearCart    = useCartStore((state) => state.clearCart);
  const cartItems    = useCartStore((state) => state.items);
  const cartCount    = useCartStore((state) => state.cartCount);
  const cartPharmacy = useCartStore((state) => state.cartPharmacy);
  const cartTotal    = useCartStore((state) => state.cartTotal);
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
  } = useShopProfile(shopId ?? "", profileLocation);

  // ── Branch selection (derived) ────────────────────────────
  // Only the user's explicit choice lives in state. Everything else
  // is derived, so cached re-visits never get stuck on a stale null.
  const [userSelectedBranchId, setUserSelectedBranchId] = useState<
    string | null
  >(null);

  // Reset the user's explicit choice when the shop changes. Safe now:
  // the derived default (below) immediately fills the gap, so there is
  // no window where the screen has no branch selected.
  useEffect(() => {
    setUserSelectedBranchId(null);
  }, [shopId]);

  // Default branch derived from the profile: first marketplace-enabled
  // branch, falling back to the first branch if none are enabled.
  // Because the backend sorts branches nearest-first when location is
  // present, the first enabled branch IS the nearest enabled branch.
  const defaultBranchId = useMemo(() => {
    if (!profile || profile.branches.length === 0) return null;
    const firstEnabled = profile.branches.find((b) => b.marketplaceEnabled);
    return (firstEnabled ?? profile.branches[0]).branchId;
  }, [profile]);

  // The branch actually in effect: user's tap wins, else the default.
  // Guard: if the user-selected branch is no longer present in the
  // current profile (e.g. profile changed), fall back to the default.
  const effectiveBranchId = useMemo(() => {
    if (
      userSelectedBranchId &&
      profile?.branches.some((b) => b.branchId === userSelectedBranchId)
    ) {
      return userSelectedBranchId;
    }
    return defaultBranchId;
  }, [userSelectedBranchId, defaultBranchId, profile]);

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
    effectiveBranchId ?? "",
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
      profile?.branches.find((b) => b.branchId === effectiveBranchId) ?? null,
    [profile, effectiveBranchId],
  );

  // ── Bottom padding for FlatList ───────────────────────────
  // When the "Go to Cart" bar is visible we add extra bottom padding
  // so the last medicine row is never hidden behind it.
  // bar height + its own bottom margin (Spacing.lg) + safe-area inset.
  const listBottomPadding = useMemo(() => {
    if (cartCount === 0) return Spacing["3xl"];
    return CART_BAR_HEIGHT + Spacing.lg + insets.bottom + Spacing.lg;
  }, [cartCount, insets.bottom]);

  // ── Handlers ──────────────────────────────────────────────

  const handleBranchSelect = useCallback((branchId: string) => {
    setUserSelectedBranchId(branchId);
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

  // ── Stepper handlers ──────────────────────────────────────

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

  const handleGoToCart = useCallback(() => {
    router.push("/cart" as any);
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
        {profile.branches.length > 0 && effectiveBranchId ? (
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
              selectedBranchId={effectiveBranchId}
              onSelect={handleBranchSelect}
              colors={colors}
            />
          </View>
        ) : null}

        {/* In-shop search */}
        {effectiveBranchId ? (
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
        {effectiveBranchId && !isMedicinesLoading && !isMedicinesError ? (
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
    effectiveBranchId,
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
      ) : !effectiveBranchId ? (
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
      effectiveBranchId,
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

  // ── Running cart total (for the "Go to Cart" bar) ─────────
  const runningTotal = cartTotal();

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
        contentContainerStyle={[
          medicines.length === 0
            ? styles.emptyContent
            : styles.listContent,
          // Extra bottom padding so the last row clears the cart bar
          { paddingBottom: listBottomPadding },
        ]}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
      />

      {/* ── Floating "Go to Cart" bar ── */}
      {cartCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleGoToCart}
          accessibilityRole="button"
          accessibilityLabel={`Go to cart. ${cartCount} items. Total ₹${runningTotal.toFixed(0)}`}
          style={[
            styles.cartBar,
            {
              backgroundColor: colors.brand.primary,
              bottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          {/* Left: item count badge */}
          <View style={styles.cartBadgeWrap}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>

          {/* Centre: label */}
          <Text style={styles.cartBarLabel}>Go to Cart</Text>

          {/* Right: running total */}
          <Text style={styles.cartBarTotal}>
            ₹{runningTotal.toFixed(0)}
          </Text>
        </TouchableOpacity>
      )}

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

  // ── Branch / search / medicines header sections ───────────
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

  // ── List layout ───────────────────────────────────────────
  // paddingBottom is set dynamically via listBottomPadding so we
  // only keep the non-bottom parts here.
  listContent: {},
  emptyContent: { flexGrow: 1 },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  footerSpacer: { height: Spacing["2xl"] },

  // ── Centered empty / loading states ──────────────────────
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

  // ── Floating "Go to Cart" bar ─────────────────────────────
  // `bottom` is set dynamically to respect the device safe-area inset.
  cartBar: {
    position: "absolute",
    left: Spacing.base,
    right: Spacing.base,
    height: CART_BAR_HEIGHT,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    // Shadow (Android)
    elevation: 8,
  },
  cartBadgeWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  cartBadgeText: {
    color: "#ffffff",
    ...Typography.smallBold,
    fontSize: 14,
  },
  cartBarLabel: {
    flex: 1,
    color: "#ffffff",
    ...Typography.bodyMedium,
    textAlign: "center",
  },
  cartBarTotal: {
    color: "#ffffff",
    ...Typography.bodyMedium,
  },
});