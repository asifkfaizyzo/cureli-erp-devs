// src/features/marketplace/components/AddressDropdown.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { HEADER_HEIGHT } from './GradientHeader';
import type { Address } from '../../profile/types/profile.types';
import type { DeliveryLocation } from '../../../store/deliveryLocationStore';

// ── Constants ─────────────────────────────────────────────────

const ANIMATION_DURATION = 250;
const MAX_DROPDOWN_HEIGHT = 360;

// ── Label icons ───────────────────────────────────────────────

function getLabelIcon(label: string): keyof typeof MaterialIcons.glyphMap {
  switch (label) {
    case 'Home':
      return 'home';
    case 'Work':
      return 'business';
    default:
      return 'location-on';
  }
}

// ── Props ─────────────────────────────────────────────────────

interface AddressDropdownProps {
  visible: boolean;
  onClose: () => void;
  onAddressAdded?: () => void;
}

// ── Component ─────────────────────────────────────────────────

export function AddressDropdown({ visible, onClose }: AddressDropdownProps) {
  const insets = useSafeAreaInsets();
  const { addresses, isLoading } = useAddresses();
  const { location, selectAddress } = useDeliveryLocationStore();

  const progress = useSharedValue(0);

  // ── Animate in/out ──────────────────────────────────────────

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible]);

  // ── Animated styles ─────────────────────────────────────────

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    pointerEvents: progress.value > 0 ? 'auto' as const : 'none' as const,
  }));

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.5, 1]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [-12, 0]),
      },
      {
        scale: interpolate(progress.value, [0, 1], [0.97, 1]),
      },
    ],
    pointerEvents: progress.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  // ── Handlers ────────────────────────────────────────────────

  const handleSelectAddress = (address: Address) => {
    const selected: DeliveryLocation = {
      source: 'saved',
      area: address.city ?? address.label ?? 'Saved Address',
      addressLine: [
        address.address_line_1,
        address.city,
        address.pincode,
      ]
        .filter(Boolean)
        .join(', '),
      latitude: address.latitude ? Number(address.latitude) : null,
      longitude: address.longitude ? Number(address.longitude) : null,
      addressId: address.id,
    };

    selectAddress(selected);
    onClose();
  };

  const handleAddAddress = () => {
    onClose();
    // Small delay to let the dropdown close animation start
    setTimeout(() => {
      router.push('/profile/address/new' as any);
    }, 100);
  };

  // ── Check if address is currently selected ──────────────────

  const isSelected = (address: Address): boolean => {
    if (location.source !== 'saved') return false;
    return location.addressId === address.id;
  };

  // ── Don't render anything if never opened ───────────────────

  const topOffset = HEADER_HEIGHT + insets.top;

  return (
    <>
      {/* ── Backdrop ── */}
      <Animated.View
        style={[
          styles.backdrop,
          { top: topOffset },
          backdropStyle,
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* ── Dropdown panel ── */}
      <Animated.View
        style={[
          styles.dropdown,
          { top: topOffset },
          dropdownStyle,
        ]}
      >
        {/* Header */}
        <View style={styles.dropdownHeader}>
          <Text style={styles.dropdownTitle}>Deliver to</Text>
          {location.source !== 'fallback' && (
            <View style={styles.currentBadge}>
              <Ionicons
                name={location.source === 'gps' ? 'navigate' : 'location'}
                size={10}
                color="#6366f1"
              />
              <Text style={styles.currentBadgeText}>
                {location.source === 'gps' ? 'GPS' : 'Saved'}
              </Text>
            </View>
          )}
        </View>

        {/* Address list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={32} color="#94a3b8" />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <Text style={styles.emptySubtext}>
              Add an address to get started
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.addressList}
            contentContainerStyle={styles.addressListContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {addresses.map((address) => {
              const selected = isSelected(address);

              return (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressRow,
                    selected && styles.addressRowSelected,
                  ]}
                  onPress={() => handleSelectAddress(address)}
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.addressIcon,
                      selected && styles.addressIconSelected,
                    ]}
                  >
                    <MaterialIcons
                      name={getLabelIcon(address.label)}
                      size={18}
                      color={selected ? '#ffffff' : '#64748b'}
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.addressTextBlock}>
                    <View style={styles.addressLabelRow}>
                      <Text
                        style={[
                          styles.addressLabel,
                          selected && styles.addressLabelSelected,
                        ]}
                      >
                        {address.label === 'Other' && address.custom_label
                          ? address.custom_label
                          : address.label}
                      </Text>
                      {address.is_default && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={styles.addressLine}
                      numberOfLines={1}
                    >
                      {[
                        address.address_line_1,
                        address.city,
                        address.pincode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>

                  {/* Check */}
                  {selected && (
                    <Ionicons name="checkmark-circle" size={22} color="#6366f1" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Add address button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAddress}
          activeOpacity={0.7}
        >
          <View style={styles.addButtonIcon}>
            <MaterialIcons name="add" size={18} color="#6366f1" />
          </View>
          <Text style={styles.addButtonText}>Add new address</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 98,
  },
  backdropPressable: {
    flex: 1,
  },

  // Dropdown panel
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    maxHeight: MAX_DROPDOWN_HEIGHT,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },

  // Header
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownTitle: {
    ...Typography.h4,
    color: '#0f172a',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    ...Typography.caption,
    color: '#6366f1',
    fontFamily: 'Inter_600SemiBold',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.small,
    color: '#94a3b8',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: '#475569',
    marginTop: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.caption,
    color: '#94a3b8',
  },

  // Address list
  addressList: {
    maxHeight: 240,
  },
  addressListContent: {
    paddingVertical: Spacing.xs,
  },

  // Address row
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginVertical: 2,
    borderRadius: 12,
  },
  addressRowSelected: {
    backgroundColor: '#f0f0ff',
  },

  // Address icon
  addressIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addressIconSelected: {
    backgroundColor: '#6366f1',
  },

  // Address text
  addressTextBlock: {
    flex: 1,
    gap: 2,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabel: {
    ...Typography.bodySemiBold,
    color: '#0f172a',
  },
  addressLabelSelected: {
    color: '#6366f1',
  },
  addressLine: {
    ...Typography.caption,
    color: '#64748b',
  },

  // Default badge
  defaultBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    ...Typography.bodySemiBold,
    color: '#6366f1',
  },
});