// src/features/cart/components/AddressPickerSheet.tsx

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import type { Address } from '../../profile/types/profile.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

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
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const { addresses, isLoading } = useAddresses();
  const selectAddress = useDeliveryLocationStore((s) => s.selectAddress);
  const currentLocation = useDeliveryLocationStore((s) => s.location);
  const selectedAddressId = currentLocation.addressId ?? null;

  // ── Auto-select when nothing is selected yet ──────────────
  //
  // Fires whenever `addresses` changes (i.e. after React Query
  // refetches on remount following a new address being created).
  //
  // Conditions for auto-select:
  //   1. Not currently loading
  //   2. There is at least one address
  //   3. Nothing is selected yet (addressId is null)
  //
  // Priority: default address first, then first in list.
  // This covers the "first-time user just created an address
  // and came back to cart" flow without overriding a manual pick.

  useEffect(() => {
    if (isLoading) return;
    if (addresses.length === 0) return;
    if (selectedAddressId !== null) return;

    const toSelect =
      addresses.find((a) => a.is_default) ?? addresses[0];

    selectAddress({
      source: 'saved',
      area: toSelect.custom_label ?? toSelect.label,
      addressLine: `${toSelect.city}, ${toSelect.state} ${toSelect.pincode}`,
      latitude: toSelect.latitude ?? null,
      longitude: toSelect.longitude ?? null,
      addressId: toSelect.id,
    });
  }, [addresses, isLoading, selectedAddressId, selectAddress]);

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
    setTimeout(() => {
      router.push('/profile/address/new' as any);
    }, 300);
  }, [onClose]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {addresses.map((address) => (
          <AddressRow
            key={address.id}
            address={address}
            isSelected={address.id === selectedAddressId}
            onSelect={handleSelect}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* ── Backdrop ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
        accessibilityLabel="Close address picker"
      />

      {/* ── Sheet ─────────────────────────────────────────── */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background.page,
            maxHeight: MAX_SHEET_HEIGHT,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* ── Drag handle ───────────────────────────────── */}
        <View style={styles.dragHandleRow}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: colors.border.default },
            ]}
          />
        </View>

        {/* ── Header ────────────────────────────────────── */}
        <View
          style={[
            styles.sheetHeader,
            {
              borderBottomColor: colors.border.subtle,
            },
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

        {/* ── Address list ─────────────────────────────── */}
        <View style={styles.contentArea}>{renderContent()}</View>

        {/* ── Add new address ──────────────────────────── */}
        <View
          style={[
            styles.addNewContainer,
            {
              borderTopColor: colors.border.subtle,
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
            <MaterialIcons
              name="add-location-alt"
              size={18}
              color={brandColor}
            />
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
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Modal layers ──────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },

  // ── Drag handle ───────────────────────────────────────────
  dragHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // ── Header ────────────────────────────────────────────────
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 17 },

  // ── Content area ──────────────────────────────────────────
  contentArea: {
    flexShrink: 1,
  },

  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
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
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  // ── Address row ───────────────────────────────────────────
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

  // ── Add new ───────────────────────────────────────────────
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