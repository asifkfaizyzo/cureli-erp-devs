// src/features/marketplace/components/AddressDropdown.tsx

import React, { useEffect, useCallback } from 'react';
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { Radius } from '../../../theme/radius';
import { HEADER_HEIGHT } from '../constants/marketplace.constants';

import type { Address } from '../../profile/types/profile.types';
import type { DeliveryLocation } from '../../../store/deliveryLocationStore';

// ── Constants ─────────────────────────────────────────────────

const ANIMATION_DURATION = 250;
const MAX_LIST_HEIGHT     = 240;

// ── Helpers ───────────────────────────────────────────────────

function getLabelIcon(label: string): keyof typeof MaterialIcons.glyphMap {
  switch (label) {
    case 'Home': return 'home';
    case 'Work': return 'business';
    default:     return 'location-on';
  }
}

function buildDeliveryLocation(address: Address): DeliveryLocation {
  return {
    source:      'saved',
    area:        address.city ?? address.label ?? 'Saved Address',
    addressLine: [address.address_line_1, address.city, address.pincode]
      .filter(Boolean)
      .join(', '),
    latitude:    address.latitude  ? Number(address.latitude)  : null,
    longitude:   address.longitude ? Number(address.longitude) : null,
    addressId:   address.id,
  };
}

// ── Props ─────────────────────────────────────────────────────

