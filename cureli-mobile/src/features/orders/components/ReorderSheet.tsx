// src/features/orders/components/ReorderSheet.tsx
//
// Bottom sheet shown when customer taps Reorder on a completed order.
// Uses @gorhom/bottom-sheet v5 (already installed).
//
// Shows:
//   - Available items (can be added to cart)
//   - Unavailable items with reason
//   - "Add X items to cart" confirm button
//
// On confirm: calls cartStore.addItem for each available item,
// handles cart conflict (different branch) with Alert.

import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '../../../components/Dialog/DialogProvider';
import { useTheme } from '../../../theme/ThemeContext';
import { useCartStore } from '../../../store/cartStore';
import type { ReorderItemsResponse, ReorderAvailableItem } from '../../../types/order';

const UNAVAILABLE_REASON_LABELS: Record<string, string> = {
  not_listed:  'No longer listed',
  out_of_stock:'Out of stock',
  no_price:    'Price not available',
};

interface ReorderSheetProps {
  visible:   boolean;
  data:      ReorderItemsResponse;
  onClose:   () => void;
  onConfirm: () => void;
}

export function ReorderSheet({ visible, data, onClose, onConfirm }: ReorderSheetProps) {
  const { colors } = useTheme();
  const { confirm: confirmDialog } = useDialog();
  const addItem    = useCartStore((s) => s.addItem);
  const clearCart  = useCartStore((s) => s.clearCart);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => {
    // Taller sheet if there are unavailable items to show
    return data.unavailable.length > 0 ? ['60%', '85%'] : ['50%', '70%'];
  }, [data.unavailable.length]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={onClose}
      />
    ),
    [onClose],
  );

    const handleConfirm = useCallback(async () => {
    if (data.available.length === 0) return;

    const firstItem = data.available[0];
    const firstResult = addItem({
      variantId:            firstItem.variantId,
      skuId:                firstItem.skuId,
      name:                 firstItem.name,
      pricePerUnit:         firstItem.pricePerUnit,
      image:                firstItem.image,
      manufacturer:         firstItem.manufacturer,
      shopId:               firstItem.shopId,
      shopName:             firstItem.shopName,
      branchId:             firstItem.branchId,
      branchName:           firstItem.branchName,
      requiresPrescription: firstItem.requiresPrescription,
      category:             firstItem.category,
      branchLatitude:       firstItem.branchLatitude,
      branchLongitude:      firstItem.branchLongitude,
    });

    if (firstResult.status === 'conflict') {
      const confirmed = await confirmDialog({
        title: 'Cart Has Items',
        message: `Your cart contains items from ${firstResult.existingPharmacy.shopName}. Clear cart and add these items?`,
        confirmLabel: 'Clear & Add',
        cancelLabel: 'Cancel',
        destructive: true,
      });

      if (confirmed) {
        clearCart();
        addAllItems(data.available);
        onConfirm();
      }
      return;
    }

    const remaining = data.available.slice(1);
    addAllItems(remaining);
    onConfirm();
  }, [data.available, addItem, clearCart, onConfirm, confirmDialog]);

  const addAllItems = useCallback(
    (items: ReorderAvailableItem[]) => {
      for (const item of items) {
        addItem({
          variantId:            item.variantId,
          skuId:                item.skuId,
          name:                 item.name,
          pricePerUnit:         item.pricePerUnit,
          image:                item.image,
          manufacturer:         item.manufacturer,
          shopId:               item.shopId,
          shopName:             item.shopName,
          branchId:             item.branchId,
          branchName:           item.branchName,
          requiresPrescription: item.requiresPrescription,
          category:             item.category,
          branchLatitude:       item.branchLatitude,
          branchLongitude:      item.branchLongitude,
        });
      }
    },
    [addItem],
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border.default }}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
            Reorder Items
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Shop + Branch */}
        <Text style={[styles.shopLabel, { color: colors.text.muted, fontFamily: 'Inter_400Regular' }]}>
          {data.shop_name}{data.branch_name ? ` · ${data.branch_name}` : ''}
        </Text>

        {/* Available items */}
        {data.available.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary, fontFamily: 'Inter_600SemiBold' }]}>
              Available ({data.available.length})
            </Text>
            {data.available.map((item) => (
              <View
                key={item.variantId}
                style={[styles.itemRow, { borderBottomColor: colors.border.subtle }]}
              >
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemName, { color: colors.text.primary, fontFamily: 'Inter_500Medium' }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.itemQty, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
                  ₹{item.pricePerUnit.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Unavailable items */}
        {data.unavailable.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.status.warning, fontFamily: 'Inter_600SemiBold' }]}>
              Unavailable ({data.unavailable.length})
            </Text>
            {data.unavailable.map((item, index) => (
              <View
                key={index}
                style={[styles.itemRow, { borderBottomColor: colors.border.subtle }]}
              >
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemName, { color: colors.text.muted, fontFamily: 'Inter_500Medium' }]}
                    numberOfLines={1}
                  >
                    {item.medicine_name}
                  </Text>
                  <Text style={[styles.unavailableReason, { color: colors.status.warning, fontFamily: 'Inter_400Regular' }]}>
                    {UNAVAILABLE_REASON_LABELS[item.reason] ?? item.reason}
                  </Text>
                </View>
                <Ionicons name="close-circle-outline" size={18} color={colors.status.warning} />
              </View>
            ))}
          </View>
        )}

        {/* Confirm button */}
        {data.available.length > 0 && (
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.brand.primary }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Ionicons name="cart-outline" size={18} color="#ffffff" />
            <Text style={[styles.confirmBtnText, { fontFamily: 'Inter_700Bold' }]}>
              Add {data.available.length} item{data.available.length !== 1 ? 's' : ''} to Cart
            </Text>
          </TouchableOpacity>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:              1,
    paddingHorizontal: 20,
    paddingBottom:     24,
  },
  sheetHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom:   4,
  },
  sheetTitle: { fontSize: 17 },
  shopLabel:  { fontSize: 13, marginBottom: 16 },

  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemInfo:          { flex: 1 },
  itemName:          { fontSize: 14 },
  itemQty:           { fontSize: 12, marginTop: 2 },
  unavailableReason: { fontSize: 12, marginTop: 2 },
  itemPrice:         { fontSize: 14, flexShrink: 0 },

  confirmBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 15,
    borderRadius:   12,
    marginTop:      8,
  },
  confirmBtnText: { fontSize: 15, color: '#ffffff' },
});