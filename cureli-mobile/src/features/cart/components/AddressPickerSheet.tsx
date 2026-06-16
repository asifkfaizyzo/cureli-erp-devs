// src/features/cart/components/AddressPickerSheet.tsx
//
// Bottom sheet address picker for cart and checkout screens.
//
// On selecting an address:
//   - Calls deliveryLocationStore.selectAddress() with the address data
//   - Closes the sheet
//   - Does NOT navigate away
//
// "Add new address" button navigates to the address form screen.
//
// Pattern mirrors ShopsBottomSheet — same gorhom/bottom-sheet setup.

import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { Radius } from '../../../theme/radius';
import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import type { Address } from '../../profile/types/profile.types';

interface AddressPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ── Single address row ────────────────────────────────────────

function AddressRow({
  address,
  isSelected,
  onSelect,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: (address: Address) => void;
}) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const labelIcon =
    address.label === 'Home'
      ? 'home'
      : address.label === 'Work'
        ? 'business'
        : 'location-on';

  return (
    <TouchableOpacity
      onPress={() => onSelect(address)}
      activeOpacity={0.75}
      style={[
        styles.addressRow,
        {
          backgroundColor: isSelected
            ? colors.background.tint
            : colors.background.card,
          borderColor: isSelected ? brandColor : colors.border.default,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${address.custom_label ?? address.label}, ${address.address_line_1}, ${address.city}`}
    >
      {/* Icon */}
      <View
        style={[
          styles.addressIcon,
          {
            backgroundColor: isSelected
              ? brandColor + '20'
              : colors.background.tint,
          },
        ]}
      >
        <MaterialIcons
          name={labelIcon as any}
          size={18}
          color={isSelected ? brandColor : colors.text.muted}
        />
      </View>

      {/* Text */}
      <View style={styles.addressText}>
        <Text
          style={[
            styles.addressLabel,
            {
              color: isSelected ? brandColor : colors.text.primary,
              fontFamily: 'Inter_600SemiBold',
            },
          ]}
        >
          {address.custom_label ?? address.label}
        </Text>
        <Text
          style={[
            styles.addressLine,
            { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
          ]}
          numberOfLines={2}
        >
          {[
            address.address_line_1,
            address.address_line_2,
            address.city,
            address.state,
            address.pincode,
          ]
            .filter(Boolean)
            .join(', ')}
        </Text>
        {address.recipient_name ? (
          <Text
            style={[
              styles.addressRecipient,
              { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
            ]}
          >
            For: {address.recipient_name}
          </Text>
        ) : null}
      </View>

      {/* Selected indicator */}
      {isSelected ? (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={brandColor}
          style={{ flexShrink: 0 }}
        />
      ) : (
        <View
          style={[
            styles.unselectedDot,
            { borderColor: colors.border.default },
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

// ── Sheet ─────────────────────────────────────────────────────

export function AddressPickerSheet({
  visible,
  onClose,
}: AddressPickerSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const { addresses, isLoading } = useAddresses();
  const selectAddress = useDeliveryLocationStore((s) => s.selectAddress);
  const currentLocation = useDeliveryLocationStore((s) => s.location);

  // ── Snap points ───────────────────────────────────────────
  const snapPoints = useMemo(() => {
    if (isLoading || addresses.length === 0) return ['30%'];
    if (addresses.length === 1) return ['30%'];
    if (addresses.length === 2) return ['50%'];
    return ['65%', '85%'];
  }, [addresses.length, isLoading]);

  // ── Open / close ──────────────────────────────────────────
  useEffect(() => {
  if (visible) {
    // Use a small delay so the sheet mounts before we try to open it.
    // Without this, snapToIndex can run before the native view is ready
    // on first mount, especially on Android 15.
    const t = setTimeout(() => {
      sheetRef.current?.snapToIndex(1);
    }, 50);
    return () => clearTimeout(t);
  } else {
    sheetRef.current?.close();
  }
}, [visible]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

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

  // ── Select handler ────────────────────────────────────────
  const handleSelect = useCallback(
    (address: Address) => {
      selectAddress({
        source: 'saved',
        area: address.custom_label ?? address.label,
        addressLine: `${address.city}, ${address.state} ${address.pincode}`,
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null,
        addressId: address.id,
      });
      onClose();
    },
    [selectAddress, onClose],
  );

  const handleAddNew = useCallback(() => {
    onClose();
    // Small delay so sheet closes before navigating
    setTimeout(() => {
      router.push('/profile/address/new' as any);
    }, 300);
  }, [onClose]);

  // ── Currently selected address ID ─────────────────────────
  const selectedAddressId = currentLocation.addressId ?? null;

  // ── Content ───────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text
            style={[
              styles.centerText,
              { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Loading addresses…
          </Text>
        </View>
      );
    }

    if (addresses.length === 0) {
      return (
        <View style={styles.centerContent}>
          <MaterialIcons
            name="location-off"
            size={44}
            color={colors.text.faint}
          />
          <Text
            style={[
              styles.centerText,
              {
                color: colors.text.secondary,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            No saved addresses
          </Text>
          <Text
            style={[
              styles.centerSub,
              { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Add an address to continue
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
        {addresses.map((address) => (
          <AddressRow
            key={address.id}
            address={address}
            isSelected={address.id === selectedAddressId}
            onSelect={handleSelect}
          />
        ))}
      </BottomSheetScrollView>
    );
  };

  return (
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
      {/* ── Header ────────────────────────────────────────── */}
      <View
        style={[
          styles.sheetHeader,
          { borderBottomColor: colors.border.subtle },
        ]}
      >
        <Text
          style={[
            styles.sheetTitle,
            { color: colors.text.primary, fontFamily: 'Inter_700Bold' },
          ]}
        >
          Deliver to
        </Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* ── Address list ──────────────────────────────────── */}
      {renderContent()}

      {/* ── Add new address button ────────────────────────── */}
      <View
        style={[
          styles.addNewContainer,
          {
            borderTopColor: colors.border.subtle,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.background.page,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleAddNew}
          activeOpacity={0.75}
          style={[
            styles.addNewButton,
            {
              borderColor: brandColor,
              backgroundColor: colors.background.tint,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
        >
          <MaterialIcons name="add-location-alt" size={18} color={brandColor} />
          <Text
            style={[
              styles.addNewText,
              { color: brandColor, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Add new address
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17 },

  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  centerText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  centerSub: {
    fontSize: 13,
    textAlign: 'center',
  },

  list: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  addressIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addressText: {
    flex: 1,
    gap: 2,
  },
  addressLabel: { fontSize: 14 },
  addressLine: { fontSize: 12, lineHeight: 17 },
  addressRecipient: { fontSize: 11, marginTop: 1 },
  unselectedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    flexShrink: 0,
  },

  addNewContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addNewText: { fontSize: 14 },
});