interface AddressDropdownProps {
  visible: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────

export function AddressDropdown({ visible, onClose }: AddressDropdownProps) {
  const insets      = useSafeAreaInsets();
  const { colors }  = useTheme();
  const { addresses, isLoading } = useAddresses();
  const { location, selectAddress } = useDeliveryLocationStore();

  const progress = useSharedValue(0);

  // ── Animation ────────────────────────────────────────────────

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing:   Easing.out(Easing.cubic),
    });
  }, [visible, progress]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity:       interpolate(progress.value, [0, 1], [0, 1]),
    pointerEvents: (progress.value > 0 ? 'auto' : 'none') as 'auto' | 'none',
  }));

  const panelAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.5, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-10, 0]) },
      { scale:      interpolate(progress.value, [0, 1], [0.98, 1]) },
    ],
    pointerEvents: (progress.value > 0.5 ? 'auto' : 'none') as 'auto' | 'none',
  }));

  // ── Handlers ─────────────────────────────────────────────────

  const handleSelect = useCallback((address: Address) => {
    selectAddress(buildDeliveryLocation(address));
    onClose();
  }, [selectAddress, onClose]);

  const handleAddAddress = useCallback(() => {
    onClose();
    setTimeout(() => router.push('/profile/address/new' as any), 120);
  }, [onClose]);

  const isSelected = useCallback((address: Address): boolean =>
    location.source === 'saved' && location.addressId === address.id,
  [location]);

  // ── Layout ───────────────────────────────────────────────────

  const topOffset = HEADER_HEIGHT + insets.top;

  // ── Derived colours from theme ────────────────────────────────

  const panelBg        = colors.background.elevated;
  const headerBorder   = colors.border.subtle;
  const titleColor     = colors.text.primary;
  const badgeBg        = colors.background.accent;
  const badgeText      = colors.brand.mid;
  const mutedText      = colors.text.muted;
  const faintText      = colors.text.faint;
  const rowSelectedBg  = colors.background.tint;
  const iconDefaultBg  = colors.background.card;
  const iconSelectedBg = colors.brand.mid;
  const labelSelected  = colors.brand.mid;
  const checkColor     = colors.brand.soft;
  const addIconBg      = colors.background.accent;
  const addTextColor   = colors.brand.mid;
  const dividerColor   = colors.border.subtle;
  const emptyIconColor = colors.text.faint;
  const defaultBadgeBg = colors.status.warningBg;
  const defaultBadgeTx = colors.status.warning;

  // ── Render ───────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { top: topOffset },
          backdropAnimStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            top:             topOffset,
            backgroundColor: panelBg,
            // Themed shadow colour (dark mode needs a lighter shadow tint)
            shadowColor: colors.brand.primary,
          },
          panelAnimStyle,
        ]}
      >
        {/* ── Header ── */}
        <View style={[styles.panelHeader, { borderBottomColor: headerBorder }]}>
          <Text style={[styles.panelTitle, { color: titleColor }]}>
            Deliver to
          </Text>

          {location.source !== 'fallback' && (
            <View style={[styles.sourceBadge, { backgroundColor: badgeBg }]}>
              <Ionicons
                name={location.source === 'gps' ? 'navigate' : 'location'}
                size={10}
                color={badgeText}
              />
              <Text style={[styles.sourceBadgeText, { color: badgeText }]}>
                {location.source === 'gps' ? 'GPS' : 'Saved'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Body ── */}
        {isLoading ? (
          <View style={styles.centreSlot}>
            <ActivityIndicator size="small" color={colors.brand.soft} />
            <Text style={[styles.centreText, { color: mutedText }]}>
              Loading addresses…
            </Text>
          </View>

        ) : addresses.length === 0 ? (
          <View style={styles.centreSlot}>
            <MaterialIcons name="location-off" size={32} color={emptyIconColor} />
            <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
              No saved addresses
            </Text>
            <Text style={[styles.emptySubtitle, { color: faintText }]}>
              Add an address to get started
            </Text>
          </View>

        ) : (
          <ScrollView
            style={{ maxHeight: MAX_LIST_HEIGHT }}
            contentContainerStyle={styles.listContent}
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
                    selected && { backgroundColor: rowSelectedBg },
                  ]}
                  onPress={() => handleSelect(address)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${address.label} — ${address.address_line_1}`}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: selected ? iconSelectedBg : iconDefaultBg },
                    ]}
                  >
                    <MaterialIcons
                      name={getLabelIcon(address.label)}
                      size={17}
                      color={selected ? '#ffffff' : colors.text.muted}
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.rowText}>
                    <View style={styles.rowLabelLine}>
                      <Text
                        style={[
                          styles.rowLabel,
                          { color: selected ? labelSelected : titleColor },
                        ]}
                      >
                        {address.label === 'Other' && address.custom_label
                          ? address.custom_label
                          : address.label}
                      </Text>

                      {address.is_default && (
                        <View
                          style={[
                            styles.defaultBadge,
                            { backgroundColor: defaultBadgeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.defaultBadgeText,
                              { color: defaultBadgeTx },
                            ]}
                          >
                            Default
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[styles.rowAddressLine, { color: faintText }]}
                      numberOfLines={1}
                    >
                      {[address.address_line_1, address.city, address.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>

                  {/* Checkmark */}
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={checkColor}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── Add address ── */}
        <TouchableOpacity
          style={[styles.addRow, { borderTopColor: dividerColor }]}
          onPress={handleAddAddress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
        >
          <View style={[styles.rowIcon, { backgroundColor: addIconBg }]}>
            <MaterialIcons name="add" size={18} color={addTextColor} />
          </View>
          <Text style={[styles.addText, { color: addTextColor }]}>
            Add new address
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────
// Only structural / layout values live here.
// All colour values are injected inline from the theme above.

const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    position:        'absolute',
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex:          98,
  },

  // Panel
  panel: {
    position:              'absolute',
    left:                  0,
    right:                 0,
    zIndex:                99,
    borderBottomLeftRadius:  16,
    borderBottomRightRadius: 16,
    // Shadow
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius:  20,
    elevation:     16,
  },

  // Panel header
  panelHeader: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
    borderBottomWidth: 1,
  },
  panelTitle: {
    ...Typography.h4,
  },
  sourceBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:   10,
  },
  sourceBadgeText: {
    ...Typography.caption,
    fontFamily: 'Inter_600SemiBold',
  },

  // Centre slot (loading / empty)
  centreSlot: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: Spacing.xl,
    gap:             Spacing.xs,
  },
  centreText: {
    ...Typography.small,
  },
  emptyTitle: {
    ...Typography.bodyMedium,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.caption,
  },

  // Address list
  listContent: {
    paddingVertical: Spacing.xs,
  },

  // Address row
  addressRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.md,
    marginHorizontal:  Spacing.sm,
    marginVertical:    2,
    borderRadius:      Radius.md,
  },

  // Row icon
  rowIcon: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  // Row text block
  rowText: {
    flex: 1,
    gap:  2,
  },
  rowLabelLine: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  rowLabel: {
    ...Typography.bodySemiBold,
  },
  rowAddressLine: {
    ...Typography.caption,
  },

  // Default badge
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical:   1,
    borderRadius:      6,
  },
  defaultBadgeText: {
    fontSize:      9,
    fontFamily:    'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Checkmark
  checkIcon: {
    flexShrink: 0,
  },

  // Add row
  addRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.md,
    borderTopWidth:    1,
  },
  addText: {
    ...Typography.bodySemiBold,
  },
});