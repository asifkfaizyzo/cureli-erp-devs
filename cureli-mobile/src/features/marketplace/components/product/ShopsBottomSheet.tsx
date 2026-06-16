// src/features/marketplace/components/product/ShopsBottomSheet.tsx
//
// Bottom sheet showing branches that stock a specific medicine.
// Uses @gorhom/bottom-sheet for smooth native gestures + dynamic sizing.
//
// Handles all cart logic for add-from-detail-screen:
//   - Reads cartItems to derive per-branch quantity
//   - Shows CartConflictDialog when conflict detected
//   - Add / increment / decrement work identically to the shop screen
//
// The "Go to Cart" floating bar is hidden while this sheet is open
// (controlled by parent via sheetVisible state).

import React, { useCallback, useRef, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { MedicineShopListing } from "../../../../types/medicine";
import type { EnrichedMedicineDetail } from "../../../../types/medicine";
import { useCartStore } from "../../../../store/cartStore";
import { CartConflictDialog } from "../shop/CartConflictDialog";
import { ShopListingRow } from "./ShopListingRow";

interface ShopsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  variant: EnrichedMedicineDetail;
  shops: MedicineShopListing[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function ShopsBottomSheet({
  visible,
  onClose,
  variant,
  shops,
  isLoading,
  isError,
  onRetry,
  colors,
}: ShopsBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);

  // ── Snap points ───────────────────────────────────────────
  // Dynamic: content-based for small lists, max 85% for large lists.
  // The sheet measures its content and picks the smaller of content
  // height or the max snap point.
  const snapPoints = useMemo(() => {
    if (isLoading || isError || shops.length === 0) {
      // Loading / error / empty — small sheet
      return ["40%"];
    }
    if (shops.length === 1) {
      return ["45%"];
    }
    if (shops.length === 2) {
      return ["60%"];
    }
    // 3+ shops — allow scrolling
    return ["65%", "85%"];
  }, [shops.length, isLoading, isError]);

  // ── Sheet lifecycle ───────────────────────────────────────
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  // Open/close the sheet based on visible prop
  React.useEffect(() => {
  if (visible) {
    const t = setTimeout(() => {
      sheetRef.current?.snapToIndex(0);
    }, 50);
    return () => clearTimeout(t);
  } else {
    sheetRef.current?.close();
  }
}, [visible]);

  // ── Backdrop ──────────────────────────────────────────────
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  // ── Cart ──────────────────────────────────────────────────
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const cartItems = useCartStore((s) => s.items);

  // ── Derive cart state from items directly ─────────────────
  // FIX: Previously used cartPharmacy() in a useMemo which never
  // re-computed because the function reference was stable.
  // Now we derive branchId and quantity directly from cartItems,
  // which IS reactive (zustand triggers re-render on items change).
  const cartBranchId = useMemo(() => {
    if (cartItems.length === 0) return null;
    return cartItems[0].branchId;
  }, [cartItems]);

  const cartQuantityForVariant = useMemo(() => {
    const item = cartItems.find((i) => i.variantId === variant.variantId);
    return item?.quantity ?? 0;
  }, [cartItems, variant.variantId]);

  // For the conflict dialog we need the existing pharmacy info
  const existingPharmacyInfo = useMemo(() => {
    if (cartItems.length === 0) return null;
    return {
      shopId: cartItems[0].shopId,
      shopName: cartItems[0].shopName,
      branchId: cartItems[0].branchId,
      branchName: cartItems[0].branchName,
    };
  }, [cartItems]);

  // ── Conflict dialog ───────────────────────────────────────
  const [conflictVisible, setConflictVisible] = useState(false);
  const pendingShopRef = useRef<MedicineShopListing | null>(null);

  // ── Add handler ───────────────────────────────────────────
  const handleAdd = useCallback(
    (shop: MedicineShopListing) => {
      const result = addItem({
        variantId: variant.variantId,
        skuId: variant.skuId,
        name: variant.name,
        pricePerUnit: shop.listingPrice ?? 0,
        image: variant.image,
        manufacturer: variant.manufacturer,
        shopId: shop.shopId,
        shopName: shop.shopName,
        branchId: shop.branchId,
        branchName: shop.branchName ?? shop.shopName,
        requiresPrescription: shop.requiresPrescription,
        category: variant.category,
      });

      if (result.status === "conflict") {
        pendingShopRef.current = shop;
        setConflictVisible(true);
      }
    },
    [addItem, variant],
  );

  const handleIncrement = useCallback(
    (_shop: MedicineShopListing) => {
      incrementItem(variant.variantId);
    },
    [incrementItem, variant.variantId],
  );

  const handleDecrement = useCallback(
    (_shop: MedicineShopListing) => {
      decrementItem(variant.variantId);
    },
    [decrementItem, variant.variantId],
  );

  // ── Conflict resolution ───────────────────────────────────
  const handleConflictConfirm = useCallback(() => {
    setConflictVisible(false);
    const shop = pendingShopRef.current;
    if (!shop) return;

    clearCart();
    addItem({
      variantId: variant.variantId,
      skuId: variant.skuId,
      name: variant.name,
      pricePerUnit: shop.listingPrice ?? 0,
      image: variant.image,
      manufacturer: variant.manufacturer,
      shopId: shop.shopId,
      shopName: shop.shopName,
      branchId: shop.branchId,
      branchName: shop.branchName ?? shop.shopName,
      requiresPrescription: shop.requiresPrescription,
      category: variant.category,
    });

    pendingShopRef.current = null;
  }, [clearCart, addItem, variant]);

  const handleConflictCancel = useCallback(() => {
    setConflictVisible(false);
    pendingShopRef.current = null;
  }, []);

  // ── Content ───────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Finding pharmacies…
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContent}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            Failed to load pharmacies
          </Text>
          <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
            <Text style={[styles.retryText, { color: colors.text.brand }]}>
              Tap to retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (shops.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons
            name="storefront-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            No pharmacy stocks this medicine near you
          </Text>
        </View>
      );
    }

    return (
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {shops.map((shop) => {
          // Show stepper only for the branch currently in the cart.
          // All other branches show plain ADD button.
          const qty =
            cartBranchId === shop.branchId ? cartQuantityForVariant : 0;

          return (
            <ShopListingRow
              key={`${shop.shopId}-${shop.branchId}`}
              shop={shop}
              cartQuantity={qty}
              onAdd={handleAdd}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              colors={colors}
            />
          );
        })}
      </BottomSheetScrollView>
    );
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={[
          styles.handle,
          { backgroundColor: colors.border.default },
        ]}
        backgroundStyle={{
          backgroundColor: colors.background.page,
          borderTopLeftRadius: Radius.xl,
          borderTopRightRadius: Radius.xl,
        }}
      >
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: colors.border.subtle }]}
        >
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Available at
            </Text>
            {!isLoading && !isError && shops.length > 0 ? (
              <Text style={[styles.headerCount, { color: colors.text.muted }]}>
                {shops.length} {shops.length === 1 ? "pharmacy" : "pharmacies"}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        {renderContent()}
      </BottomSheet>

      {/* Conflict dialog */}
      <CartConflictDialog
        visible={conflictVisible}
        existingShopName={existingPharmacyInfo?.shopName ?? ""}
        existingBranchName={existingPharmacyInfo?.branchName ?? ""}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        colors={colors}
      />
    </>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    ...Typography.h4,
  },
  headerCount: {
    ...Typography.small,
  },
  list: {
    paddingTop: Spacing.md,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["4xl"],
  },
  centerText: {
    ...Typography.h4,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryText: {
    ...Typography.body,
    textAlign: "center",
  },
});
